// supabase/functions/send-her-turn-notification/index.ts
//
// Two modes:
//  1. { mode: 'ticket_confirmation', registration_id }
//     Sends the e-ticket (with QR code image) to a single attendee by email,
//     plus an SMS receipt. Called automatically by pesapal-ipn.
//  2. { mode: 'broadcast', edition_id, channel: 'email' | 'sms', subject?, message, sent_by? }
//     Sends an announcement/reminder to every PAID attendee of an edition.
//     Called from the admin Notifications tab.
//
// Deploy: supabase functions deploy send-her-turn-notification --no-verify-jwt
//
// Required secrets:
//   RESEND_API_KEY, RESEND_FROM        (e.g. "Her Turn <hello@pututravels.com>")
//   AT_API_KEY, AT_USERNAME, AT_SENDER_ID   (Africa's Talking)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function qrImageUrl(token: string, size = 300) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(token)}`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: Deno.env.get('RESEND_FROM'), to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error (${res.status}): ${body}`);
  }
}

async function sendSms(to: string, message: string) {
  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      apiKey: Deno.env.get('AT_API_KEY')!,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      username: Deno.env.get('AT_USERNAME')!,
      to,
      message,
      from: Deno.env.get('AT_SENDER_ID') || '',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Africa's Talking error (${res.status}): ${body}`);
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json();

    if (body.mode === 'ticket_confirmation') {
      const { data: reg, error } = await supabase
        .from('her_turn_registrations')
        .select('id, full_name, email, phone, qr_token, amount_paid, currency, edition_id, ticket_tier_id')
        .eq('id', body.registration_id)
        .maybeSingle();
      if (error) throw error;
      if (!reg) throw new Error('Registration not found');

      const { data: edition } = await supabase
        .from('her_turn_editions')
        .select('title, start_date, end_date, venue_name, venue_address')
        .eq('id', reg.edition_id)
        .maybeSingle();

      const { data: tier } = await supabase
        .from('her_turn_ticket_tiers')
        .select('name')
        .eq('id', reg.ticket_tier_id)
        .maybeSingle();

      const qrUrl = qrImageUrl(reg.qr_token);
      const html = `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:16px;">
          <p style="color:#783190;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Her Turn — E-Ticket Confirmed</p>
          <h2 style="color:#2c1a2e;margin:8px 0;">${edition?.title || 'Her Turn Event'}</h2>
          <p style="color:#555;font-size:14px;">Hi ${reg.full_name}, your spot is confirmed.</p>
          <table style="width:100%;font-size:13px;color:#444;margin:16px 0;">
            <tr><td style="padding:4px 0;">Ticket</td><td style="text-align:right;font-weight:600;">${tier?.name || ''}</td></tr>
            <tr><td style="padding:4px 0;">Dates</td><td style="text-align:right;">${edition?.start_date || ''} – ${edition?.end_date || ''}</td></tr>
            <tr><td style="padding:4px 0;">Venue</td><td style="text-align:right;">${edition?.venue_name || ''}</td></tr>
            <tr><td style="padding:4px 0;">Amount Paid</td><td style="text-align:right;font-weight:600;">${reg.currency} ${reg.amount_paid}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0;">
            <img src="${qrUrl}" alt="Your e-ticket QR code" width="220" height="220" />
            <p style="color:#888;font-size:11px;margin-top:8px;">Show this QR code at check-in</p>
          </div>
        </div>`;

      await sendEmail(reg.email, `Your Her Turn E-Ticket — ${edition?.title || ''}`, html);

      try {
        await sendSms(
          reg.phone,
          `Her Turn: Your ticket for ${edition?.title || 'the event'} is confirmed. Check your email for your QR e-ticket.`
        );
      } catch (smsErr) {
        // Don't fail the whole request if SMS fails — email is the source of truth
        console.error('SMS send failed:', smsErr);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.mode === 'broadcast') {
      const { edition_id, channel, subject, message, sent_by } = body;
      if (!edition_id || !channel || !message) {
        throw new Error('edition_id, channel, and message are required');
      }

      const { data: registrations, error } = await supabase
        .from('her_turn_registrations')
        .select('full_name, email, phone')
        .eq('edition_id', edition_id)
        .in('status', ['paid', 'checked_in']);
      if (error) throw error;

      let sentCount = 0;
      for (const r of registrations || []) {
        try {
          if (channel === 'email') {
            await sendEmail(
              r.email,
              subject || 'An update from Her Turn',
              `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                <p>Hi ${r.full_name},</p>
                <p style="white-space:pre-wrap;">${message}</p>
                <p style="color:#888;font-size:12px;margin-top:24px;">— The Her Turn Team</p>
              </div>`
            );
          } else {
            await sendSms(r.phone, message);
          }
          sentCount++;
        } catch (sendErr) {
          console.error(`Broadcast send failed for ${r.email || r.phone}:`, sendErr);
        }
      }

      await supabase.from('her_turn_notification_log').insert([
        {
          edition_id,
          channel,
          subject: subject || null,
          message,
          recipient_count: sentCount,
          sent_by: sent_by || null,
        },
      ]);

      return new Response(JSON.stringify({ success: true, sent: sentCount, total: (registrations || []).length }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown mode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-her-turn-notification error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});