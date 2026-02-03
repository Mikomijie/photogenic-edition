-- Create storage bucket for registration attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('registrations', 'registrations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to registration files
CREATE POLICY "Public can view registration files"
ON storage.objects FOR SELECT
USING (bucket_id = 'registrations');

-- Allow anonymous uploads to registration bucket (for the chatbot)
CREATE POLICY "Anyone can upload registration files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'registrations');