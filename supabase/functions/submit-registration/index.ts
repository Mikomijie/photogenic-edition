import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegistrationPayload {
  email: string;
  firstName: string;
  middleName: string;
  surname: string;
  age: string;
  stateOfOrigin: string;
  lga: string;
  photoBase64: string;
  videoBase64: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const AIRTABLE_TOKEN = Deno.env.get('AIRTABLE_PERSONAL_ACCESS_TOKEN');
    
    if (!AIRTABLE_TOKEN) {
      console.error('Missing AIRTABLE_PERSONAL_ACCESS_TOKEN secret');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: RegistrationPayload = await req.json();
    console.log('Received registration payload for:', payload.email);

    // Validate required fields
    const requiredFields = ['email', 'firstName', 'surname', 'age', 'stateOfOrigin', 'lga'];
    for (const field of requiredFields) {
      if (!payload[field as keyof RegistrationPayload]) {
        console.error(`Missing required field: ${field}`);
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare Airtable payload
    const airtablePayload = {
      fields: {
        "Email": payload.email,
        "First Name": payload.firstName,
        "Middle Name": payload.middleName === 'none' ? '' : payload.middleName,
        "Surname": payload.surname,
        "Age": parseInt(payload.age),
        "State of Origin": payload.stateOfOrigin,
        "LGA": payload.lga,
        "Professional Photo": payload.photoBase64 ? [{ url: payload.photoBase64 }] : [],
        "Introduction Video": payload.videoBase64 ? [{ url: payload.videoBase64 }] : [],
      }
    };

    console.log('Submitting to Airtable...');

    // Submit to Airtable
    const airtableResponse = await fetch(
      'https://api.airtable.com/v0/appBWrXuSofOgnAgx/Table%201',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtablePayload),
      }
    );

    const airtableResult = await airtableResponse.text();
    console.log('Airtable response status:', airtableResponse.status);
    console.log('Airtable response:', airtableResult);

    if (!airtableResponse.ok) {
      console.error('Airtable API error:', airtableResult);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to submit to Airtable', 
          details: airtableResult 
        }),
        { status: airtableResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully submitted registration to Airtable');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Registration submitted successfully',
        record: JSON.parse(airtableResult)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing registration:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
