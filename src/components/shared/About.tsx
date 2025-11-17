import { Shield, Zap, Globe } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="py-20 bg-background relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-secondary-100/40 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-accent-100/40 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-primary-700 tracking-tight">
              About JuanRide
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-600 to-accent-400 mx-auto mb-6 rounded-full shadow-layered-sm"></div>
            <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">Modernizing vehicle rentals in paradise</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-slide-in">
              <p className="text-lg text-foreground leading-relaxed font-medium">
                JuanRide modernizes vehicle rental services in Siargao Island by offering a
                digital platform that connects renters and owners. We simplify bookings, track
                availability in real time, and automate payment and rental management for a
                seamless experience.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our mission is to enhance the tourism experience in Siargao while empowering
                local vehicle owners with modern technology to grow their businesses efficiently.
              </p>

              <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-6">
                <div className="text-center group cursor-pointer">
                  <div className="bg-primary-100 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center mx-auto mb-3 shadow-layered-sm group-hover:shadow-layered-lg transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary-200/20 to-transparent transition-opacity duration-500"></div>
                    <Shield className="h-8 w-8 sm:h-9 sm:w-9 lg:h-12 lg:w-12 text-primary-600 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base font-bold text-primary-700 group-hover:text-primary-600 transition-colors">Secure</div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="bg-secondary-100 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center mx-auto mb-3 shadow-layered-sm group-hover:shadow-layered-lg transition-all duration-500 group-hover:scale-110 relative overflow-hidden bounce-subtle">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-secondary-200/20 to-transparent transition-opacity duration-500"></div>
                    <Zap className="h-8 w-8 sm:h-9 sm:w-9 lg:h-12 lg:w-12 text-secondary-500 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base font-bold text-primary-700 group-hover:text-primary-600 transition-colors">Fast</div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="bg-accent-100 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center mx-auto mb-3 shadow-layered-sm group-hover:shadow-layered-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-accent-200/20 to-transparent transition-opacity duration-500"></div>
                    <Globe className="h-8 w-8 sm:h-9 sm:w-9 lg:h-12 lg:w-12 text-accent-400 relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base font-bold text-primary-700 group-hover:text-primary-600 transition-colors">Accessible</div>
                </div>
              </div>
            </div>

            {/* Right Image/Illustration */}
            <div className="relative animate-fade-in">
              <div className="aspect-video card-gradient rounded-2xl shadow-layered-lg overflow-hidden border border-primary-200/30">
                <div className="w-full h-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-accent-100/30"></div>
                  <div className="text-center p-8 relative z-10">
                    <div className="bg-primary-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4 shadow-layered-md">
                      <Globe className="h-16 w-16 text-primary-600 animate-float" />
                    </div>
                    <p className="text-xl font-extrabold text-primary-700 tracking-tight">Digital Tourism Innovation</p>
                    <p className="text-sm mt-2 font-semibold text-muted-foreground">Empowering Siargao's Vehicle Rental Industry</p>
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
