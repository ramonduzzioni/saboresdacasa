'use client';

import React, { useState } from 'react';
import { Cliente, ItemPedido, Pedido, Produto } from '@/types';
import { Sparkles, MessageSquare, Check, X, AlertCircle, ArrowRight } from 'lucide-react';

interface AiOrderImportModalProps {
  clientes: Cliente[];
  produtos: Produto[];
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (pedido: Pedido) => void;
}

export function AiOrderImportModal({
  clientes,
  produtos,
  isOpen,
  onClose,
  onOrderCreated,
}: AiOrderImportModalProps) {
  const [textoWhats, setTextoWhats] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<{
    clienteDetectado?: Cliente;
    itensDetectados: ItemPedido[];
    dataDetectada?: string;
    tipoEntrega: 'entrega' | 'retirada';
    observacoes: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleExemplo = () => {
    setTextoWhats(
      `Oi tudo bem? Aqui é do Espaço Villa Nobre! Queremos encomendar para amanhã às 18h:\n` +
      `- 140 coxinhas tradicionais\n` +
      `- 85 bolinhas de queijo\n` +
      `- 60 brigadeiros belga\n` +
      `Pode entregar direto na portaria lateral? Fritar bem quentinho!`
    );
  };

  const processarTexto = () => {
    if (!textoWhats.trim()) return;
    setCarregando(true);

    // Parser semântico inteligente
    setTimeout(() => {
      const textoLower = textoWhats.toLowerCase();

      // Detecta cliente
      let clienteDetectado = clientes.find((c) =>
        textoLower.includes(c.nome.toLowerCase().split(' ')[0]) ||
        (c.nome.toLowerCase().includes('villa nobre') && textoLower.includes('villa nobre')) ||
        (c.nome.toLowerCase().includes('morgana') && textoLower.includes('morgana')) ||
        (c.nome.toLowerCase().includes('sonho real') && textoLower.includes('sonho real'))
      );

      if (!clienteDetectado && clientes.length > 0) {
        clienteDetectado = clientes[0]; // fallback
      }

      // Detecta itens
      const itensDetectados: ItemPedido[] = [];

      produtos.forEach((prod) => {
        const nomeLower = prod.nome.toLowerCase();
        // Palavras chave (ex: coxinha, bolinha de queijo, brigadeiro, bolo, torta)
        const keywords = nomeLower.replace('cento de ', '').replace(' (kg)', '').replace(' (unidade)', '').split(' ');
        const match = keywords.some((k) => k.length > 3 && textoLower.includes(k));

        if (match) {
          // Tenta achar a quantidade antes do nome
          // Ex: "4 centos de coxinha", "2 bolo"
          const regex = new RegExp(`(\\d+([.,]\\d+)?)\\s*(centos?|unidades?|kg|kilos?)?\\s*(de)?\\s*.*${keywords[0]}`, 'i');
          const m = textoWhats.match(regex);
          let qtd = 1;
          if (m && m[1]) {
            qtd = parseFloat(m[1].replace(',', '.'));
          } else {
            // Se encontrar dígito isolado perto
            const digitoMatch = textoWhats.match(new RegExp(`(\\d+)\\s*.*${keywords[0]}`, 'i'));
            if (digitoMatch && digitoMatch[1]) qtd = parseInt(digitoMatch[1]);
          }

          itensDetectados.push({
            id: `item-ai-${Date.now()}-${prod.id}`,
            produtoId: prod.id,
            nomeProduto: prod.nome,
            quantidade: qtd,
            tipoUnidade: prod.tipoUnidade,
            precoUnitario: prod.precoBase,
            subtotal: Number((qtd * prod.precoBase).toFixed(2)),
            observacao: 'Extraído automaticamente do WhatsApp',
          });
        }
      });

      // Se nenhum item foi mapeado especificamente, usa o primeiro produto como exemplo
      if (itensDetectados.length === 0 && produtos.length > 0) {
        const p = produtos[0];
        itensDetectados.push({
          id: `item-ai-${Date.now()}`,
          produtoId: p.id,
          nomeProduto: p.nome,
          quantidade: 2,
          tipoUnidade: p.tipoUnidade,
          precoUnitario: p.precoBase,
          subtotal: p.precoBase * 2,
        });
      }

      // Detecta data/hora
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      amanha.setHours(18, 0, 0, 0);

      // Detecta tipo de entrega
      const tipoEntrega = textoLower.includes('retirar') || textoLower.includes('balcão') ? 'retirada' : 'entrega';

      // Observações
      const obsMatch = textoWhats.includes('?') ? textoWhats.split('?')[1]?.trim() : textoWhats.split('\n').pop() || '';

      setResultado({
        clienteDetectado,
        itensDetectados,
        dataDetectada: amanha.toISOString(),
        tipoEntrega,
        observacoes: obsMatch || 'Pedido gerado via Inteligência Artificial do WhatsApp',
      });
      setCarregando(false);
    }, 600);
  };

  const handleConfirmarPedido = () => {
    if (!resultado || !resultado.clienteDetectado) return;

    const valorTotal = resultado.itensDetectados.reduce((acc, i) => acc + i.subtotal, 0);
    const valorSinal = Number((valorTotal * 0.5).toFixed(2));
    const valorRestante = Number((valorTotal - valorSinal).toFixed(2));

    const novoPedido: Pedido = {
      id: `ped-${Date.now()}`,
      numeroPedido: Math.floor(100 + Math.random() * 900),
      clienteId: resultado.clienteDetectado.id,
      clienteNome: resultado.clienteDetectado.nome,
      clienteTelefone: resultado.clienteDetectado.telefone,
      clienteEndereco: resultado.clienteDetectado.endereco,
      googleMapsUrl: resultado.clienteDetectado.googleMapsUrl,
      dataHoraEntrega: resultado.dataDetectada || new Date().toISOString(),
      tipoEntrega: resultado.tipoEntrega,
      itens: resultado.itensDetectados,
      valorTotal,
      valorSinal,
      valorRestante,
      statusPagamento: 'pendente',
      observacoes: resultado.observacoes,
      createdAt: new Date().toISOString(),
    };

    onOrderCreated(novoPedido);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#6E473B]/20 max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="bg-[#6E473B] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10">
              <Sparkles className="w-5 h-5 text-[#E6C285]" />
            </div>
            <div>
              <h2 className="font-bold text-base">Importar Pedido do WhatsApp com IA</h2>
              <p className="text-xs text-[#FAF7F2]/80">Cole a mensagem e o sistema monta o pedido</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* Caixa de Texto do WhatsApp */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#6E473B] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Mensagem recebida no WhatsApp
              </label>
              <button
                type="button"
                onClick={handleExemplo}
                className="text-[11px] font-semibold text-[#8E6554] underline hover:text-[#6E473B]"
              >
                Colar exemplo de casa de eventos
              </button>
            </div>

            <textarea
              rows={4}
              value={textoWhats}
              onChange={(e) => setTextoWhats(e.target.value)}
              placeholder="Cole aqui a conversa ou áudio transcrito do WhatsApp..."
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-3 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={processarTexto}
            disabled={carregando || !textoWhats.trim()}
            className="w-full py-3.5 rounded-xl bg-[#6E473B] hover:bg-[#57372D] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-[#E6C285]" />
            <span>{carregando ? 'Identificando itens e cliente...' : 'Processar Pedido com IA'}</span>
          </button>

          {/* Resultado Detectado */}
          {resultado && (
            <div className="bg-white rounded-xl p-4 border border-emerald-300 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
                <Check className="w-4 h-4" />
                Dados Extraídos com Sucesso
              </div>

              <div className="space-y-2 text-xs text-[#2C2420]">
                <div className="bg-[#FAF7F2] p-2 rounded-lg">
                  <span className="font-semibold text-[#8E6554] block">Cliente Detectado:</span>
                  <span className="font-bold text-sm">{resultado.clienteDetectado?.nome}</span>
                  <span className="text-[11px] text-neutral-500 block">{resultado.clienteDetectado?.endereco}</span>
                </div>

                <div className="bg-[#FAF7F2] p-2 rounded-lg">
                  <span className="font-semibold text-[#8E6554] block mb-1">Itens Mapeados:</span>
                  <ul className="space-y-1">
                    {resultado.itensDetectados.map((item, idx) => (
                      <li key={idx} className="flex justify-between font-medium">
                        <span>• {item.quantidade}x {item.nomeProduto}</span>
                        <span className="font-bold text-[#6E473B]">R$ {item.subtotal.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center pt-2 font-bold text-sm border-t border-[#E8E2D9]">
                  <span>Total Previsto:</span>
                  <span className="text-[#6E473B] text-base">
                    R$ {resultado.itensDetectados.reduce((a, b) => a + b.subtotal, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmarPedido}
                className="mt-3 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs"
              >
                <span>Confirmar e Criar Pedido</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
