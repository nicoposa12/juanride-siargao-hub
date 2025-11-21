import { Search, CreditCard, MapPin, Upload, Calendar, TrendingUp } from "lucide-react";

const HowItWorks = () => {
  const renterSteps = [
    {
      icon: Search,
      title: "Browse Available Vehicles",
      description: "Explore our wide selection of motorcycles, cars, and vans available for rent.",
    },
    {
      icon: CreditCard,
      title: "Book & Pay Securely",
      description: "Choose your vehicle, select dates, and complete payment through our secure system.",
    },
    {
      icon: MapPin,
      title: "Track & Enjoy Your Ride",
      description: "Pick up your vehicle and track it in real-time throughout your rental period.",
    },
  ];

  const ownerSteps = [
    {
      icon: Upload,
      title: "List Your Vehicles",
      description: "Add your vehicles with photos, pricing, and availability details.",
    },
    {
      icon: Calendar,
      title: "Manage Bookings",
      description: "Accept or decline bookings and manage your rental calendar effortlessly.",
    },
    {
      icon: TrendingUp,
      title: "Track Performance & Revenue",
      description: "Monitor your earnings, maintenance schedules, and vehicle analytics.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-primary-900 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-pattern-grid opacity-10"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white tracking-tight px-4">
            How It Works
          </h2>
          <div className="w-20 sm:w-24 h-1.5 bg-gradient-to-r from-accent-300 to-secondary-300 mx-auto mb-4 sm:mb-6 rounded-full shadow-layered-sm"></div>
          <p className="text-white/80 text-base sm:text-lg font-medium max-w-2xl mx-auto px-4">Simple steps to get started with JuanRide</p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
          {/* For Renters */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-slide-in">
            <div className="text-center lg:text-left bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/10 shadow-layered-md">
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 text-accent-200 tracking-tight">For Renters</h3>
              <p className="text-sm sm:text-base text-white/70 font-medium">Get on the road in 3 easy steps</p>
            </div>
            
            {renterSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-4 sm:gap-6 group bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-lg sm:rounded-xl border border-white/10 hover:bg-white/10 hover:border-accent-300/50 transition-all duration-300 shadow-layered-sm hover:shadow-layered-lg hover:-translate-y-1">
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-accent-300 to-accent-400 text-primary-900 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-extrabold text-lg sm:text-xl group-hover:scale-110 transition-all shadow-layered-md">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-1.5 sm:p-2 bg-accent-200/20 rounded-lg">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent-200" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold text-white">{step.title}</h4>
                    </div>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* For Owners */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-slide-in" style={{ animationDelay: "200ms" }}>
            <div className="text-center lg:text-left bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/10 shadow-layered-md">
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 text-secondary-200 tracking-tight">For Vehicle Owners</h3>
              <p className="text-sm sm:text-base text-white/70 font-medium">Start earning in 3 simple steps</p>
            </div>
            
            {ownerSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-4 sm:gap-6 group bg-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-lg sm:rounded-xl border border-white/10 hover:bg-white/10 hover:border-secondary-300/50 transition-all duration-300 shadow-layered-sm hover:shadow-layered-lg hover:-translate-y-1">
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-secondary-300 to-secondary-400 text-primary-900 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-extrabold text-lg sm:text-xl group-hover:scale-110 transition-all shadow-layered-md">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-1.5 sm:p-2 bg-secondary-200/20 rounded-lg">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-200" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold text-white">{step.title}</h4>
                    </div>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
