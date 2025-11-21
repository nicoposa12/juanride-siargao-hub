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
    <section className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-primary-700 tracking-tight px-4">
            What Our Community Says
          </h2>
          <div className="w-20 sm:w-24 h-1.5 bg-gradient-to-r from-primary-600 to-accent-400 mx-auto mb-4 sm:mb-6 rounded-full shadow-layered-sm"></div>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium px-4">
            Empowering Siargao's tourism industry, one rental at a time
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 sm:mb-16">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="card-gradient shadow-layered-md hover:shadow-layered-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in border-border/50 hover:border-primary-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-5 sm:p-6">
                <Quote className="h-8 w-8 sm:h-10 sm:w-10 text-primary/20 mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-1 mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-accent-400 text-lg sm:text-xl">★</span>
                  ))}
                </div>
                <div>
                  <div className="font-bold text-primary-700 text-sm sm:text-base">{testimonial.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Impact Stats */}
        <div className="bg-gradient-to-r from-primary-100/60 to-accent-100/60 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 max-w-4xl mx-auto shadow-layered-lg border-2 border-primary-200/50">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-layered-md">
              <MapPin className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary-600" />
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary-700 mb-3 sm:mb-4 tracking-tight">
              Supporting Local Economy
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              JuanRide helps boost Siargao's tourism sector by connecting visitors with local vehicle owners, creating sustainable income opportunities while enhancing the visitor experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
