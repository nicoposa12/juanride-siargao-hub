import { VehicleForm } from '@/components/owner/VehicleForm'

export const metadata = {
  title: 'Add New Vehicle | JuanRide Owner',
  description: 'List your vehicle for rent on JuanRide',
}

export default function NewVehiclePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <VehicleForm />
      </div>
    </div>
  )
}
