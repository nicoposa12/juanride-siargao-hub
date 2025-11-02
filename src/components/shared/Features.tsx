import { MapPin, CreditCard, Radio, Star, BarChart3, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Radio,
    title: "Real-time Vehicle Availability",
    description: "Check live availability of vehicles across Siargao instantly.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: CreditCard,
    title: "Online Booking & Secure Payment",
    description: "Book and pay securely with integrated payment processing.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: MapPin,
    title: "GPS Vehicle Tracking",
    description: "Track your rented vehicle's location in real-time for peace of mind.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Star,
    title: "User Ratings & Feedback",
    description: "Read reviews and rate your experience to help others decide.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Maintenance & Analytics Dashboard",
    description: "Owners can monitor performance, revenue, and vehicle maintenance.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Headphones,
    title: "24/7 Accessibility and Support",
    description: "Get assistance anytime with our round-the-clock customer support.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Powerful Features
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for a seamless vehicle rental experience in Siargao
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-hover transition-smooth border-border hover:border-primary/50 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className={`${feature.bgColor} rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
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
