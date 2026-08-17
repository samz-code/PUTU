// supabase/functions/pesapal-ipn/index.ts
//
// This is the URL you register with PesaPal's /api/URLSetup/RegisterIPN
// (see SETUP.md). PesaPal calls this endpoint (GET, with query params)
// whenever a transaction's status changes.
//
// Deploy: supabase functions deploy pesapal-ipn --no-verify-jwt
//
// Required secrets: same as pesapal-submit-order, plus nothing extra.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const PESAPAL_BASE =
  Deno.env.get('PESAPAL_ENV') === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';

async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: Deno.env.get('PESAPAL_CONSUMER_KEY'),
      consumer_secret: Deno.env.get('PESAPAL_CONSUMER_SECRET'),
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`PesaPal auth failed: ${JSON.stringify(data)}`);
  return data.token;
}

Deno.serve(async req => {
  const url = new URL(req.url);
  const orderTrackingId = url.searchParams.get('OrderTrackingId');
  const orderMerchantReference = url.searchParams.get('OrderMerchantReference');

  const respond = (status: number) =>
    new Response(
      JSON.stringify({
        orderNotificationType: 'IPNCHANGE',
        orderTrackingId,
        orderMerchantReference,
        status: 200,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  if (!orderTrackingId || !orderMerchantReference) {
    console.error('pesapal-ipn: missing tracking id or merchant reference', { orderTrackingId, orderMerchantReference });
    return respond(400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { data: registration, error: fetchError } = await supabase
      .from('her_turn_registrations')
      .select('id, status, amount_due, edition_id, full_name, email, phone, qr_token')
      .eq('merchant_reference', orderMerchantReference)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!registration) {
      console.error('pesapal-ipn: no registration found for', orderMerchantReference);
      return respond(404);
    }

    // Idempotency: if already processed, just acknowledge
    if (registration.status === 'paid' || registration.status === 'checked_in') {
      return respond(200);
    }

    const token = await getPesapalToken();
    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
    );
    const statusData = await statusRes.json();

    await supabase.from('her_turn_payment_events').insert([
      {
        registration_id: registration.id,
        event_type: 'ipn_received',
        pesapal_status: statusData.payment_status_description || statusData.status_code,
        raw_payload: statusData,
      },
    ]);

    // status_code: 0 = Invalid, 1 = Completed, 2 = Failed, 3 = Reversed
    if (statusData.status_code === 1) {
      const { error: confirmError } = await supabase.rpc('confirm_ticket_payment', {
        p_registration_id: registration.id,
        p_amount_paid: statusData.amount ?? registration.amount_due,
        p_tracking_id: orderTrackingId,
      });
      if (confirmError) throw confirmError;

      // Fire-and-forget confirmation email + SMS with the e-ticket QR
      supabase.functions
        .invoke('send-her-turn-notification', {
          body: {
            mode: 'ticket_confirmation',
            registration_id: registration.id,
          },
        })
        .catch(err => console.error('Failed to trigger confirmation notification:', err));
    } else if (statusData.status_code === 2 || statusData.status_code === 3) {
      await supabase.rpc('release_ticket_registration', { p_registration_id: registration.id });
    }
    // status_code 0 (still pending) — leave as-is, PesaPal will call again

    return respond(200);
  } catch (err) {
    console.error('pesapal-ipn error:', err);
    return respond(500);
  }
});