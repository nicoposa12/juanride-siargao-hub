import { MapPin, CreditCard, Radio, Star, BarChart3, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Radio,
    title: "Real-time Vehicle Availability",
    description: "Check live availability of vehicles across Siargao instantly.",
    color: "text-primary-600",
    bgColor: "bg-primary-100",
  },
  {
    icon: CreditCard,
    title: "Online Booking & Secure Payment",
    description: "Book and pay securely with integrated payment processing.",
    color: "text-secondary-500",
    bgColor: "bg-secondary-100",
  },
  {
    icon: MapPin,
    title: "GPS Vehicle Tracking",
    description: "Track your rented vehicle's location in real-time for peace of mind.",
    color: "text-accent-400",
    bgColor: "bg-accent-100",
  },
  {
    icon: Star,
    title: "User Ratings & Feedback",
    description: "Read reviews and rate your experience to help others decide.",
    color: "text-primary-600",
    bgColor: "bg-primary-100",
  },
  {
    icon: BarChart3,
    title: "Maintenance & Analytics Dashboard",
    description: "Owners can monitor performance, revenue, and vehicle maintenance.",
    color: "text-secondary-500",
    bgColor: "bg-secondary-100",
  },
  {
    icon: Headphones,
    title: "24/7 Accessibility and Support",
    description: "Get assistance anytime with our round-the-clock customer support.",
    color: "text-accent-400",
    bgColor: "bg-accent-100",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gradient-subtle bg-pattern-dots relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-primary-700 tracking-tight">
            Powerful Features
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-primary-600 to-accent-400 mx-auto mb-6 rounded-full shadow-layered-sm"></div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Everything you need for a seamless vehicle rental experience in Siargao
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group card-gradient shadow-layered-md hover:shadow-layered-lg transition-all duration-300 border-border/50 hover:border-primary-300 animate-fade-in hover:-translate-y-2 overflow-hidden relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Subtle shimmer on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardContent className="p-6 sm:p-8 relative z-10">
                  <div className={`${feature.bgColor} rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-layered-sm group-hover:shadow-layered-md relative overflow-hidden cursor-pointer`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${feature.color} relative z-10 group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-3 text-primary-700 group-hover:text-primary-600 transition-colors leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
