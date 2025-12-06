'use client';

import Hero from '@/components/Hero';
import SportsSection from '@/components/SportsSection';
import EventsSection from '@/components/EventsSection';
import TestimonialSection from '@/components/TestimonialSection';
import BookingSection from '@/components/BookingSection';
import Footer from '@/components/Footer';

export default function HomeWrapper() {
  return (
    <>
      <Hero />
      <SportsSection />
      <EventsSection />
      <TestimonialSection />
      <Footer />
    </>
  );
}