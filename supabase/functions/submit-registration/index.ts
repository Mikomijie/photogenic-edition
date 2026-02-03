import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

const sendConfirmationEmail = async (data: RegistrationPayload, resend: Resend) => {
  const fullName = `${data.firstName} ${data.middleName !== 'none' ? data.middleName + ' ' : ''}${data.surname}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #666; width: 150px; }
        .value { color: #333; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        h1 { margin: 0; }
        .emoji { font-size: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">🎉</div>
          <h1>Registration Confirmed!</h1>
          <p>Photogenic Edition Photo Contest</p>
        </div>
        <div class="content">
          <p>Dear <strong>${data.firstName}</strong>,</p>
          <p>Thank you for registering for the <strong>Photogenic Edition Photo Contest</strong>! Your entry has been successfully submitted.</p>
          
          <div class="details">
            <h3>📋 Your Registration Details:</h3>
            <div class="detail-row">
              <span class="label">📧 Email:</span>
              <span class="value">${data.email}</span>
            </div>
            <div class="detail-row">
              <span class="label">👤 Full Name:</span>
              <span class="value">${fullName}</span>
            </div>
            <div class="detail-row">
              <span class="label">🎂 Age:</span>
              <span class="value">${data.age} years</span>
            </div>
            <div class="detail-row">
              <span class="label">🏠 State of Origin:</span>
              <span class="value">${data.stateOfOrigin}</span>
            </div>
            <div class="detail-row">
              <span class="label">📍 LGA:</span>
              <span class="value">${data.lga}</span>
            </div>
            <div class="detail-row">
              <span class="label">📸 Photo:</span>
              <span class="value">✅ Uploaded</span>
            </div>
            <div class="detail-row">
              <span class="label">🎥 Video:</span>
              <span class="value">✅ Uploaded</span>
            </div>
          </div>
          
          <p>We will review your submission and contact you with updates about the contest. Good luck! 🍀</p>
          
          <p>Best regards,<br><strong>Photogenic Edition Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply.</p>
          <p>© 2024 Photogenic Edition Photo Contest</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: 'Photogenic Edition <onboarding@resend.dev>',
      to: [data.email],
      subject: '🎉 Registration Confirmed - Photogenic Edition Photo Contest',
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send confirmation email:', error);
      return false;
    }
    
    console.log('Confirmation email sent to:', data.email);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const AIRTABLE_TOKEN = Deno.env.get('AIRTABLE_PERSONAL_ACCESS_TOKEN');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    // Validate token is present and looks like an Airtable Personal Access Token (starts with "pat")
    const tokenLen = AIRTABLE_TOKEN?.length ?? 0;
    const tokenLooksValid = !!AIRTABLE_TOKEN && tokenLen > 40 && AIRTABLE_TOKEN.toLowerCase().startsWith('pat');
    console.log('AIRTABLE_TOKEN present:', !!AIRTABLE_TOKEN, 'length:', tokenLen, 'looksValid:', tokenLooksValid);

    if (!AIRTABLE_TOKEN) {
      console.error('Missing AIRTABLE_PERSONAL_ACCESS_TOKEN secret');
      return new Response(
        JSON.stringify({ success: false, error: 'Server misconfigured: missing Airtable token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenLooksValid) {
      console.error('AIRTABLE_PERSONAL_ACCESS_TOKEN does not look like a valid Airtable PAT');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server misconfigured: invalid Airtable token format. Please update AIRTABLE_PERSONAL_ACCESS_TOKEN with a valid token that starts with "pat".',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

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

    // Prepare Airtable payload - using simple field names
    // Note: Airtable field names must match EXACTLY what's in your table
    const airtablePayload = {
      fields: {
        "Email": payload.email,
        "First Name": payload.firstName,
        "Middle Name": payload.middleName === 'none' ? '' : payload.middleName,
        "Surname": payload.surname,
        "Age": parseInt(payload.age),
        "State of Origin": payload.stateOfOrigin,
        "LGA": payload.lga,
      }
    };

    // Only add attachments if they exist and are valid data URLs
    if (payload.photoBase64 && payload.photoBase64.startsWith('data:')) {
      // For attachments, Airtable needs a publicly accessible URL, not base64
      // We'll skip attachments for now - they need to be uploaded to storage first
      console.log('Photo provided but skipping attachment (base64 not supported directly)');
    }
    if (payload.videoBase64 && payload.videoBase64.startsWith('data:')) {
      console.log('Video provided but skipping attachment (base64 not supported directly)');
    }

    console.log('Submitting to Airtable with fields:', Object.keys(airtablePayload.fields));

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
          success: false,
          error: 'Failed to submit to Airtable',
          airtableStatus: airtableResponse.status,
          details: airtableResult,
        }),
        // Always return 200 so the client doesn't throw a FunctionsHttpError; handle success via JSON
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully submitted registration to Airtable');

    // Send confirmation email
    let emailSent = false;
    if (resend) {
      emailSent = await sendConfirmationEmail(payload, resend);
    } else {
      console.log('Resend API key not configured, skipping confirmation email');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Registration submitted successfully',
        emailSent,
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
