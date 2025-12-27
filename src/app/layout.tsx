import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'FarmSense - Premium Livestock Marketplace',
  description: 'Find premium cattle and goats with complete health records. Your trusted partner for quality livestock investment.',
  keywords: 'farmsense, livestock, farm, cattle, goats, marketplace, premium livestock, health certified',
  icons: {
    icon: '/FarmSense.jpg',
    apple: '/FarmSense.jpg',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
