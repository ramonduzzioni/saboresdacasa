'use client';

import React, { useState } from 'react';
import { Cliente, ItemPedido, Pedido, Produto } from '@/types';
import { getPrecoProdutoParaCliente } from '@/lib/storage';
import { X, Plus, Minus, Trash2, Check, Calendar, Clock, MapPin, AlertCircle, Tag } from 'lucide-react';

interface NewOrderModalProps {
  clientes: Cliente[];
  produtos: Produto[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedido: Pedido) => void;
}

export function NewOrderModal({ clientes, produtos, isOpen, onClose, onSave }: NewOrderModalProps) {
  const [clienteId, setClienteId] = useState(clientes[0]?.id || '');
  const [dataHora, setDataHora] = useState('2026-11-02T18:00');
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [produtoSel, setProdutoSel] = useState('');

  if (!isOpen) return null;

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);

  const handleAddItem = () => {
    if (!produtoSel) return;
    const p = produtos.find((x) => x.id === produtoSel);
    if (!p) return;

    const preco = getPrecoProdutoParaCliente(p, clienteSelecionado);
    const exist = itens.find((x) => x.produtoId === p.id);
    if (exist) {
      setItens(
        itens.map((x) =>
          x.produtoId === p.id
            ? { ...x, quantidade: x.quantidade + 1, subtotal: (x.quantidade + 1) * x.precoUnitario }
            : x
        )
      );
    } else {
      setItens([
        ...itens,
        {
          id: `item-${Date.now()}`,
          produtoId: p.id,
          nomeProduto: p.nome,
          quantidade: 1,
          tipoUnidade: p.tipoUnidade,
          precoUnitario: preco,
          subtotal: preco,
        },
      ]);
    }
    setProdutoSel('');
  };

  const handleUpdateQtd = (id: string, delta: number) => {
    setItens(
      itens.map((x) => {
        if (x.id === id) {
          const nova = Math.max(1, x.quantidade + delta);
          return { ...x, quantidade: nova, subtotal: nova * x.precoUnitario };
        }
        return x;
      })
    );
  };

  const handleRemove = (id: string) => {
    setItens(itens.filter((x) => x.id !== id));
  };

  const valorTotal = itens.reduce((a, b) => a + b.subtotal, 0);
  const valorSinal = Number((valorTotal * 0.5).toFixed(2));
  const valorRestante = Number((valorTotal - valorSinal).toFixed(2));

  const handleCriar = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente || itens.length === 0) {
      alert('Selecione um cliente e adicione pelo menos um item!');
      return;
    }

    const novoPedido: Pedido = {
      id: `ped-${Date.now()}`,
      numeroPedido: Math.floor(100 + Math.random() * 900),
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone,
      clienteEndereco: cliente.endereco,
      googleMapsUrl: cliente.googleMapsUrl,
      dataHoraEntrega: new Date(dataHora).toISOString(),
      tipoEntrega,
      itens,
      valorTotal,
      valorSinal,
      valorRestante,
      statusPagamento: 'pendente',
      observacoes,
      createdAt: new Date().toISOString(),
    };

    onSave(novoPedido);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="bg-[#FAF7F2] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#6E473B]/20 max-h-[92vh] flex flex-col">
        <div className="bg-[#6E473B] text-white p-4 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-base">Novo Pedido Manual</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCriar} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-[#6E473B] mb-1">Cliente *</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm font-semibold text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.tabelaPreco === 'parque' ? '🎡 (Tabela Parque)' : ''} ({c.telefone})
                </option>
              ))}
            </select>
          </div>

          {clienteSelecionado?.tabelaPreco === 'parque' && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
              <span className="text-lg shrink-0">🎡</span>
              <div className="leading-snug">
                <strong>Tabela do Parque Temático Ativa:</strong> Os produtos adicionados puxarão automaticamente os preços especiais combinados com o parque.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6E473B] mb-1">Data e Hora *</label>
              <input
                type="datetime-local"
                required
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-xs font-bold text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E473B] mb-1">Tipo de Entrega</label>
              <select
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value as 'entrega' | 'retirada')}
                className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-xs font-bold text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              >
                <option value="entrega">Entrega no Local</option>
                <option value="retirada">Retirada no Balcão</option>
              </select>
            </div>
          </div>

          {/* Adicionar Itens */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#6E473B] mb-1">Adicionar Produtos</label>
            <div className="flex gap-2">
              <select
                value={produtoSel}
                onChange={(e) => setProdutoSel(e.target.value)}
                className="flex-1 bg-white border border-[#D8CABE] rounded-xl p-2.5 text-xs text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              >
                <option value="">Selecione um doce ou salgado...</option>
                {produtos.map((p) => {
                  const preco = getPrecoProdutoParaCliente(p, clienteSelecionado);
                  const isPrecoParque = clienteSelecionado?.tabelaPreco === 'parque' && typeof p.precoParque === 'number' && p.precoParque > 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.nome} — R$ {preco.toFixed(2)}/{p.tipoUnidade} {isPrecoParque ? '🎡 (Parque)' : ''}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!produtoSel}
                className="px-3 rounded-xl bg-[#6E473B] text-white text-xs font-bold disabled:opacity-40"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Lista de Itens do Pedido */}
          <div className="space-y-2">
            {itens.map((item) => (
              <div key={item.id} className="bg-white p-2.5 rounded-xl border border-[#E8E2D9] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#2C2420]">{item.nomeProduto}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#8E6554]">
                    <span>R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precoUnitario}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setItens(
                          itens.map((x) =>
                            x.id === item.id
                              ? { ...x, precoUnitario: val, subtotal: x.quantidade * val }
                              : x
                          )
                        );
                      }}
                      className="w-16 bg-[#FAF7F2] border border-[#D8CABE] rounded px-1.5 py-0.5 text-[11px] font-bold text-[#6E473B]"
                    />
                    <span>x {item.quantidade} = <strong className="text-[#2C2420]">R$ {item.subtotal.toFixed(2)}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateQtd(item.id, -1)}
                    className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#D8CABE] font-bold text-sm flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantidade}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQtd(item.id, 1)}
                    className="w-8 h-8 rounded-lg bg-[#6E473B] text-white font-bold text-sm flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E473B] mb-1">Observações</label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Não colocar pimenta, massa bem assada..."
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-xs text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            />
          </div>

          {/* Totais */}
          <div className="bg-white p-3 rounded-xl border border-[#E8E2D9] flex justify-between items-center text-xs">
            <div>
              <span className="text-neutral-500 block">Total do Pedido:</span>
              <span className="text-base font-extrabold text-[#6E473B]">R$ {valorTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-emerald-700 block">Sinal 50%:</span>
              <span className="font-bold text-emerald-700">R$ {valorSinal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-amber-700 block">Saldo na Entrega:</span>
              <span className="font-bold text-amber-800">R$ {valorRestante.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-xl border border-[#D8CABE] text-[#6E473B] font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={itens.length === 0}
              className="w-1/2 py-3 rounded-xl bg-[#6E473B] disabled:opacity-40 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Pedido</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
