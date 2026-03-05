import Hero from '@/components/home/Hero';
import Services from '@/components/home/Services';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import AboutPreview from '@/components/home/AboutPreview';

export default function HomeUi() {
  return (
    <main className="w-full bg-black">
      <Hero />
      <Services />
      <WhyChooseUs />
      <AboutPreview />
    </main>
  );
}