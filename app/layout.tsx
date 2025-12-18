import './globals.css';
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { DemoProvider } from '@/contexts/DemoContext';
import Navbar from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'SportArena - Sewa Venue Olahraga Terbaik',
  description: 'Platform terpercaya untuk booking venue olahraga: Futsal, Mini Soccer, Basketball, Badminton dengan fasilitas premium dan harga terjangkau.',
  keywords: 'sewa lapangan, futsal, basketball, badminton, mini soccer, venue olahraga, booking online',
  authors: [{ name: 'SportArena Team' }],
  openGraph: {
    title: 'SportArena - Sewa Venue Olahraga Terbaik',
    description: 'Booking venue olahraga dengan mudah dan cepat. Fasilitas premium, harga terjangkau.',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <DemoProvider>
          <AuthProvider>
            <Navbar />
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </DemoProvider>
      </body>
    </html>
  );
}