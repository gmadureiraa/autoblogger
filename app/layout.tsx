import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'AutoBlogger | Blog com IA que se auto-alimenta 24/7',
  description:
    'Criamos e implementamos um portal de conteudo que se auto-alimenta com IA. Voce define o nicho — a maquina publica. Setup em 48h, SEO automatico, design premium.',
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
  authors: [{ name: 'Kaleidos' }],
  creator: 'Kaleidos',
  publisher: 'Kaleidos',
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
  },
  category: 'technology',
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
    <html lang="pt-BR" className={`${jetbrainsMono.variable} ${GeistPixelGrid.variable}`} suppressHydrationWarning>
      <body className="font-mono antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
