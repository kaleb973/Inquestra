import Navbar from './landing/navbar';
import Hero from './landing/hero';
import Stats from './landing/stats';
import Features from './landing/features';
import Testimonial from './landing/testimonial';
import Footer from './landing/footer';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

export default function Landing01Demo() {
  return (
    <main className="dark min-h-screen overflow-x-hidden bg-[#101010]">
      <Navbar />
      <Hero />
      <ScrollExpandMedia
        mediaSrc="https://assets.watermelon.sh/video-demo.mp4"
        bgImageSrc="https://assets.watermelon.sh/lp-hero-01.avif"
        title="Experience the Flow"
        date="Discover"
      />
      <Stats />
      <Features />
      <Testimonial />
      <Footer />
    </main>
  );
}
