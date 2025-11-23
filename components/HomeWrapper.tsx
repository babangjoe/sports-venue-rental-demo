'use client';

import Hero from '@/components/Hero';
import SportsSection from '@/components/SportsSection';
import PricingSection from '@/components/PricingSection';
import TestimonialSection from '@/components/TestimonialSection';
import BookingSection from '@/components/BookingSection';
import Footer from '@/components/Footer';

export default function HomeWrapper() {
  return (
    <>
      <Hero />
      <SportsSection />
      <PricingSection />
      <TestimonialSection />
      <BookingSection />
      <Footer />
    </>
  );
}