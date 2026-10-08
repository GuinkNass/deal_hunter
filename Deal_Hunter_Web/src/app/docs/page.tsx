import React from 'react';
import { Metadata } from 'next';
import DocsClient from './DocsClient';

export const metadata: Metadata = {
  title: 'Documentação do Usuário • Deal Hunter Pro',
  description: 'Guia completo de uso, configuração de APIs (Gemini e Mercado Livre), extensão do Chrome, radar de oportunidades e calculadora de margem.',
};

export default function DocsPage() {
  return <DocsClient />;
}
