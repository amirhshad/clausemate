-- Migration 011: atomic rate-limit counter + contract_chunks DELETE policy.
-- Addresses the check-then-insert race in the rate limiter (#7) and the missing
-- DELETE policy on contract_chunks (#10).

-- ---------------------------------------------------------------------------
-- #10: contract_chunks was missing a DELETE policy; per-file cleanup only
--      worked via the service key. Add one scoped to contract ownership.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can delete own chunks" ON contract_chunks;
CREATE POLICY "Users can delete own chunks" ON contract_chunks
    FOR DELETE USING (
        contract_id IN (SELECT id FROM contracts WHERE user_id = auth.uid())
    );

-- ---------------------------------------------------------------------------
-- #7 (race): atomic check-and-log. A per-key advisory lock serializes the
--      count+insert within the transaction so concurrent requests for the same
--      user+endpoint cannot all pass a pre-insert check. Returns TRUE if the
--      request is allowed (and logs it), FALSE if the limit is exceeded.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_and_log_rate_limit(
    p_user_id uuid,
    p_endpoint text,
    p_max integer,
    p_window_minutes integer
) RETURNS boolean AS $$
DECLARE
    v_count integer;
BEGIN
    -- Serialize concurrent checks for this user+endpoint for the txn duration.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_endpoint, 0));

    SELECT count(*) INTO v_count
    FROM api_rate_limits
    WHERE user_id = p_user_id
      AND endpoint = p_endpoint
      AND created_at >= now() - make_interval(mins => p_window_minutes);

    IF v_count >= p_max THEN
        RETURN false;
    END IF;

    INSERT INTO api_rate_limits (user_id, endpoint) VALUES (p_user_id, p_endpoint);
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lock down execution: only the service role (used by the API) may call it,
-- so a user cannot log rate-limit rows for arbitrary user_ids via RPC.
REVOKE ALL ON FUNCTION check_and_log_rate_limit(uuid, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION check_and_log_rate_limit(uuid, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION check_and_log_rate_limit(uuid, text, integer, integer) TO service_role;
