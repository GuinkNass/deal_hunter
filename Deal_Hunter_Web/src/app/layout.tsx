import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deal Hunter — Autenticação e Licença',
  description: 'Sistema oficial de autenticação e licenciamento da extensão Deal Hunter.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0b0f19] text-gray-100 antialiased min-h-screen flex flex-col justify-center">
        {children}
      </body>
    </html>
  );
}
