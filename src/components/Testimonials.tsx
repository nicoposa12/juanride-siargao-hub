import { Card, CardContent } from "@/components/ui/card";
import { Quote, MapPin } from "lucide-react";

const testimonials = [
  {
    name: "Maria Santos",
    role: "Tourist from Manila",
    content: "JuanRide made my Siargao trip so much easier! I booked a motorcycle in minutes and the GPS tracking gave me peace of mind.",
    rating: 5,
  },
  {
    name: "Carlos Reyes",
    role: "Vehicle Owner",
    content: "As a local vehicle owner, this platform has doubled my bookings. The analytics dashboard helps me manage everything efficiently.",
    rating: 5,
  },
  {
    name: "Emily Johnson",
    role: "International Traveler",
    content: "Best rental experience in the Philippines! The support team was available 24/7 and the payment process was seamless.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            What Our Community Says
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering Siargao's tourism industry, one rental at a time
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="hover:shadow-hover transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <Quote className="h-10 w-10 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-accent text-xl">★</span>
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Impact Stats */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto shadow-soft">
          <div className="text-center mb-8">
            <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Supporting Local Economy
            </h3>
            <p className="text-muted-foreground">
              JuanRide helps boost Siargao's tourism sector by connecting visitors with local vehicle owners, creating sustainable income opportunities while enhancing the visitor experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
