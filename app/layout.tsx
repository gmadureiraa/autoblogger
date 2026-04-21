import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoblogger-rosy.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AutoBlogger | Blog com IA que se auto-alimenta 24/7',
    template: '%s | AutoBlogger',
  },
  description:
    'Criamos e implementamos um portal de conteudo que se auto-alimenta com IA. Voce define o nicho, a maquina publica. Setup em 48h, SEO automatico, design premium.',
  applicationName: 'AutoBlogger',
  keywords: [
    'autoblogger',
    'blog com IA',
    'conteudo automatico',
    'SEO automatico',
    'Gemini AI',
    'blog automatizado',
    'geracao de conteudo',
    'marketing de conteudo',
    'blog IA',
    'automacao de blog',
  ],
  authors: [{ name: 'Kaleidos', url: 'https://kaleidos.cc' }],
  creator: 'Kaleidos',
  publisher: 'Kaleidos',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    title: 'AutoBlogger | Blog com IA que se auto-alimenta 24/7',
    description:
      'Criamos e implementamos um portal de conteudo que se auto-alimenta com IA. Setup em 48h, SEO automatico, design premium incluido.',
    siteName: 'AutoBlogger',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoBlogger | Blog com IA 24/7',
    description:
      'Blog que se auto-alimenta com IA. Defina o nicho, plugue a API Gemini, e publique 1-10 artigos/dia no piloto automatico.',
    creator: '@madureira',
    site: '@madureira',
  },
  category: 'technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className={`${jetbrainsMono.variable} ${GeistPixelGrid.variable}`} suppressHydrationWarning>
        <body className="font-mono antialiased">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
