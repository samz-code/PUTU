// supabase/functions/pesapal-submit-order/index.ts
//
// Deploy: supabase functions deploy pesapal-submit-order --no-verify-jwt
//
// Required secrets (supabase secrets set KEY=value):
//   PESAPAL_CONSUMER_KEY
//   PESAPAL_CONSUMER_SECRET
//   PESAPAL_ENV            "sandbox" or "live"
//   PESAPAL_IPN_ID         the notification_id returned by a one-time
//                          /api/URLSetup/RegisterIPN call (see SETUP.md)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SITE_URL               e.g. https://pututravels.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const PESAPAL_BASE =
  Deno.env.get('PESAPAL_ENV') === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderPayload {
  edition_id: string;
  ticket_tier_id: string;
  full_name: string;
  email: string;
  phone: string;
  dietary_requirements?: string;
  social_handle?: string;
  quantity?: number;
}

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload: OrderPayload = await req.json();
    const { edition_id, ticket_tier_id, full_name, email, phone } = payload;
    const quantity = payload.quantity && payload.quantity > 0 ? payload.quantity : 1;

    if (!edition_id || !ticket_tier_id || !full_name || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const merchantReference = `HT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Step 1: atomically reserve stock + create pending registration
    const { data: regData, error: regError } = await supabase.rpc('create_ticket_registration', {
      p_edition_id: edition_id,
      p_ticket_tier_id: ticket_tier_id,
      p_full_name: full_name,
      p_email: email,
      p_phone: phone,
      p_dietary: payload.dietary_requirements || null,
      p_social: payload.social_handle || null,
      p_quantity: quantity,
      p_merchant_reference: merchantReference,
    });

    if (regError) throw regError;
    const result = regData?.[0];

    if (!result) throw new Error('No registration result returned');
    if (result.sold_out) {
      return new Response(JSON.stringify({ sold_out: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: PesaPal auth + submit order
    const token = await getPesapalToken();
    const [firstName, ...rest] = full_name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;

    const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        id: merchantReference,
        currency: result.currency,
        amount: result.amount_due,
        description: 'Her Turn ticket registration',
        callback_url: `${Deno.env.get('SITE_URL')}/her-turn/confirmation?ref=${merchantReference}`,
        notification_id: Deno.env.get('PESAPAL_IPN_ID'),
        billing_address: {
          email_address: email,
          phone_number: phone,
          first_name: firstName,
          last_name: lastName,
        },
      }),
    });

    const orderData = await orderRes.json();

    if (!orderData.redirect_url) {
      // PesaPal rejected the order — release the stock we reserved
      await supabase.rpc('release_ticket_registration', { p_registration_id: result.registration_id });
      throw new Error(`PesaPal order submission failed: ${JSON.stringify(orderData)}`);
    }

    await supabase
      .from('her_turn_registrations')
      .update({ pesapal_order_tracking_id: orderData.order_tracking_id })
      .eq('id', result.registration_id);

    await supabase.from('her_turn_payment_events').insert([
      {
        registration_id: result.registration_id,
        event_type: 'order_submitted',
        raw_payload: orderData,
      },
    ]);

    return new Response(
      JSON.stringify({
        redirect_url: orderData.redirect_url,
        merchant_reference: merchantReference,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('pesapal-submit-order error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});