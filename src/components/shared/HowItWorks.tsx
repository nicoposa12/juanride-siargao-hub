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
    <section id="how-it-works" className="py-20 gradient-feature">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            How It Works
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* For Renters */}
          <div className="space-y-8 animate-slide-in">
            <div className="text-center lg:text-left">
              <h3 className="text-3xl font-bold mb-2 text-primary">For Renters</h3>
              <p className="text-muted-foreground">Get on the road in 3 easy steps</p>
            </div>
            
            {renterSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-smooth">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-6 w-6 text-primary" />
                      <h4 className="text-xl font-semibold text-foreground">{step.title}</h4>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* For Owners */}
          <div className="space-y-8 animate-slide-in" style={{ animationDelay: "200ms" }}>
            <div className="text-center lg:text-left">
              <h3 className="text-3xl font-bold mb-2 text-secondary">For Vehicle Owners</h3>
              <p className="text-muted-foreground">Start earning in 3 simple steps</p>
            </div>
            
            {ownerSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="bg-secondary text-secondary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-smooth">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-6 w-6 text-secondary" />
                      <h4 className="text-xl font-semibold text-foreground">{step.title}</h4>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
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
