import { Car, Facebook, Instagram, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground/5 border-t-2 border-border shadow-inset-sm">
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4 col-span-1 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-lg p-2 shadow-layered-sm">
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-700 to-accent-400 bg-clip-text text-transparent">
                JuanRide
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Modernizing vehicle rentals in Siargao Island with innovative digital solutions.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth p-2 rounded-lg hover:bg-primary-50 shadow-sm hover:shadow-layered-md hover:scale-110 transition-all duration-300">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth p-2 rounded-lg hover:bg-primary-50 shadow-sm hover:shadow-layered-md hover:scale-110 transition-all duration-300">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth p-2 rounded-lg hover:bg-primary-50 shadow-sm hover:shadow-layered-md hover:scale-110 transition-all duration-300">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth p-2 rounded-lg hover:bg-primary-50 shadow-sm hover:shadow-layered-md hover:scale-110 transition-all duration-300">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="font-bold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">For Users</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Book a Vehicle
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h3 className="font-bold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">For Owners</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  List Your Vehicle
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Owner Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Resources
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-border pt-6 sm:pt-8">
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p className="mb-2 font-medium">
              © {currentYear} JuanRide. All rights reserved.
            </p>
            <p className="text-xs leading-relaxed">
              Developed by <span className="font-semibold text-primary-700">John Mark M. Camingue</span>,{" "}
              <span className="font-semibold text-primary-700">Kim G. Cañedo</span>,{" "}
              <span className="font-semibold text-primary-700">Nico Mar M. Oposa</span>, and{" "}
              <span className="font-semibold text-primary-700">Brennan Kean S. Sarvida</span> – STI College Surigao
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
