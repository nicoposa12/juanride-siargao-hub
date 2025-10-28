import { Shield, Zap, Globe } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="py-20 bg-gradient-feature">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              About JuanRide
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-slide-in">
              <p className="text-lg text-muted-foreground leading-relaxed">
                JuanRide modernizes vehicle rental services in Siargao Island by offering a
                digital platform that connects renters and owners. We simplify bookings, track
                availability in real time, and automate payment and rental management for a
                seamless experience.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our mission is to enhance the tourism experience in Siargao while empowering
                local vehicle owners with modern technology to grow their businesses efficiently.
              </p>

              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-foreground">Secure</div>
                </div>
                <div className="text-center">
                  <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-8 w-8 text-secondary" />
                  </div>
                  <div className="text-sm font-medium text-foreground">Fast</div>
                </div>
                <div className="text-center">
                  <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Globe className="h-8 w-8 text-accent" />
                  </div>
                  <div className="text-sm font-medium text-foreground">Accessible</div>
                </div>
              </div>
            </div>

            {/* Right Image/Illustration */}
            <div className="relative animate-fade-in">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl shadow-soft overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center p-8">
                    <Globe className="h-24 w-24 mx-auto mb-4 text-primary animate-float" />
                    <p className="text-lg font-semibold">Digital Tourism Innovation</p>
                    <p className="text-sm mt-2">Empowering Siargao's Vehicle Rental Industry</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
