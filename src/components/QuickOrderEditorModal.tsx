'use client';

import React, { useState, useEffect } from 'react';
import { Pedido, ItemPedido, Produto } from '@/types';
import { X, Plus, Minus, Trash2, ShoppingBag, PlusCircle, Check, MessageSquare, AlertCircle } from 'lucide-react';

interface QuickOrderEditorModalProps {
  pedido: Pedido | null;
  produtosDisponiveis: Produto[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedidoAtualizado: Pedido) => void;
}

export function QuickOrderEditorModal({
  pedido,
  produtosDisponiveis,
  isOpen,
  onClose,
  onSave,
}: QuickOrderEditorModalProps) {
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [produtoSelecionadoParaAdicionar, setProdutoSelecionadoParaAdicionar] = useState<string>('');
  const [percentualSinal, setPercentualSinal] = useState<number>(50);

  useEffect(() => {
    if (pedido) {
      setItens(JSON.parse(JSON.stringify(pedido.itens)));
      setObservacoes(pedido.observacoes || '');
      // Calcula percentual atual do sinal se houver
      if (pedido.valorTotal > 0) {
        const perc = Math.round((pedido.valorSinal / pedido.valorTotal) * 100);
        setPercentualSinal(perc || 50);
      }
    }
  }, [pedido]);

  if (!isOpen || !pedido) return null;

  // Atualiza quantidade com segurança
  const handleAlterarQuantidade = (itemId: string, delta: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const novaQtd = Math.max(0.5, Number((item.quantidade + delta).toFixed(2)));
          return {
            ...item,
            quantidade: novaQtd,
            subtotal: Number((novaQtd * item.precoUnitario).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const handleInputQuantidade = (itemId: string, valorStr: string) => {
    const val = parseFloat(valorStr);
    const novaQtd = isNaN(val) ? 0 : val;
    setItens((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantidade: novaQtd,
            subtotal: Number((novaQtd * item.precoUnitario).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const handleRemoverItem = (itemId: string) => {
    setItens((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAdicionarProduto = () => {
    if (!produtoSelecionadoParaAdicionar) return;
    const prod = produtosDisponiveis.find((p) => p.id === produtoSelecionadoParaAdicionar);
    if (!prod) return;

    // Se já tiver no pedido, só incrementa 1
    const existente = itens.find((i) => i.produtoId === prod.id);
    if (existente) {
      handleAlterarQuantidade(existente.id, 1);
    } else {
      const novoItem: ItemPedido = {
        id: `item-${Date.now()}`,
        produtoId: prod.id,
        nomeProduto: prod.nome,
        quantidade: 1,
        tipoUnidade: prod.tipoUnidade,
        precoUnitario: prod.precoBase,
        subtotal: prod.precoBase,
      };
      setItens((prev) => [...prev, novoItem]);
    }
    setProdutoSelecionadoParaAdicionar('');
  };

  // Totais
  const novoValorTotal = itens.reduce((acc, i) => acc + (i.subtotal || 0), 0);
  const novoValorSinal = Number(((novoValorTotal * percentualSinal) / 100).toFixed(2));
  const novoValorRestante = Number((novoValorTotal - novoValorSinal).toFixed(2));

  const handleSalvar = () => {
    const pedidoAtualizado: Pedido = {
      ...pedido,
      itens,
      observacoes,
      valorTotal: novoValorTotal,
      valorSinal: novoValorSinal,
      valorRestante: novoValorRestante,
    };
    onSave(pedidoAtualizado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-xl max-h-[92vh] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden border border-[#6E473B]/20">
        
        {/* Cabeçalho do Modal */}
        <div className="bg-[#6E473B] text-[#FAF7F2] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FAF7F2]/20 text-[#E6C285]">
                PEDIDO #{pedido.numeroPedido}
              </span>
              <span className="text-xs text-[#FAF7F2]/80">Edição Rápida</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1 mt-0.5">
              {pedido.clienteNome}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Aviso de facilidade para casas de eventos */}
        <div className="bg-[#E8DFD3] px-4 py-2 text-xs text-[#4A3026] flex items-center gap-2 font-medium border-b border-[#D8CABE]">
          <AlertCircle className="w-4 h-4 text-[#C68A4C] shrink-0" />
          <span>Altere as quantidades facilmente com os botões grandes de <strong>+</strong> e <strong>-</strong></span>
        </div>

        {/* Lista de Itens com BOTÕES GRANDES PARA O CELULAR */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {itens.length === 0 ? (
            <div className="text-center py-8 text-sm text-neutral-500">
              Nenhum item no pedido. Adicione itens abaixo!
            </div>
          ) : (
            itens.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3.5 shadow-xs border border-[#E8E2D9] flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-bold text-sm sm:text-base text-[#2C2420] block">
                      {item.nomeProduto}
                    </span>
                    <span className="text-xs text-[#8E6554]">
                      R$ {item.precoUnitario.toFixed(2)} / {item.tipoUnidade}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#6E473B]">
                      R$ {item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* CONTROLE DE QUANTIDADE COM BOTÕES GRANDES PARA O POLEGAR */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-[#E8E2D9]">
                  <button
                    type="button"
                    onClick={() => handleRemoverItem(item.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remover item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Botão MENOS Gigante */}
                    <button
                      type="button"
                      onClick={() => handleAlterarQuantidade(item.id, -1)}
                      className="w-12 h-12 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E2D9] border-2 border-[#D8CABE] active:bg-[#C68A4C] active:text-white text-[#4A3026] font-extrabold text-2xl flex items-center justify-center transition-all shadow-xs active:scale-95"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="w-6 h-6 stroke-[3]" />
                    </button>

                    {/* Input Numérico Direto */}
                    <div className="relative">
                      <input
                        type="number"
                        step={item.tipoUnidade === 'kg' ? '0.5' : '1'}
                        min="0"
                        value={item.quantidade === 0 ? '' : item.quantidade}
                        onChange={(e) => handleInputQuantidade(item.id, e.target.value)}
                        className="w-20 h-12 text-center text-xl font-bold bg-[#FAF7F2] border-2 border-[#6E473B] rounded-xl text-[#2C2420] focus:ring-2 focus:ring-[#C68A4C] focus:outline-hidden"
                      />
                      <span className="absolute -bottom-4 left-0 right-0 text-[10px] text-center font-bold text-[#8E6554] uppercase tracking-wider">
                        {item.tipoUnidade}
                      </span>
                    </div>

                    {/* Botão MAIS Gigante */}
                    <button
                      type="button"
                      onClick={() => handleAlterarQuantidade(item.id, 1)}
                      className="w-12 h-12 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white active:bg-[#4A3026] font-extrabold text-2xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="w-6 h-6 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Adicionar Outro Produto Rapidamente */}
          <div className="bg-white/80 p-3 rounded-xl border border-dashed border-[#C68A4C] flex gap-2 items-center">
            <select
              value={produtoSelecionadoParaAdicionar}
              onChange={(e) => setProdutoSelecionadoParaAdicionar(e.target.value)}
              className="flex-1 bg-[#FAF7F2] border border-[#D8CABE] rounded-xl py-2.5 px-3 text-sm text-[#2C2420] font-medium focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            >
              <option value="">+ Adicionar outro produto do cardápio...</option>
              {produtosDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — R$ {p.precoBase.toFixed(2)}/{p.tipoUnidade}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdicionarProduto}
              disabled={!produtoSelecionadoParaAdicionar}
              className="py-2.5 px-4 rounded-xl bg-[#6E473B] disabled:opacity-40 text-white font-bold text-sm flex items-center gap-1 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>

          {/* Observações rápidas */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#6E473B] mb-1">
              Observações do Pedido (Ex: horário especial, detalhes de sabor)
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Fritar bem dourado, entregar pela porta lateral..."
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Rodapé Fixo com Resumo Financeiro & Botão de Salvar */}
        <div className="bg-white border-t border-[#E8E2D9] p-4 shrink-0 shadow-lg">
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E2D9]">
              <span className="text-[11px] text-[#8E6554] block font-medium">Novo Total</span>
              <span className="text-base font-extrabold text-[#2C2420]">
                R$ {novoValorTotal.toFixed(2)}
              </span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 block font-medium">Sinal ({percentualSinal}%)</span>
              <span className="text-base font-extrabold text-emerald-700">
                R$ {novoValorSinal.toFixed(2)}
              </span>
            </div>
            <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
              <span className="text-[11px] text-amber-900 block font-medium">Restante</span>
              <span className="text-base font-extrabold text-amber-800">
                R$ {novoValorRestante.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3.5 rounded-xl border-2 border-[#D8CABE] text-[#6E473B] font-bold text-sm hover:bg-[#FAF7F2] transition-colors active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              className="w-2/3 py-3.5 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
