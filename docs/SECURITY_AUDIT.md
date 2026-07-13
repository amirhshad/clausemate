# Clausemate — Security Audit

**Date:** 2026-07-13
**Scope:** `api/index.py`, Supabase migrations & RLS, `supabase/functions/send-reminders`, storage handling, frontend auth (`frontend/src/`), secrets hygiene.
**Method:** Manual source review + secret scanning of tracked files.

## Summary

No live secrets are committed (`.env`/`frontend/.env` are gitignored; only `.env.example` placeholders are tracked). Authentication on the main HTTP API is sound — every non-health endpoint validates the Supabase JWT and scopes queries by `user_id`, and per-object ownership is re-checked on writes/deletes.

The material risks are **not** in the HTTP handler but at the **database boundary**: two overly-permissive Postgres objects let any signed-in user reach *other* users' data or degrade their service, and the storage-write path is vulnerable to path traversal because the API uploads with the service key (which bypasses storage RLS) using unsanitized filenames.

| # | Severity | Issue |
|---|----------|-------|
| 1 | **High** | `get_upcoming_renewals` is `SECURITY DEFINER` with a caller-supplied `p_user_id` and no `auth.uid()` check — cross-tenant data leak via RPC |
| 2 | **High** | Storage path traversal: service-key upload writes `{user_id}/{contract_id}/{filename}` with unsanitized `filename` |
| 3 | **High** | `api_rate_limits` RLS `FOR ALL USING(true)` — any user can reset their own limits or lock out another user |
| 4 | **Medium** | Overly-broad `WITH CHECK (true)` INSERT policies on `recommendations` and `contract_analyses` allow forging rows for arbitrary `user_id` |
| 5 | **Medium** | `send-reminders` edge function has no committed `verify_jwt`/auth guard — potential mass-email abuse |
| 6 | **Medium** | CORS `Access-Control-Allow-Origin: *` on all authenticated API responses |
| 7 | **Medium** | Rate limiting fails open and is non-atomic (check-then-insert race) |
| 8 | **Low** | Error responses leak exception text and raw AI output to clients |
| 9 | **Low** | No file-type/size validation on uploads |
| 10 | **Low** | `contract_chunks` has no DELETE RLS policy |

## Remediation status (2026-07-13)

- **#1, #3, #4 — fixed & live.** Applied to the Supabase project as migration `security_hardening_cross_tenant` and verified in-database (`get_upcoming_renewals` raises for cross-tenant callers; `api_rate_limits`, `recommendations`, and `contract_analyses` policies scoped to `service_role`). Repo copy: `supabase/migrations/010_security_hardening.sql`.
- **#2 — fixed in code.** `sanitize_filename()` applied at all storage-path construction sites in `api/index.py`. Ships on next deploy.
- **#5 — fixed in code.** `send-reminders` now requires a `CRON_SECRET` shared secret (via `x-cron-secret` header or Bearer token) and fails closed. **Action required:** set the `CRON_SECRET` secret on the function and update the cron invocation to send the header, or reminder emails will 401 after the function is deployed.
- **#6 — fixed in code.** Wildcard CORS replaced with an origin allowlist (prod + localhost; extend via `CORS_ALLOWED_ORIGINS`).
- **#7 — fixed.** Rate limiter now fails closed and logs on error. The check-then-insert race is also closed: migration 011 adds `check_and_log_rate_limit`, a `SECURITY DEFINER` function that serializes count+insert under a per-key advisory lock and is execute-granted to `service_role` only. Applied and verified live.
- **#8 — fixed in code.** Error responses no longer echo exception text or raw AI output; details are logged server-side and clients get generic messages.
- **#9 — fixed in code.** Uploads are validated for PDF signature and per-file/total size, with an early `Content-Length` guard (HTTP 413) before the body is read.
- **#10 — fixed.** Migration 011 adds the missing `DELETE` policy on `contract_chunks` (scoped to contract ownership). Applied and verified live.

All audit findings (#1–#10) are now remediated. DB changes are live on the Supabase project; code changes ship on the next deploy of `api/index.py` (and `send-reminders`, which additionally needs `CRON_SECRET` set — see #5).

---

## Findings

### 1. HIGH — `get_upcoming_renewals` leaks other users' contracts (IDOR via RPC)
`supabase/migrations/006_notification_preferences.sql`

```sql
CREATE FUNCTION get_upcoming_renewals(p_user_id UUID, p_days INTEGER DEFAULT 30)
... SECURITY DEFINER
  WHERE c.user_id = p_user_id
```

The function runs as its owner (`SECURITY DEFINER`), so it bypasses RLS on `contracts`, and it trusts the caller-supplied `p_user_id` without verifying it equals `auth.uid()`. Postgres grants `EXECUTE` to `PUBLIC` by default and Supabase exposes functions over RPC to the `authenticated`/`anon` roles. Any user holding the public anon key (shipped in the frontend bundle) can call:

```js
supabase.rpc('get_upcoming_renewals', { p_user_id: '<any-user-uuid>', p_days: 3650 })
```

and receive that user's provider names, costs, and renewal dates.

**Fix:** Either add `IF p_user_id <> auth.uid() THEN RAISE EXCEPTION ... END IF;` inside the function, drop the `p_user_id` parameter and use `auth.uid()` directly, or `REVOKE EXECUTE ... FROM anon, authenticated` and call it only with the service key.

### 2. HIGH — Storage path traversal on upload
`api/index.py` (`/api/upload/confirm` ~L1612, `/add-files` ~L2141)

```python
file_path = f"{user_id}/{contract_id}/{filename}"
supabase.storage.from_("contracts").upload(file_path, file_content, ...)
```

`filename` comes straight from the multipart body (`parse_multipart_files`) and is never sanitized. The upload uses the **service key**, so the storage RLS policy (`(storage.foldername(name))[1] = auth.uid()`) is bypassed. A filename like `../../<victim_uuid>/<contract>/statement.pdf` lets a user write objects into another user's storage prefix (overwrite/plant files). The same unsanitized value is persisted to `contract_files.file_path`/`file_name`.

**Fix:** Sanitize before building the path — `os.path.basename(filename)`, reject/replace `..`, `/`, `\`, control chars, and enforce a max length. Consider generating a server-side UUID filename and storing the original name only as a display label.

### 3. HIGH — `api_rate_limits` RLS lets users manipulate each other's limits
`supabase/migrations/008_create_api_rate_limits.sql`

```sql
CREATE POLICY "Service role full access" ON api_rate_limits
    FOR ALL USING (true) WITH CHECK (true);
```

`FOR ALL` with `USING(true)/WITH CHECK(true)` applies to the `authenticated` and `anon` roles too, not just the service role. Using the anon key directly a user can:
- `DELETE` their own rows to reset their AI rate limit, or
- `INSERT` rows with a **victim's** `user_id` + endpoint to exhaust their quota (targeted denial of service on the expensive AI endpoints), or
- read every user's API-usage pattern.

**Fix:** Restrict the policy to the service role, e.g. `USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role')`, or `TO service_role`. Regular users never touch this table directly.

### 4. MEDIUM — Forgeable INSERTs on `recommendations` and `contract_analyses`
`002_create_recommendations.sql`, `009_create_contract_analyses.sql`

```sql
CREATE POLICY "Service role can insert recommendations"
    FOR INSERT WITH CHECK (true);
```

`WITH CHECK (true)` on INSERT is not scoped to the service role, so any anon-key client can insert recommendation/analysis rows containing an arbitrary `user_id` and attacker-controlled `title`/`description`. Because those fields are rendered in the dashboard (and the weekly email), this enables cross-user data pollution and a stored-content vector.

**Fix:** Change the check to `auth.role() = 'service_role'` (or `TO service_role`). The API already inserts these with the service key, so legitimate flows are unaffected.

### 5. MEDIUM — `send-reminders` has no committed auth guard
`supabase/functions/send-reminders/index.ts`

The function runs `Deno.serve` with the service-role key and sends email via Resend to every opted-in user, but there is no `config.toml` in the repo setting `verify_jwt = true` and no shared-secret check inside the handler. If it is deployed with JWT verification off (the common pattern for cron-triggered functions), its public URL can be invoked by anyone to trigger mass emails — an email-bombing / cost-abuse vector. (Separately, `.from('auth.users')` won't resolve via PostgREST — a functional bug — but the security concern is the open trigger.)

**Fix:** Require a secret header (e.g. compare against a `CRON_SECRET` env var) at the top of the handler, or ensure it's invoked only via an authenticated schedule and set `verify_jwt = true`. Add the config to the repo so the posture is explicit.

### 6. MEDIUM — Wildcard CORS on authenticated endpoints
`api/index.py` (`send_json`, `do_OPTIONS`)

```python
self.send_header("Access-Control-Allow-Origin", "*")
```

Every response, including authenticated ones, allows any origin. The API uses bearer tokens (not cookies) so this isn't classic credentialed-CORS, but it means any website a logged-in user visits can script requests against the API with a token it obtains, and there's no origin allowlist to contain token misuse.

**Fix:** Echo back only an allowlisted origin (`https://clausemate.vercel.app` and local dev), and drop the wildcard.

### 7. MEDIUM — Rate limiting fails open and races
`api/index.py` `check_rate_limit` (~L82)

```python
except Exception:
    # If rate limit table doesn't exist yet, allow the request
    return True, None
```

Any DB error silently disables rate limiting on the paid AI endpoints. Also the logic is check-then-insert (two round trips), so concurrent requests can all pass the check before any insert lands, exceeding the cap.

**Fix:** Fail closed (or at least alert) on unexpected errors, distinguishing "table missing" from "query failed." For atomicity, insert-then-count or move the limit into a single transactional SQL function.

### 8. LOW — Error responses leak internals
`api/index.py` returns raw exception text and model output to clients:
`Invalid token: {str(e)}` (L1290/1395/2315/2363), `Failed to generate answer: {str(e)}` (L1911), and `AI returned non-JSON response. Preview: {preview}` (L2223/2285). Most handlers correctly use `report_error()` + a generic message; these are the exceptions. Return generic messages and log details server-side.

### 9. LOW — No upload content/size validation
Uploads are capped at 5 files but the handler trusts the `application/pdf` label without verifying magic bytes and enforces no per-file/total byte limit before reading the full body into memory (`maxDuration` 120s). A large or non-PDF payload can waste compute/AI cost. Add a size cap and a PDF signature check.

### 10. LOW — `contract_chunks` missing DELETE policy
`007_add_rag_support.sql` defines SELECT/INSERT but no DELETE policy; per-file chunk cleanup (`api/index.py` ~L2397) works only because it runs with the service key. Add a DELETE policy scoped to contract ownership for defense in depth.

---

## What's already good
- JWT is validated on every protected route via the anon-key client; `user_id` is derived from the token, never from the client.
- Per-object ownership re-checks before update/delete (`403 Forbidden` on mismatch).
- Base RLS on `contracts`, `contract_files`, `contract_chunks`, `recommendations`, `user_notification_preferences` correctly scopes SELECT to `auth.uid()`.
- Prompt-injection detection on document text/filenames, an untrusted-input security preamble in the extraction prompt, and output-schema validation that lowers confidence and flags suspicious results.
- No secrets committed; `.gitignore` covers `.env`, credentials, and tokens.
- No `subprocess`/`eval`/`shell=True`/`pickle` usage in Python.

## Suggested remediation order
1. Fix the three cross-tenant DB issues (#1, #3, #4) — one migration, low effort, highest impact.
2. Sanitize upload filenames (#2).
3. Lock down the reminders function (#5) and CORS (#6).
4. Harden rate limiting (#7) and trim error leakage (#8).
