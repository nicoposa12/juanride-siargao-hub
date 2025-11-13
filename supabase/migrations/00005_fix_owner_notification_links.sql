-- Fix owner notification links to point to correct routes
-- Owner notifications should go to /owner/bookings instead of /owner/bookings/[id]

-- Update existing notifications with wrong links
-- Extract booking ID from the old link and create new dashboard link
UPDATE public.notifications 
SET link = '/dashboard/bookings/' || SUBSTRING(link FROM '/owner/bookings/(.+)')
WHERE link LIKE '/owner/bookings/%' AND link != '/owner/bookings';

-- Update the trigger function to generate correct links going forward
CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS trigger AS $$
DECLARE
    renter_name TEXT;
    vehicle_info TEXT;
    notification_title TEXT;
    notification_message TEXT;
    owner_id_var UUID;
BEGIN
    -- Get renter name and vehicle info
    SELECT full_name INTO renter_name 
    FROM public.users WHERE id = NEW.renter_id;
    
    -- Get vehicle info and owner_id
    SELECT CONCAT(type, ' - ', make, ' ', model), owner_id INTO vehicle_info, owner_id_var
    FROM public.vehicles WHERE id = NEW.vehicle_id;
    
    -- Handle new booking
    IF TG_OP = 'INSERT' THEN
        -- Notify owner
        notification_title := 'New Booking Request';
        notification_message := renter_name || ' has requested to book your ' || vehicle_info;
        
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
            owner_id_var,
            'booking',
            notification_title,
            notification_message,
            '/dashboard/bookings/' || NEW.id
        );
        
        -- Notify renter
        notification_title := 'Booking Created';
        notification_message := 'Your booking for ' || vehicle_info || ' has been created';
        
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
            NEW.renter_id,
            'booking',
            notification_title,
            notification_message,
            '/dashboard/bookings/' || NEW.id
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check if status changed
        IF OLD.status != NEW.status THEN
            
            IF NEW.status = 'confirmed' THEN
                -- Notify renter
                notification_title := 'Booking Confirmed';
                notification_message := 'Your booking for ' || vehicle_info || ' has been confirmed!';
                
                INSERT INTO public.notifications (user_id, type, title, message, link)
                VALUES (
                    NEW.renter_id,
                    'booking',
                    notification_title,
                    notification_message,
                    '/dashboard/bookings/' || NEW.id
                );
                
            ELSIF NEW.status = 'cancelled' THEN
                -- Notify both parties
                notification_title := 'Booking Cancelled';
                notification_message := 'Booking for ' || vehicle_info || ' has been cancelled';
                
                INSERT INTO public.notifications (user_id, type, title, message, link)
                VALUES 
                    (NEW.renter_id, 'booking', notification_title, notification_message, '/dashboard/bookings/' || NEW.id),
                    (owner_id_var, 'booking', notification_title, notification_message, '/dashboard/bookings/' || NEW.id);
            
            ELSIF NEW.status = 'completed' THEN
                -- Notify renter to leave a review
                notification_title := 'Leave a Review';
                notification_message := 'How was your experience with ' || vehicle_info || '?';
                
                INSERT INTO public.notifications (user_id, type, title, message, link)
                VALUES (
                    NEW.renter_id,
                    'booking',
                    notification_title,
                    notification_message,
                    '/dashboard/bookings/' || NEW.id || '/review'
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
