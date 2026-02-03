import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

// Helper function to convert base64 data URL to blob
function base64ToBlob(dataUrl: string): { blob: Blob; mimeType: string; extension: string } | null {
  try {
    if (!dataUrl.startsWith('data:')) {
      console.log('Not a valid data URL');
      return null;
    }

    const [meta, base64Data] = dataUrl.split(',');
    if (!base64Data) {
      console.log('No base64 data found');
      return null;
    }

    const mimeMatch = meta.match(/^data:(.*?);/);
    const mimeType = mimeMatch?.[1] || 'application/octet-stream';
    
    // Determine file extension from mime type
    let extension = 'bin';
    if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) extension = 'jpg';
    else if (mimeType.includes('image/png')) extension = 'png';
    else if (mimeType.includes('video/mp4')) extension = 'mp4';
    else if (mimeType.includes('video/webm')) extension = 'webm';

    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    return { blob, mimeType, extension };
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    return null;
  }
}

// Upload file to Supabase Storage and return public URL
// deno-lint-ignore no-explicit-any
async function uploadToStorage(
  supabase: any,
  dataUrl: string,
  folder: string,
  email: string
): Promise<string | null> {
  try {
    const blobData = base64ToBlob(dataUrl);
    if (!blobData) {
      console.log('Failed to convert base64 to blob');
      return null;
    }

    const { blob, extension } = blobData;
    const timestamp = Date.now();
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${folder}/${sanitizedEmail}_${timestamp}.${extension}`;

    console.log(`Uploading ${folder} file: ${fileName}, size: ${blob.size} bytes`);

    const { data, error } = await supabase.storage
      .from('registrations')
      .upload(fileName, blob, {
        contentType: blobData.mimeType,
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${folder}:`, error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('registrations')
      .getPublicUrl(fileName);

    console.log(`Successfully uploaded ${folder}: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadToStorage for ${folder}:`, error);
    return null;
  }
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
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

    // Initialize Supabase client for storage
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
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

    // Upload photo and video to Supabase Storage
    let photoUrl: string | null = null;
    let videoUrl: string | null = null;

    if (payload.photoBase64 && payload.photoBase64.startsWith('data:')) {
      console.log('Uploading photo to storage...');
      photoUrl = await uploadToStorage(supabase, payload.photoBase64, 'photos', payload.email);
      if (photoUrl) {
        console.log('Photo uploaded successfully:', photoUrl);
      } else {
        console.log('Failed to upload photo, continuing without it');
      }
    }

    if (payload.videoBase64 && payload.videoBase64.startsWith('data:')) {
      console.log('Uploading video to storage...');
      videoUrl = await uploadToStorage(supabase, payload.videoBase64, 'videos', payload.email);
      if (videoUrl) {
        console.log('Video uploaded successfully:', videoUrl);
      } else {
        console.log('Failed to upload video, continuing without it');
      }
    }

    // Prepare Airtable payload with storage URLs
    const airtableFields: Record<string, unknown> = {
      "Email": payload.email,
      "First Name": payload.firstName,
      "Middle Name": payload.middleName === 'none' ? '' : payload.middleName,
      "Surname": payload.surname,
      "Age": parseInt(payload.age),
      "State of Origin": payload.stateOfOrigin,
      "LGA": payload.lga,
    };

    // Add attachments if we have URLs
    if (photoUrl) {
      airtableFields["Professional Photo"] = [{ url: photoUrl }];
    }
    if (videoUrl) {
      airtableFields["Introduction Video"] = [{ url: videoUrl }];
    }

    const airtablePayload = { fields: airtableFields };

    console.log('Submitting to Airtable with fields:', Object.keys(airtableFields));
    console.log('Photo URL:', photoUrl ? 'present' : 'none');
    console.log('Video URL:', videoUrl ? 'present' : 'none');

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
        photoUploaded: !!photoUrl,
        videoUploaded: !!videoUrl,
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
