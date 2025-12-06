import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booking Lapangan | SportArena',
  description: 'Booking lapangan Futsal, Mini Soccer, Basketball, dan Badminton secara online. Cek jadwal, harga, dan ketersediaan real-time.',
  openGraph: {
    title: 'Booking Lapangan | SportArena',
    description: 'Booking lapangan olahraga favoritmu sekarang. Mudah, cepat, dan terpercaya.',
    type: 'website',
  }
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
