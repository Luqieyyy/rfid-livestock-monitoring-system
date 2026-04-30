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
  title: {
    default: 'FarmSense',
    template: '%s | FarmSense',
  },
  description: 'Urus ternakan anda dengan teknologi pintar. Rekod kesihatan, pembiakan, IoT monitoring & marketplace lembu kambing premium.',
  keywords: 'farmsense, livestock, farm, cattle, goats, marketplace, premium livestock, health certified, ternakan, lembu, kambing',
  metadataBase: new URL('https://farmsense.my'),
  icons: {
    icon: '/FarmSense.jpg',
    apple: '/FarmSense.jpg',
  },
  openGraph: {
    title: 'FarmSense — Smart Livestock Management',
    description: 'Urus ternakan anda dengan teknologi pintar. Rekod kesihatan, pembiakan, IoT monitoring & marketplace lembu kambing premium.',
    url: 'https://farmsense.my',
    siteName: 'FarmSense',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FarmSense — Smart Livestock Management',
      },
    ],
    type: 'website',
    locale: 'ms_MY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FarmSense — Smart Livestock Management',
    description: 'Urus ternakan anda dengan teknologi pintar. Rekod kesihatan, pembiakan, IoT monitoring & marketplace.',
    images: ['/og-image.jpg'],
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
