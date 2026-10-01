import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Política de Privacidade e Termos de Uso | Deal Hunter Pro',
  description:
    'Política de Privacidade, Termos de Uso e Declaração de Conformidade com as Diretrizes da Google Chrome Web Store e LGPD para o Deal Hunter Pro.',
  alternates: {
    canonical: 'https://www.dealhunterpro.com.br/privacy',
  },
  openGraph: {
    title: 'Política de Privacidade e Termos de Uso — Deal Hunter Pro',
    description:
      'Transparência total: veja como tratamos seus dados, nossas permissões na extensão do Chrome e conformidade com a LGPD e Chrome Web Store.',
    url: 'https://www.dealhunterpro.com.br/privacy',
    siteName: 'Deal Hunter Pro',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
