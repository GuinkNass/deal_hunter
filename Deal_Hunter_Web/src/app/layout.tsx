import type { Metadata } from 'next';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.dealhunterpro.com.br'),
  title: 'Deal Hunter Pro — O Monitor de Ofertas e Bugs de Preço nº 1',
  description:
    'Monitore Amazon Brasil, Magazine Luiza e Eletroclub 24/7 direto do seu navegador e receba alertas imediatos de superdescontos no Telegram. Teste 7 dias grátis.',
  keywords: [
    'monitor de ofertas',
    'extensao chrome ofertas',
    'promocoes telegram',
    'bot de ofertas',
    'achadinhos amazon',
    'descontos magalu',
  ],
  authors: [{ name: 'Deal Hunter Pro' }],
  openGraph: {
    title: 'Deal Hunter Pro — O Monitor de Ofertas e Bugs de Preço nº 1',
    description:
      'Monitore Amazon Brasil, Magazine Luiza e Eletroclub 24/7 e receba alertas imediatos de superdescontos no Telegram.',
    url: 'https://dealhunterpro.com.br',
    siteName: 'Deal Hunter Pro',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/images/logo.png',
        width: 500,
        height: 500,
        alt: 'Deal Hunter Pro Logo',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/logo.png', sizes: '500x500', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <head>
        {/* 1. Declaração do dataLayer e Consent Mode v2 padrão ('default') ANTES de qualquer tag */}
        <script
          id="google-consent-mode"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              // Define os valores padrão de consentimento (Basic / Advanced)
              gtag('consent', 'default', {
                'ad_storage': 'granted',
                'analytics_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
              });
            `,
          }}
        />

        {/* 2. Carregamento do script gtag.js da tag AW-18485467530 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18485467530"
          strategy="afterInteractive"
        />

        {/* 3. Configurações de gtag('config', ...) e 4. Função gtag_report_conversion */}
        <Script
          id="google-ads-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              gtag('js', new Date());
              gtag('config', 'AW-18485467530');

              function gtag_report_conversion(url) {
                var callback = function () {
                  if (typeof(url) != 'undefined' && url) {
                    window.location = url;
                  }
                };
                if (typeof gtag === 'function') {
                  gtag('event', 'conversion', {
                      'send_to': 'AW-18485467530/VsKeCObcyZQdEIqzx-5E',
                      'event_callback': callback
                  });
                } else if (typeof(url) != 'undefined' && url) {
                  window.location = url;
                }
                return false;
              }
              window.gtag_report_conversion = gtag_report_conversion;
            `,
          }}
        />
      </head>
      <body className="bg-[#07090e] text-gray-100 antialiased min-h-screen flex flex-col">
        {children}
        <GoogleAnalytics gaId="G-PFDCXHXDEC" />
      </body>
    </html>
  );
}
