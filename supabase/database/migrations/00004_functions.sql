-- JuanRide Database Functions and Triggers
-- Business logic and automated processes

-- ============================================================================
-- FUNCTION: Create user profile on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'renter')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Update owner_id in bookings when created
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_booking_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- Set owner_id from the vehicle's owner
    SELECT owner_id INTO NEW.owner_id
    FROM public.vehicles
    WHERE id = NEW.vehicle_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set owner_id automatically
DROP TRIGGER IF EXISTS set_booking_owner_trigger ON public.bookings;
CREATE TRIGGER set_booking_owner_trigger
    BEFORE INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.set_booking_owner();

-- ============================================================================
-- FUNCTION: Check for booking conflicts before insert/update
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_booking_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for overlapping bookings for the same vehicle
    SELECT COUNT(*) INTO conflict_count
    FROM public.bookings
    WHERE vehicle_id = NEW.vehicle_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND status IN ('confirmed', 'active')
        AND daterange(start_date, end_date, '[]') && 
            daterange(NEW.start_date, NEW.end_date, '[]');
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Booking conflict: Vehicle is not available for the selected dates';
    END IF;
    
    -- Check for blocked dates
    SELECT COUNT(*) INTO conflict_count
    FROM public.blocked_dates
    WHERE vehicle_id = NEW.vehicle_id
        AND daterange(start_date, end_date, '[]') && 
            daterange(NEW.start_date, NEW.end_date, '[]');
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Vehicle is blocked for maintenance or personal use during selected dates';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check conflicts before insert/update
DROP TRIGGER IF EXISTS check_booking_conflicts_trigger ON public.bookings;
CREATE TRIGGER check_booking_conflicts_trigger
    BEFORE INSERT OR UPDATE OF start_date, end_date, vehicle_id
    ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.check_booking_conflicts();

-- ============================================================================
-- FUNCTION: Update vehicle status based on bookings
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If booking is confirmed or active, mark vehicle as rented
    IF NEW.status IN ('confirmed', 'active') THEN
        UPDATE public.vehicles
        SET status = 'rented'
        WHERE id = NEW.vehicle_id;
    
    -- If booking is completed or cancelled, check if vehicle should be available
    ELSIF NEW.status IN ('completed', 'cancelled') THEN
        -- Only set to available if no other active bookings exist
        IF NOT EXISTS (
            SELECT 1 FROM public.bookings
            WHERE vehicle_id = NEW.vehicle_id
                AND status IN ('confirmed', 'active')
                AND id != NEW.id
        ) THEN
            UPDATE public.vehicles
            SET status = 'available'
            WHERE id = NEW.vehicle_id
                AND status != 'maintenance';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vehicle status
DROP TRIGGER IF EXISTS update_vehicle_status_trigger ON public.bookings;
CREATE TRIGGER update_vehicle_status_trigger
    AFTER INSERT OR UPDATE OF status
    ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_status();

-- ============================================================================
-- FUNCTION: Calculate platform fee and owner payout
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_payment_breakdown()
RETURNS TRIGGER AS $$
DECLARE
    fee_percentage DECIMAL := 0.10; -- 10% platform fee
BEGIN
    -- Calculate platform fee (10% of amount)
    NEW.platform_fee := NEW.amount * fee_percentage;
    
    -- Calculate owner payout (90% of amount)
    NEW.owner_payout := NEW.amount - NEW.platform_fee;
    
    -- Set paid_at timestamp when status changes to paid
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        NEW.paid_at := NOW();
    END IF;
    
    -- Set refunded_at timestamp when status changes to refunded
    IF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
        NEW.refunded_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate fees
DROP TRIGGER IF EXISTS calculate_payment_breakdown_trigger ON public.payments;
CREATE TRIGGER calculate_payment_breakdown_trigger
    BEFORE INSERT OR UPDATE
    ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.calculate_payment_breakdown();

-- ============================================================================
-- FUNCTION: Create notification for booking events
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    renter_name TEXT;
    owner_name TEXT;
    vehicle_info TEXT;
BEGIN
    -- Get user names and vehicle info
    SELECT full_name INTO renter_name FROM public.users WHERE id = NEW.renter_id;
    SELECT full_name INTO owner_name FROM public.users WHERE id = NEW.owner_id;
    SELECT CONCAT(type, ' - ', make, ' ', model) INTO vehicle_info 
    FROM public.vehicles WHERE id = NEW.vehicle_id;
    
    -- Handle new booking
    IF TG_OP = 'INSERT' THEN
        -- Notify owner
        notification_title := 'New Booking Request';
        notification_message := renter_name || ' has requested to book your ' || vehicle_info;
        
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
            NEW.owner_id,
            'booking',
            notification_title,
            notification_message,
            '/owner/bookings/' || NEW.id
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
    
    -- Handle status updates
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NEW.status = 'confirmed' THEN
            -- Notify renter of confirmation
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
                (NEW.owner_id, 'booking', notification_title, notification_message, '/owner/bookings/' || NEW.id);
        
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking notifications
DROP TRIGGER IF EXISTS notify_booking_event_trigger ON public.bookings;
CREATE TRIGGER notify_booking_event_trigger
    AFTER INSERT OR UPDATE OF status
    ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();

-- ============================================================================
-- FUNCTION: Notify on new message
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
BEGIN
    SELECT full_name INTO sender_name FROM public.users WHERE id = NEW.sender_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
        NEW.receiver_id,
        'message',
        'New Message',
        sender_name || ' sent you a message',
        '/messages/' || NEW.booking_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message notifications
DROP TRIGGER IF EXISTS notify_new_message_trigger ON public.messages;
CREATE TRIGGER notify_new_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ============================================================================
-- FUNCTION: Get vehicle availability
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_vehicle_availability(
    p_vehicle_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    is_available BOOLEAN := true;
    conflict_count INTEGER;
BEGIN
    -- Check for booking conflicts
    SELECT COUNT(*) INTO conflict_count
    FROM public.bookings
    WHERE vehicle_id = p_vehicle_id
        AND status IN ('confirmed', 'active')
        AND daterange(start_date, end_date, '[]') && 
            daterange(p_start_date, p_end_date, '[]');
    
    IF conflict_count > 0 THEN
        is_available := false;
        RETURN is_available;
    END IF;
    
    -- Check for blocked dates
    SELECT COUNT(*) INTO conflict_count
    FROM public.blocked_dates
    WHERE vehicle_id = p_vehicle_id
        AND daterange(start_date, end_date, '[]') && 
            daterange(p_start_date, p_end_date, '[]');
    
    IF conflict_count > 0 THEN
        is_available := false;
        RETURN is_available;
    END IF;
    
    -- Check vehicle status
    SELECT COUNT(*) INTO conflict_count
    FROM public.vehicles
    WHERE id = p_vehicle_id
        AND status IN ('available')
        AND is_approved = true;
    
    IF conflict_count = 0 THEN
        is_available := false;
    END IF;
    
    RETURN is_available;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Calculate vehicle average rating
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_vehicle_avg_rating(p_vehicle_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    avg_rating DECIMAL;
BEGIN
    SELECT ROUND(AVG(rating)::DECIMAL, 1) INTO avg_rating
    FROM public.reviews
    WHERE vehicle_id = p_vehicle_id
        AND is_approved = true;
    
    RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Calculate owner average rating
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_owner_avg_rating(p_owner_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    avg_rating DECIMAL;
BEGIN
    SELECT ROUND(AVG(rating)::DECIMAL, 1) INTO avg_rating
    FROM public.reviews
    WHERE owner_id = p_owner_id
        AND is_approved = true;
    
    RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get owner earnings for a period
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_owner_earnings(
    p_owner_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_earnings DECIMAL,
    pending_earnings DECIMAL,
    paid_earnings DECIMAL,
    booking_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN p.status IN ('paid', 'processing') THEN p.owner_payout ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN p.status = 'processing' THEN p.owner_payout ELSE 0 END), 0) as pending_earnings,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.owner_payout ELSE 0 END), 0) as paid_earnings,
        COUNT(DISTINCT b.id) as booking_count
    FROM public.bookings b
    LEFT JOIN public.payments p ON p.booking_id = b.id
    WHERE b.owner_id = p_owner_id
        AND b.status IN ('confirmed', 'active', 'completed')
        AND (p_start_date IS NULL OR b.start_date >= p_start_date)
        AND (p_end_date IS NULL OR b.end_date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

