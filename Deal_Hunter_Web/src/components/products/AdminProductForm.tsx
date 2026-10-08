'use client';

import React, { useState, useTransition } from 'react';
import { CreateProductInput, Product } from '@/lib/products/types';
import { PlusCircle, Loader2, Sparkles, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { createProductAction } from '@/lib/products/actions';

interface AdminProductFormProps {
  onProductCreated?: (product: Product) => void;
}

const PRESET_EXAMPLES = [
  {
    title: 'Smart TV 55" 4K UHD Crystal HDR10+',
    price: 2499.0,
    promotional_price: 1999.0,
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Cadeira Gamer Ergonômica Reclinável 180°',
    price: 899.9,
    promotional_price: 649.9,
    stock: 8,
    image_url: 'https://images.unsplash.com/photo-1580481077195-c9a9134a41f6?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Teclado Mecânico RGB Switch Blue Anti-Ghosting',
    price: 289.0,
    promotional_price: null,
    stock: 0, // Teste de esgotado
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  },
];

export const AdminProductForm: React.FC<AdminProductFormProps> = ({ onProductCreated }) => {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<CreateProductInput>({
    title: '',
    price: 0,
    promotional_price: null,
    stock: 10,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  });

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: string;
  } | null>(null);

  const applyPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    setFormData({
      title: preset.title,
      price: preset.price,
      promotional_price: preset.promotional_price,
      stock: preset.stock,
      image_url: preset.image_url,
    });
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Informe um título para o produto.' });
      return;
    }

    if (formData.price <= 0) {
      setMessage({ type: 'error', text: 'O preço de tabela deve ser maior que R$ 0,00.' });
      return;
    }

    if (
      formData.promotional_price !== null &&
      formData.promotional_price !== undefined &&
      formData.promotional_price >= formData.price
    ) {
      setMessage({
        type: 'error',
        text: 'O preço promocional deve ser estritamente menor que o preço original.',
      });
      return;
    }

    startTransition(async () => {
      try {
        // Tenta primeiro via Server Action (Next.js App Router nativo com revalidateTag/revalidatePath)
        const result = await createProductAction(formData);

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erro na criação do produto');
        }

        const createdProduct = result.data;

        setMessage({
          type: 'success',
          text: `Produto "${createdProduct.title}" inserido com sucesso!`,
          details: 'Cache do Next.js invalidado sob demanda instantaneamente (sem rebuild).',
        });

        // Limpa o formulário
        setFormData({
          title: '',
          price: 0,
          promotional_price: null,
          stock: 10,
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        });

        if (onProductCreated) {
          onProductCreated(createdProduct);
        }
      } catch (err: any) {
        // Fallback via API Route REST POST /api/products
        try {
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          const json = await res.json();
          if (json.success && json.data) {
            setMessage({
              type: 'success',
              text: `Produto "${json.data.title}" inserido via API!`,
              details: 'Cache invalidado instantaneamente.',
            });
            if (onProductCreated) onProductCreated(json.data);
            return;
          }
          throw new Error(json.error || err.message);
        } catch (apiErr: any) {
          setMessage({
            type: 'error',
            text: `Erro ao cadastrar: ${apiErr.message || 'Falha de comunicação'}`,
          });
        }
      }
    });
  };

  return (
    <div className="bg-[#0f1422] border border-cyan-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Luz ambiente de destaque */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Painel de Teste Administrativo
            </span>
            <span className="text-xs text-slate-400">On-Demand Cache Revalidation</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Cadastrar Novo Produto na Vitrine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Os produtos cadastrados aqui invalidam o cache imediatamente e aparecem na vitrine em tempo real.
          </p>
        </div>

        {/* Botões de Preenchimento Rápido (Presets) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400">Presets de Teste:</span>
          {PRESET_EXAMPLES.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            >
              Exemplo {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Título */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">
              Título do Produto <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fone Bluetooth Noise Cancelling Hi-Res Audio"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>

          {/* Preço Normal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Preço de Tabela (R$) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>

          {/* Preço Promocional */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Preço Promocional (R$) <span className="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Deixe em branco se não houver desconto"
              value={formData.promotional_price ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  promotional_price: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>

          {/* Estoque */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Quantidade em Estoque <span className="text-slate-500 font-normal">(0 = Esgotado)</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.stock ?? 0}
              onChange={(e) =>
                setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>

          {/* URL da Imagem */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              URL da Imagem <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Feedback visual de Mensagens */}
        {message && (
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 text-xs ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{message.text}</p>
              {message.details && (
                <p className="text-[11px] text-slate-300 mt-0.5 opacity-90">{message.details}</p>
              )}
            </div>
          </div>
        )}

        {/* Botão de Envio */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Invalidando Cache & Salvando...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Cadastrar Produto Instantaneamente</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
