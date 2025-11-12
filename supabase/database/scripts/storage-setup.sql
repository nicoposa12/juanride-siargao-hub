    -- JuanRide Storage Buckets Configuration
    -- Run this in Supabase SQL Editor after creating buckets manually

    -- ============================================================================
    -- CREATE STORAGE BUCKETS
    -- ============================================================================
    -- Note: Buckets should be created via Supabase Dashboard first
    -- This file configures the policies for those buckets

    -- ============================================================================
    -- VEHICLE IMAGES BUCKET
    -- ============================================================================
    -- Public bucket for vehicle photos

    -- Policy: Anyone can view vehicle images
    CREATE POLICY "Anyone can view vehicle images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'vehicle-images');

    -- Policy: Authenticated owners can upload vehicle images
    CREATE POLICY "Owners can upload vehicle images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'vehicle-images' AND
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

    -- Policy: Owners can update their own vehicle images
    CREATE POLICY "Owners can update own vehicle images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'vehicle-images' AND
        auth.role() = 'authenticated' AND
        (
            -- Owner of the vehicle in the path
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.vehicles WHERE owner_id = auth.uid()
            ) OR
            -- Admin can update any
            EXISTS (
                SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

    -- Policy: Owners can delete their own vehicle images
    CREATE POLICY "Owners can delete own vehicle images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'vehicle-images' AND
        auth.role() = 'authenticated' AND
        (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM public.vehicles WHERE owner_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

    -- ============================================================================
    -- USER DOCUMENTS BUCKET
    -- ============================================================================
    -- Private bucket for ID verification and documents

    -- Policy: Users can view their own documents
    CREATE POLICY "Users can view own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'user-documents' AND
        auth.role() = 'authenticated' AND
        (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

    -- Policy: Users can upload their own documents
    CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'user-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Policy: Users can update their own documents
    CREATE POLICY "Users can update own documents"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'user-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Policy: Users can delete their own documents
    CREATE POLICY "Users can delete own documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'user-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

    -- ============================================================================
    -- PROFILE IMAGES BUCKET
    -- ============================================================================
    -- Public bucket for user profile pictures

    -- Policy: Anyone can view profile images
    CREATE POLICY "Anyone can view profile images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-images');

    -- Policy: Users can upload their own profile image
    CREATE POLICY "Users can upload own profile image"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Policy: Users can update their own profile image
    CREATE POLICY "Users can update own profile image"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Policy: Users can delete their own profile image
    CREATE POLICY "Users can delete own profile image"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

    -- ============================================================================
    -- STORAGE HELPER FUNCTIONS
    -- ============================================================================

    -- Function to get signed URL for private storage
    CREATE OR REPLACE FUNCTION public.get_signed_url(
        bucket_name TEXT,
        file_path TEXT,
        expires_in INTEGER DEFAULT 3600
    )
    RETURNS TEXT AS $$
    DECLARE
        signed_url TEXT;
    BEGIN
        -- This is a placeholder - actual implementation uses Supabase client
        -- Just return the file path for now
        RETURN file_path;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to upload file (helper for reference)
    COMMENT ON FUNCTION public.get_signed_url IS 
    'Get a signed URL for accessing private storage files. Use Supabase client storage.from().createSignedUrl() instead.';

