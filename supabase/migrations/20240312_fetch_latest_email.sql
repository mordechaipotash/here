-- Create function to fetch and process latest email
CREATE OR REPLACE FUNCTION public.fetch_latest_email()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email_data json;
    v_email_id uuid;
    v_thread_id text;
    v_client_id uuid;
BEGIN
    -- Get the latest unprocessed email from Gmail
    -- This is a placeholder - you'll need to implement the actual Gmail API call
    -- For now, we'll just return a mock response
    v_email_data := json_build_object(
        'message_id', 'mock_message_id',
        'thread_id', 'mock_thread_id',
        'from_email', 'sender@example.com',
        'subject', 'Test Email',
        'body_text', 'This is a test email body',
        'received_date', now()
    );

    -- Begin transaction
    BEGIN
        -- Insert into emails table
        INSERT INTO public.emails (
            message_id,
            thread_id,
            from_email,
            subject,
            body_text,
            received_date,
            processing_status,
            created_at,
            updated_at
        ) VALUES (
            v_email_data->>'message_id',
            v_email_data->>'thread_id',
            v_email_data->>'from_email',
            v_email_data->>'subject',
            v_email_data->>'body_text',
            (v_email_data->>'received_date')::timestamptz,
            'unprocessed',
            now(),
            now()
        )
        RETURNING id INTO v_email_id;

        -- Return the processed email data
        RETURN json_build_object(
            'id', v_email_id,
            'message_id', v_email_data->>'message_id',
            'subject', v_email_data->>'subject',
            'status', 'success'
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Roll back transaction on error
            ROLLBACK;
            RAISE EXCEPTION 'Error processing email: %', SQLERRM;
    END;
END;
$$;
