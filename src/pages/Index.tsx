import Navigation from "@/components/shared/Navigation";
import Hero from "@/components/shared/Hero";
import About from "@/components/shared/About";
import Features from "@/components/shared/Features";
import HowItWorks from "@/components/shared/HowItWorks";
import Testimonials from "@/components/shared/Testimonials";
import Contact from "@/components/shared/Contact";
import Footer from "@/components/shared/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
