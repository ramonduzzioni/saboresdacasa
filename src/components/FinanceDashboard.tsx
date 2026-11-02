'use client';

import React, { useState } from 'react';
import { MovimentacaoFinanceira, Pedido } from '@/types';
import { TrendingUp, TrendingDown, DollarSign, PlusCircle, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, Check, X } from 'lucide-react';

interface FinanceDashboardProps {
  movimentacoes: MovimentacaoFinanceira[];
  pedidos: Pedido[];
  onAddMovimentacao: (mov: MovimentacaoFinanceira) => void;
}

export function FinanceDashboard({ movimentacoes, pedidos, onAddMovimentacao }: FinanceDashboardProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Insumos & Ingredientes');
  const [anoSelecionado, setAnoSelecionado] = useState(2026);

  // Cálculos gerais
  const totalEntradas = movimentacoes
    .filter((m) => m.tipo === 'entrada')
    .reduce((acc, m) => acc + m.valor, 0);

  const totalSaidas = movimentacoes
    .filter((m) => m.tipo === 'saida')
    .reduce((acc, m) => acc + m.valor, 0);

  const saldoLiquido = totalEntradas - totalSaidas;

  // Dados mensais simulados/reais para o gráfico
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dadosMensais = [
    { mes: 'Jan', vendas: 4200, despesas: 1400 },
    { mes: 'Fev', vendas: 5100, despesas: 1800 },
    { mes: 'Mar', vendas: 4800, despesas: 1600 },
    { mes: 'Abr', vendas: 6200, despesas: 2100 },
    { mes: 'Mai', vendas: 7400, despesas: 2500 },
    { mes: 'Jun', vendas: 6800, despesas: 2300 },
    { mes: 'Jul', vendas: 7900, despesas: 2600 },
    { mes: 'Ago', vendas: 8400, despesas: 2900 },
    { mes: 'Set', vendas: 8100, despesas: 2700 },
    { mes: 'Out', vendas: 9200, despesas: 3100 },
    { mes: 'Nov', vendas: 10400, despesas: 3400 },
    { mes: 'Dez', vendas: 14800, despesas: 4900 },
  ];

  const maxVenda = Math.max(...dadosMensais.map((d) => d.vendas));

  const handleSalvarMovimentacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !descricao.trim()) return;

    const nova: MovimentacaoFinanceira = {
      id: `mov-${Date.now()}`,
      tipo,
      valor: parseFloat(valor),
      descricao: descricao.trim(),
      categoria,
      data: new Date().toISOString(),
    };

    onAddMovimentacao(nova);
    setValor('');
    setDescricao('');
    setModalAberto(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Entradas / Faturamento */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Entradas (Vendas)
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1 block">
              R$ {totalEntradas.toFixed(2)}
            </span>
            <span className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              Sinais e recebimentos
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Saídas / Despesas */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block">
              Saídas (Despesas)
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-1 block">
              R$ {totalSaidas.toFixed(2)}
            </span>
            <span className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              Insumos e embalagens
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo Líquido / Caixa */}
        <div className="bg-[#6E473B] text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#E6C285] uppercase tracking-wider block">
              Saldo em Caixa
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white mt-1 block">
              R$ {saldoLiquido.toFixed(2)}
            </span>
            <span className="text-[11px] text-[#FAF7F2]/80 mt-0.5 block">
              Lucro operacional acumulado
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 text-[#E6C285] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Gráfico de Vendas Mensais */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#6E473B] border border-[#E8E2D9]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2C2420]">
                Faturamento Mensal ({anoSelecionado})
              </h3>
              <p className="text-xs text-[#8E6554]">
                Evolução de vendas e encomendas ao longo do ano
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              className="bg-[#FAF7F2] border border-[#D8CABE] rounded-xl py-1.5 px-3 text-xs font-bold text-[#6E473B]"
            >
              <option value={2026}>Ano 2026</option>
              <option value={2025}>Ano 2025</option>
            </select>

            <button
              onClick={() => setModalAberto(true)}
              className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#6E473B] text-white text-xs font-bold hover:bg-[#57372D] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Lançar Saída/Entrada</span>
            </button>
          </div>
        </div>

        {/* Barras do Gráfico */}
        <div className="h-56 flex items-end justify-between gap-1 sm:gap-3 pt-6 pb-2 px-1 border-b border-[#E8E2D9]">
          {dadosMensais.map((item) => {
            const percVenda = Math.round((item.vendas / maxVenda) * 100);
            return (
              <div key={item.mes} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                {/* Tooltip no hover */}
                <span className="text-[10px] font-bold text-[#6E473B] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  R$ {(item.vendas / 1000).toFixed(1)}k
                </span>

                <div
                  className="w-full max-w-[28px] bg-[#6E473B] hover:bg-[#C68A4C] rounded-t-lg transition-all"
                  style={{ height: `${percVenda}%` }}
                ></div>

                <span className="text-[11px] font-bold text-[#8E6554] uppercase">
                  {item.mes}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center text-xs text-neutral-500 pt-3">
          <span>Total anual previsto: <strong>R$ 88.500,00</strong></span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#6E473B] inline-block"></span>
            Vendas Mensais
          </span>
        </div>
      </div>

      {/* Histórico Recente de Entradas e Saídas */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <h3 className="font-bold text-base text-[#2C2420] mb-3">
          Extrato Recente de Movimentações
        </h3>

        <div className="divide-y divide-[#F2EDE4]">
          {movimentacoes.slice(0, 8).map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    m.tipo === 'entrada'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {m.tipo === 'entrada' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-[#2C2420]">{m.descricao}</h4>
                  <span className="text-[11px] text-neutral-500">
                    {new Date(m.data).toLocaleDateString('pt-BR')} • {m.categoria}
                  </span>
                </div>
              </div>

              <div
                className={`font-extrabold text-sm sm:text-base whitespace-nowrap ${
                  m.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {m.tipo === 'entrada' ? '+' : '-'} R$ {m.valor.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL PARA LANÇAR NOVA ENTRADA/SAÍDA */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#6E473B]/20">
            <div className="bg-[#6E473B] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Lançar Movimentação Financeira</h3>
              <button onClick={() => setModalAberto(false)} className="p-1 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarMovimentacao} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('entrada')}
                    className={`py-2 rounded-xl font-bold text-xs border ${
                      tipo === 'entrada'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-800 border-[#D8CABE]'
                    }`}
                  >
                    + Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('saida')}
                    className={`py-2 rounded-xl font-bold text-xs border ${
                      tipo === 'saida'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-rose-800 border-[#D8CABE]'
                    }`}
                  >
                    - Saída (Despesa)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-base font-bold text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Farinha de trigo, caixas de papelão, manteiga..."
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                >
                  <option value="Insumos & Ingredientes">Insumos & Ingredientes</option>
                  <option value="Embalagens">Embalagens</option>
                  <option value="Venda de Pedido">Venda de Pedido</option>
                  <option value="Gás & Energia">Gás & Energia</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#D8CABE] text-[#6E473B] font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#6E473B] text-white font-bold text-xs shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
