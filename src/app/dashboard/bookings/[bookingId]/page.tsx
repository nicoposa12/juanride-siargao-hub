'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Calendar,
  Car,
  MapPin,
  DollarSign,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { useToast } from '@/hooks/use-toast';
import { VehicleTracker } from '@/components/renter/VehicleTracker';
import Navigation from '@/components/shared/Navigation';

interface BookingDetails {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  pickup_location: string | null;
  return_location: string | null;
  pickup_time: string | null;
  return_time: string | null;
  special_requests: string | null;
  created_at: string;
  vehicle: {
    id: string;
    make: string | null;
    model: string | null;
    year: number | null;
    plate_number: string;
    price_per_day: number;
    location: string | null;
    image_urls: string[];
    sinotrack_device_id: string | null;
    sinotrack_account: string | null;
    sinotrack_password: string | null;
    owner: {
      id: string;
      full_name: string | null;
      email: string;
      phone_number: string | null;
    };
  };
  payment: {
    id: string;
    status: string;
    payment_method: string;
    amount: number;
  }[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'ongoing':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export default function RenterBookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  useEffect(() => {
    if (!authLoading && bookingId) {
      if (!user) {
        router.push('/login');
        return;
      }
      loadBookingDetails();
    }
  }, [user, authLoading, bookingId]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          *,
          vehicle:vehicles!vehicle_id (
            id,
            make,
            model,
            year,
            plate_number,
            price_per_day,
            location,
            image_urls,
            sinotrack_device_id,
            sinotrack_account,
            sinotrack_password,
            owner:users!vehicles_owner_id_fkey (
              id,
              full_name,
              email,
              phone_number
            )
          ),
          payment:payments (
            id,
            status,
            payment_method,
            amount
          )
        `,
        )
        .eq('id', bookingId)
        .eq('renter_id', user!.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Booking Not Found',
          description: 'The booking you are looking for does not exist or you do not have access to it.',
          variant: 'destructive',
        });
        router.push('/dashboard/bookings');
        return;
      }

      setBooking(data as any);
    } catch (error: any) {
      console.error('Error loading booking details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load booking details.',
        variant: 'destructive',
      });
      router.push('/dashboard/bookings');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <Skeleton className="h-12 w-64 mb-6" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!booking) {
    return null;
  }

  const hasGPSTracking =
    booking.vehicle.sinotrack_device_id &&
    booking.vehicle.sinotrack_account &&
    booking.vehicle.sinotrack_password;

  const isActiveBooking = booking.status === 'confirmed' || booking.status === 'active' || booking.status === 'ongoing';

  const vehicleName = `${booking.vehicle.make} ${booking.vehicle.model}`.trim() || 'Vehicle';

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Booking Details</h1>
                <p className="text-muted-foreground">Booking ID: {booking.id.slice(0, 8)}</p>
              </div>
              <Badge className={getStatusColor(booking.status)}>{booking.status.toUpperCase()}</Badge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.vehicle.image_urls && booking.vehicle.image_urls.length > 0 && (
                  <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={booking.vehicle.image_urls[0]}
                      alt={vehicleName}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-semibold">
                      {booking.vehicle.year} {vehicleName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plate Number</p>
                    <p className="font-semibold">{booking.vehicle.plate_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Rate</p>
                    <p className="font-semibold">{formatCurrency(booking.vehicle.price_per_day)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{booking.vehicle.location || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-semibold">{formatDate(booking.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-semibold">{formatDate(booking.end_date)}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(booking.total_price)}</p>
                  </div>
                  {booking.pickup_location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Location</p>
                      <p className="font-semibold">{booking.pickup_location}</p>
                    </div>
                  )}
                  {booking.special_requests && (
                    <div>
                      <p className="text-sm text-muted-foreground">Special Requests</p>
                      <p className="text-sm">{booking.special_requests}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Vehicle Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{booking.vehicle.owner.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{booking.vehicle.owner.email}</p>
                </div>
                {booking.vehicle.owner.phone_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{booking.vehicle.owner.phone_number}</p>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/messages/${booking.id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Owner
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* GPS Tracking - Only show for active bookings with GPS */}
            {hasGPSTracking && isActiveBooking && (
              <div className="md:col-span-2">
                <VehicleTracker vehicleId={booking.vehicle.id} vehicleName={vehicleName} />
              </div>
            )}

            {/* Show message if GPS not available */}
            {!hasGPSTracking && isActiveBooking && (
              <div className="md:col-span-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    GPS tracking is not available for this vehicle. Please contact the owner for location
                    information.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
