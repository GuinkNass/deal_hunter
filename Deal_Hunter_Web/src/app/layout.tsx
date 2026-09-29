import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
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
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <body className="bg-[#07090e] text-gray-100 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
