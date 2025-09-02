import Navigation from '@/components/navigation';
import HeroSection from '@/components/hero-section';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1">
        <HeroSection />
      </div>
      <Footer />
    </div>
  );
}
