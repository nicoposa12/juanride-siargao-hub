-- Make owner vs renter cancellation notifications distinct
-- Renter: "Your booking … has been cancelled"
-- Owner:  "Renter has cancelled booking …" (clear action context)

CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS trigger AS $$
DECLARE
    renter_name TEXT;
    vehicle_info TEXT;
    notification_title TEXT;
    notification_message TEXT;
    owner_id_var UUID;
BEGIN
    -- Fetch renter name & vehicle info + owner_id
    SELECT full_name INTO renter_name FROM public.users WHERE id = NEW.renter_id;
    SELECT CONCAT(type, ' - ', make, ' ', model), owner_id INTO vehicle_info, owner_id_var
    FROM public.vehicles WHERE id = NEW.vehicle_id;

    -- Handle new insert (unchanged from previous version)  
    IF TG_OP = 'INSERT' THEN
        notification_title := 'New Booking Request';
        notification_message := renter_name || ' has requested to book your ' || vehicle_info;
        INSERT INTO public.notifications(user_id, type, title, message, link)
        VALUES (owner_id_var,'booking',notification_title,notification_message,'/dashboard/bookings/'||NEW.id);

        notification_title := 'Booking Created';
        notification_message := 'Your booking for ' || vehicle_info || ' has been created';
        INSERT INTO public.notifications(user_id, type, title, message, link)
        VALUES (NEW.renter_id,'booking',notification_title,notification_message,'/dashboard/bookings/'||NEW.id);

    ELSIF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
        IF NEW.status = 'confirmed' THEN
            notification_title := 'Booking Confirmed';
            notification_message := 'Your booking for ' || vehicle_info || ' has been confirmed!';
            INSERT INTO public.notifications(user_id, type, title, message, link)
            VALUES (NEW.renter_id,'booking',notification_title,notification_message,'/dashboard/bookings/'||NEW.id);

        ELSIF NEW.status = 'cancelled' THEN
            -- Distinct messages
            -- Renter copy
            notification_title := 'Booking Cancelled';
            notification_message := 'Your booking for ' || vehicle_info || ' has been cancelled.';
            INSERT INTO public.notifications(user_id, type, title, message, link)
            VALUES (NEW.renter_id,'booking',notification_title,notification_message,'/dashboard/bookings/'||NEW.id);
            -- Owner copy
            notification_title := 'Booking Cancelled';
            notification_message := renter_name || ' has cancelled their booking for ' || vehicle_info || '.';
            INSERT INTO public.notifications(user_id, type, title, message, link)
            VALUES (owner_id_var,'booking',notification_title,notification_message,'/dashboard/bookings/'||NEW.id);

        ELSIF NEW.status = 'completed' THEN
            notification_title := 'Leave a Review';
            notification_message := 'How was your experience with ' || vehicle_info || '?';
            INSERT INTO public.notifications(user_id, type, title, message, link)
            VALUES (NEW.renter_id,'booking',notification_title,notification_message,'/dashboard/bookings/'||NEW.id||'/review');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
