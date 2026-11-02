'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Cliente, ItemPedido, Pedido, Produto } from '@/types';
import { getPrecoProdutoParaCliente } from '@/lib/storage';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Check,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Tag,
  Search,
  User,
  Phone,
  Building2,
} from 'lucide-react';

interface NewOrderModalProps {
  clientes: Cliente[];
  produtos: Produto[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedido: Pedido) => void;
}

export function NewOrderModal({ clientes, produtos, isOpen, onClose, onSave }: NewOrderModalProps) {
  const [clienteId, setClienteId] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [dataHora, setDataHora] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [produtoSel, setProdutoSel] = useState('');

  // Inicializa e sincroniza os dados do cliente sempre que o modal abre ou a lista carrega
  useEffect(() => {
    if (isOpen) {
      if (clientes.length > 0) {
        // Dá preferência a selecionar a Toca do Urso ou o primeiro da lista
        const preferido =
          clientes.find((c) => c.nome.toLowerCase().includes('urso')) || clientes[0];
        setClienteId(preferido.id);
        setBuscaCliente(preferido.nome);
      } else {
        setClienteId('');
        setBuscaCliente('');
      }

      // Horário padrão: hoje + 2 horas
      const d = new Date();
      d.setHours(d.getHours() + 2);
      d.setMinutes(0);
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      const hora = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setDataHora(`${ano}-${mes}-${dia}T${hora}:${min}`);

      setItens([]);
      setObservacoes('');
      setProdutoSel('');
      setMostrarSugestoes(false);
    }
  }, [isOpen, clientes]);

  const clienteSelecionado = useMemo(() => {
    if (clienteId) {
      const c = clientes.find((x) => x.id === clienteId);
      if (c) return c;
    }
    if (buscaCliente.trim()) {
      const termo = buscaCliente.toLowerCase().trim();
      const c = clientes.find((x) => x.nome.toLowerCase() === termo);
      if (c) return c;
      if (termo.includes('urso') || termo.includes('parque')) {
        const urso = clientes.find((x) => x.nome.toLowerCase().includes('urso') || x.nome.toLowerCase().includes('parque'));
        if (urso) return urso;
      }
    }
    return null;
  }, [clientes, clienteId, buscaCliente]);

  // Filtra clientes pelo nome digitado na busca
  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes;
    const termo = buscaCliente.toLowerCase().trim();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.telefone.replace(/\D/g, '').includes(termo.replace(/\D/g, '')) ||
        c.endereco.toLowerCase().includes(termo)
    );
  }, [clientes, buscaCliente]);

  // Quando o cliente selecionado mudar (ex: Parque Temático vs Padrão),
  // atualiza automaticamente os preços unitários e subtotais de todos os itens já adicionados
  useEffect(() => {
    if (itens.length === 0) return;
    setItens((prev) =>
      prev.map((item) => {
        const prod = produtos.find(
          (p) => p.id === item.produtoId || p.nome.toLowerCase() === item.nomeProduto.toLowerCase()
        );
        if (!prod) return item;
        const novoPreco = getPrecoProdutoParaCliente(prod, clienteSelecionado);
        if (novoPreco > 0 && Math.abs(item.precoUnitario - novoPreco) > 0.001) {
          return {
            ...item,
            precoUnitario: novoPreco,
            subtotal: Number((item.quantidade * novoPreco).toFixed(2)),
          };
        }
        return item;
      })
    );
  }, [clienteSelecionado, produtos]);

  if (!isOpen) return null;

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

  const isQuinzenal =
    clienteSelecionado?.tipoCobranca === 'quinzenal' ||
    clienteSelecionado?.tabelaPreco === 'parque' ||
    clienteSelecionado?.nome.toLowerCase().includes('urso') ||
    clienteSelecionado?.nome.toLowerCase().includes('parque') ||
    buscaCliente.toLowerCase().includes('urso') ||
    buscaCliente.toLowerCase().includes('parque');

  const valorTotal = itens.reduce((a, b) => a + b.subtotal, 0);
  const valorSinal = isQuinzenal ? 0 : Number((valorTotal * 0.5).toFixed(2));
  const valorRestante = isQuinzenal ? valorTotal : Number((valorTotal - valorSinal).toFixed(2));

  const handleCriar = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente =
      clienteSelecionado ||
      (buscaCliente.trim()
        ? ({
            id: `cli-${Date.now()}`,
            nome: buscaCliente.trim(),
            telefone: '',
            endereco: '',
            tabelaPreco: isQuinzenal ? 'parque' : 'padrao',
            tipoCobranca: isQuinzenal ? 'quinzenal' : 'padrao_50',
          } as Cliente)
        : null);

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
      tipoCobranca: isQuinzenal ? 'quinzenal' : 'padrao_50',
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
          {/* SELEÇÃO E BUSCA DE CLIENTE PELO NOME CADASTRADO */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#6E473B]">
                Puxar Cliente Cadastrado *
              </label>
              <span className="text-[11px] text-neutral-500 font-medium">
                {clientes.length} clientes cadastrados
              </span>
            </div>

            {/* Campo 1: Digitação do Nome com Autocomplete / Sugestões */}
            <div className="relative mb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaCliente}
                  onChange={(e) => {
                    setBuscaCliente(e.target.value);
                    setMostrarSugestoes(true);
                  }}
                  onFocus={() => setMostrarSugestoes(true)}
                  placeholder="Digite para buscar pelo nome (ex: Toca do Urso, Mariana...)"
                  className="w-full bg-white border border-[#D8CABE] rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden placeholder:text-neutral-400"
                />
                {buscaCliente && (
                  <button
                    type="button"
                    onClick={() => {
                      setBuscaCliente('');
                      setMostrarSugestoes(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Lista suspensa de clientes encontrados pelo nome */}
              {mostrarSugestoes && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#D8CABE] rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-neutral-100 animate-in fade-in">
                  {clientesFiltrados.length === 0 ? (
                    <div className="p-3 text-center text-xs text-neutral-500">
                      Nenhum cliente cadastrado com este nome.
                    </div>
                  ) : (
                    clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClienteId(c.id);
                          setBuscaCliente(c.nome);
                          setMostrarSugestoes(false);
                        }}
                        className={`w-full text-left p-2.5 hover:bg-[#FAF7F2] transition-colors flex items-center justify-between gap-2 ${
                          clienteId === c.id ? 'bg-[#F5EFE6]' : ''
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-[#2C2420] flex items-center gap-1.5">
                            <span>{c.nome}</span>
                            {c.tabelaPreco === 'parque' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                                🎡 Tabela Parque
                              </span>
                            )}
                            {c.tipoCobranca === 'quinzenal' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-extrabold">
                                📅 Quinzenal
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {c.telefone} • {c.endereco || 'Retirada no Balcão'}
                          </div>
                        </div>
                        {clienteId === c.id && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Campo 2: Seletor Dropdown Completo */}
            <select
              value={clienteId}
              onChange={(e) => {
                const id = e.target.value;
                setClienteId(id);
                const sel = clientes.find((c) => c.id === id);
                if (sel) {
                  setBuscaCliente(sel.nome);
                }
                setMostrarSugestoes(false);
              }}
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-xs font-bold text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            >
              <option value="">-- Ou escolha na lista de clientes --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.tabelaPreco === 'parque' ? '🎡 (Tabela Parque)' : ''} ({c.telefone})
                </option>
              ))}
            </select>

            {/* Card com os dados puxados do cliente */}
            {clienteSelecionado && (
              <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#E8E2D9] text-xs shadow-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#6E473B]" />
                    <span className="font-extrabold text-sm text-[#4A3026]">
                      {clienteSelecionado.nome}
                    </span>
                  </div>
                  {isQuinzenal ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                      📅 Faturamento Quinzenal (Sem Sinal)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Sinal 50%
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-neutral-600 text-[11px] pt-1 border-t border-[#F2EDE4]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <strong>{clienteSelecionado.telefone}</strong>
                  </span>
                  {clienteSelecionado.endereco && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{clienteSelecionado.endereco}</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {clienteSelecionado?.tabelaPreco === 'parque' && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
              <span className="text-lg shrink-0">🎡</span>
              <div className="leading-snug">
                <strong>Tabela do Parque Temático Ativa:</strong> Os produtos adicionados puxarão automaticamente os preços negociados com a Toca do Urso.
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
          {isQuinzenal ? (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-300 flex justify-between items-center text-xs">
              <div>
                <span className="text-amber-800 font-medium block">Total do Pedido (Tabela Parque):</span>
                <span className="text-base font-extrabold text-[#6E473B]">R$ {valorTotal.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-amber-800 font-extrabold block">🎡 Faturamento Quinzenal</span>
                <span className="text-[11px] text-amber-700 font-medium">Sem sinal de 50% • Cobrança dia 15/30</span>
              </div>
            </div>
          ) : (
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
          )}

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
