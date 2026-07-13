import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Require a shared secret so the public function URL cannot be triggered by
  // anyone to send mass email. The cron job must send this header (or a
  // matching Bearer token). Fails closed if CRON_SECRET is unset.
  const cronSecret = Deno.env.get('CRON_SECRET')
  const provided = req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!cronSecret || provided !== cronSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if this is a weekly summary or renewal reminder
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'renewals'

    let emailsSent = 0

    if (type === 'weekly') {
      // Weekly summary - get users with weekly summary enabled
      const { data: prefs } = await supabase
        .from('user_notification_preferences')
        .select('user_id, email_reminders_enabled, weekly_summary_enabled')
        .eq('weekly_summary_enabled', true)

      for (const userPref of prefs || []) {
        // Get user email separately from auth.users
        const { data: userData } = await supabase
          .from('auth.users')
          .select('email, raw_user_meta_data')
          .eq('id', userPref.user_id)
          .single()
        
        const userEmail = userData?.email
        const userName = userData?.raw_user_meta_data?.display_name || 'there'
        if (!userEmail) continue

        // Get contract stats
        const { data: contracts } = await supabase
          .from('contracts')
          .select('provider_name, contract_type, monthly_cost, currency, next_renewal_date, end_date')
          .eq('user_id', userPref.user_id)

        const { data: recommendations } = await supabase
          .from('recommendations')
          .select('type, title, priority')
          .eq('user_id', userPref.user_id)
          .eq('status', 'pending')

        // Calculate stats
        const totalContracts = contracts?.length || 0
        const totalMonthly = contracts?.reduce((sum, c) => sum + (parseFloat(c.monthly_cost) || 0), 0) || 0
        const totalAnnual = totalMonthly * 12
        
        const upcomingRenewals = contracts?.filter(c => {
          if (!c.next_renewal_date) return false
          const daysUntil = Math.ceil((new Date(c.next_renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil > 0 && daysUntil <= 30
        }) || []

        const pendingRecommendations = recommendations?.length || 0
        const costSavings = recommendations
          ?.filter(r => r.type === 'cost_reduction')
          .reduce((sum, r) => sum + (parseFloat(r.title?.match(/\$[\d,]+/)?.[0]?.replace(/[$,]/g, '') || 0)), 0) || 0

        // Build weekly summary email
        const html = `
          <h2>Hi ${userName}!</h2>
          <p>Here's your weekly contract summary:</p>
          
          <h3>📊 Overview</h3>
          <ul>
            <li><strong>Total Contracts:</strong> ${totalContracts}</li>
            <li><strong>Monthly Spend:</strong> $${totalMonthly.toFixed(2)}</li>
            <li><strong>Annual Spend:</strong> $${totalAnnual.toFixed(2)}</li>
          </ul>
          
          ${upcomingRenewals.length > 0 ? `
          <h3>📅 Upcoming Renewals (30 days)</h3>
          <ul>
            ${upcomingRenewals.map(c => `<li><strong>${c.provider_name}</strong> - ${c.contract_type || 'contract'} - $${c.monthly_cost}</li>`).join('')}
          </ul>
          ` : ''}
          
          ${pendingRecommendations > 0 ? `
          <h3>💡 AI Recommendations</h3>
          <p>You have <strong>${pendingRecommendations}</strong> pending recommendations${costSavings > 0 ? ` that could save you <strong>$${costSavings}</strong>` : ''}.</p>
          ` : '<p>No pending recommendations. Great job keeping on top of your contracts!</p>'}
          
          <p><a href="https://clausemate.vercel.app">View all contracts →</a></p>
        `

        // Send email
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Clausemate <summary@clausemate.com>',
            to: userEmail,
            subject: `📊 Weekly Contract Summary - ${totalContracts} contracts, $${totalMonthly.toFixed(2)}/mo`,
            html,
          }),
        })

        if (response.ok) emailsSent++
      }

    } else {
      // Renewal reminders (default)
      const { data: prefs } = await supabase
        .from('user_notification_preferences')
        .select('user_id, email_reminders_enabled')
        .eq('email_reminders_enabled', true)

      for (const userPref of prefs || []) {
        // Get user email separately
        const { data: userData } = await supabase
          .from('auth.users')
          .select('email, raw_user_meta_data')
          .eq('id', userPref.user_id)
          .single()
        
        const userEmail = userData?.email
        const userName = userData?.raw_user_meta_data?.display_name || 'there'
        if (!userEmail) continue

        const { data: renewals } = await supabase
          .rpc('get_upcoming_renewals', {
            p_user_id: userPref.user_id,
            p_days: 60
          })

        if (!renewals?.length) continue

        const urgent = renewals.filter((r: any) => {
          const daysUntil = Math.ceil((new Date(r.next_renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil <= 7
        })

        const upcoming = renewals.filter((r: any) => {
          const daysUntil = Math.ceil((new Date(r.next_renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil > 7 && daysUntil <= 30
        })

        const later = renewals.filter((r: any) => {
          const daysUntil = Math.ceil((new Date(r.next_renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil > 30
        })

        let html = `<h2>Hi ${userName}!</h2>`
        
        if (urgent.length > 0) {
          html += `<h3>⚠️ Urgent - Renewals this week</h3><ul>`
          for (const c of urgent) {
            html += `<li><strong>${c.provider_name}</strong> - ${c.contract_type || 'contract'} - $${c.monthly_cost}</li>`
          }
          html += `</ul>`
        }

        if (upcoming.length > 0) {
          html += `<h3>📅 Coming up in 30 days</h3><ul>`
          for (const c of upcoming) {
            html += `<li><strong>${c.provider_name}</strong> - ${c.contract_type || 'contract'} - $${c.monthly_cost}</li>`
          }
          html += `</ul>`
        }

        if (later.length > 0) {
          html += `<h3>📆 Later (60+ days)</h3><ul>`
          for (const c of later.slice(0, 5)) {
            html += `<li><strong>${c.provider_name}</strong> - ${c.contract_type || 'contract'}</li>`
          }
          if (later.length > 5) html += `<li>...and ${later.length - 5} more</li>`
          html += `</ul>`
        }

        html += `<p><a href="https://clausemate.vercel.app">View all contracts →</a></p>`

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Clausemate <reminders@clausemate.com>',
            to: userEmail,
            subject: `🔔 Contract Renewal Reminder - ${urgent.length > 0 ? urgent.length + ' urgent' : renewals.length + ' upcoming'}`,
            html,
          }),
        })

        if (response.ok) emailsSent++
      }
    }

    return new Response(
      JSON.stringify({ success: true, type, emailsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
