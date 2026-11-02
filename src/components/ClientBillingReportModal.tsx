'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Cliente, ConfiguracaoLoja, Pedido } from '@/types';
import { LOGO_DARK_BASE64 } from '@/lib/logoBase64';
import {
  X,
  Calendar,
  DollarSign,
  Download,
  Printer,
  MessageCircle,
  CheckCircle2,
  FileText,
  Building2,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ClientBillingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteInicial: Cliente | null;
  clientes: Cliente[];
  pedidos: Pedido[];
  config: ConfiguracaoLoja;
  onQuitarPedidosPeriodo?: (pedidosIds: string[], valorTotal: number, clienteNome: string) => void;
}

export function ClientBillingReportModal({
  isOpen,
  onClose,
  clienteInicial,
  clientes,
  pedidos,
  config,
  onQuitarPedidosPeriodo,
}: ClientBillingReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Cliente selecionado (padrão: o passado por props ou a Toca do Urso se existir)
  const tocaDoUrso = clientes.find((c) => c.nome.toLowerCase().includes('urso'));
  const [clienteId, setClienteId] = useState<string>(
    clienteInicial?.id || tocaDoUrso?.id || clientes[0]?.id || ''
  );

  // Período de apuração
  const hoje = new Date();
  const [ano, setAno] = useState<number>(hoje.getFullYear());
  const [mes, setMes] = useState<number>(hoje.getMonth() + 1); // 1-12
  // Padrão: se estamos até dia 15, foca na 1ª quinzena. Se passou do dia 15, 2ª quinzena.
  const [tipoPeriodo, setTipoPeriodo] = useState<'q1' | 'q2' | 'mes' | 'todos'>('q1');

  if (!isOpen) return null;

  const clienteAtual = clientes.find((c) => c.id === clienteId) || clienteInicial || clientes[0];

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Filtra pedidos do cliente no período
  const pedidosDoPeriodo = useMemo(() => {
    if (!clienteAtual) return [];

    return pedidos.filter((p) => {
      // Confere se pertence ao cliente
      const isDoCliente =
        p.clienteId === clienteAtual.id ||
        p.clienteNome.toLowerCase().includes(clienteAtual.nome.toLowerCase()) ||
        clienteAtual.nome.toLowerCase().includes(p.clienteNome.toLowerCase());

      if (!isDoCliente) return false;

      if (tipoPeriodo === 'todos') return true;

      const d = new Date(p.dataHoraEntrega);
      if (isNaN(d.getTime())) return false;

      const pAno = d.getFullYear();
      const pMes = d.getMonth() + 1;
      const pDia = d.getDate();

      if (pAno !== ano || pMes !== mes) return false;

      if (tipoPeriodo === 'q1') {
        return pDia >= 1 && pDia <= 15;
      }
      if (tipoPeriodo === 'q2') {
        return pDia >= 16;
      }
      return true; // 'mes'
    }).sort((a, b) => new Date(a.dataHoraEntrega).getTime() - new Date(b.dataHoraEntrega).getTime());
  }, [clienteAtual, pedidos, ano, mes, tipoPeriodo]);

  // Cálculos consolidados
  const totalFaturado = pedidosDoPeriodo.reduce((acc, p) => acc + p.valorTotal, 0);
  const totalSinais = pedidosDoPeriodo.reduce((acc, p) => acc + (p.valorSinal || 0), 0);
  const saldoAPagar = pedidosDoPeriodo.reduce((acc, p) => {
    // Para Toca do Urso ou quinzenal, o saldo a pagar é o total
    if (p.tipoCobranca === 'quinzenal' || clienteAtual?.tipoCobranca === 'quinzenal' || p.valorSinal === 0) {
      return acc + (p.statusPagamento === 'quitado' ? 0 : p.valorTotal);
    }
    return acc + (p.statusPagamento === 'quitado' ? 0 : p.valorRestante);
  }, 0);

  // Soma de itens agregados
  const produtosConsolidados = useMemo(() => {
    const mapa = new Map<string, { nome: string; quantidade: number; subtotal: number }>();
    pedidosDoPeriodo.forEach((p) => {
      p.itens.forEach((item) => {
        const chave = item.nomeProduto;
        const atual = mapa.get(chave) || { nome: item.nomeProduto, quantidade: 0, subtotal: 0 };
        mapa.set(chave, {
          nome: item.nomeProduto,
          quantidade: atual.quantidade + item.quantidade,
          subtotal: atual.subtotal + item.subtotal,
        });
      });
    });
    return Array.from(mapa.values()).sort((a, b) => b.quantidade - a.quantidade);
  }, [pedidosDoPeriodo]);

  const totalUnidades = produtosConsolidados.reduce((acc, p) => acc + p.quantidade, 0);

  const rotuloPeriodo =
    tipoPeriodo === 'q1'
      ? `1ª Quinzena (01 a 15 de ${mesesNomes[mes - 1]} de ${ano})`
      : tipoPeriodo === 'q2'
      ? `2ª Quinzena (16 ao último dia de ${mesesNomes[mes - 1]} de ${ano})`
      : tipoPeriodo === 'mes'
      ? `Mês Completo (${mesesNomes[mes - 1]} de ${ano})`
      : 'Histórico Completo';

  // Mensagem do WhatsApp
  const handleEnviarWhatsApp = () => {
    if (!clienteAtual) return;
    const limpo = clienteAtual.telefone.replace(/\D/g, '');

    const linhasPedidos = pedidosDoPeriodo
      .map((p) => {
        const d = new Date(p.dataHoraEntrega);
        const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `• *${dataStr}* (Pedido #${p.numeroPedido}): R$ ${p.valorTotal.toFixed(2)} [${p.statusPagamento === 'quitado' ? 'Quitado' : 'A pagar'}]`;
      })
      .join('\n');

    const texto = encodeURIComponent(
      `Olá *${clienteAtual.nome}*! Tudo bem?\n` +
      `Aqui é da *${config.nome}*.\n\n` +
      `📄 *EXTRATO DE COBRANÇA - ${rotuloPeriodo.toUpperCase()}*\n\n` +
      `📦 *Entregas Realizadas:* ${pedidosDoPeriodo.length} pedidos\n` +
      `🥟 *Total de Produtos Entregues:* ${totalUnidades} unidades\n\n` +
      `*Detalhamento das Remessas:*\n${linhasPedidos || 'Nenhuma entrega no período'}\n\n` +
      `💰 *VALOR TOTAL DO PERÍODO:* R$ ${totalFaturado.toFixed(2)}\n` +
      `🏷️ *SALDO A RECEBER / FATURAR:* *R$ ${saldoAPagar.toFixed(2)}*\n\n` +
      `🔑 *Dados para Pagamento Pix:*\n` +
      `Chave Pix: *${config.chavePix || '19981240173'}*\n` +
      `Titular: *${config.titularPix || config.nome}*\n\n` +
      `O comprovante com o extrato discriminado completo segue em anexo. Se precisarem de emissão de NF ou qualquer ajuste, estamos à disposição!\n` +
      `Muito obrigado pela parceria!`
    );

    window.open(`https://wa.me/55${limpo}?text=${texto}`, '_blank');
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleBaixarPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setGerandoPdf(true);
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF7F2',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Extrato_${clienteAtual.nome.replace(/\s+/g, '_')}_${rotuloPeriodo.replace(/[\/\s]/g, '_')}.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleQuitarTudo = () => {
    if (pedidosDoPeriodo.length === 0) return;
    const confirm = window.confirm(
      `Confirmar baixa e quitação de ${pedidosDoPeriodo.length} pedidos no valor total de R$ ${saldoAPagar.toFixed(2)}?`
    );
    if (!confirm) return;

    if (onQuitarPedidosPeriodo) {
      onQuitarPedidosPeriodo(
        pedidosDoPeriodo.map((p) => p.id),
        saldoAPagar,
        clienteAtual.nome
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8E2D9] overflow-hidden my-auto print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* CABEÇALHO DO MODAL (OCULTO NA IMPRESSÃO) */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E8E2D9] flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#6E473B] text-[#FAF7F2]">
              <Receipt className="w-5 h-5 text-[#E6C285]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#4A3026]">
                Relatório de Faturamento & Cobrança Quinzenal
              </h2>
              <p className="text-xs text-neutral-500">
                Extrato consolidado de pedidos para envio no dia 15 e último dia do mês
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA DE FILTROS: CLIENTE + QUINZENA + MÊS (OCULTO NA IMPRESSÃO) */}
        <div className="p-4 bg-[#F5EFE6] border-b border-[#E8E2D9] space-y-3 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* SELEÇÃO DO CLIENTE */}
            <div>
              <label className="block text-xs font-bold text-[#6E473B] mb-1">
                Cliente para Faturamento:
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D9D0C3] bg-white text-xs font-bold text-[#4A3026] focus:outline-none focus:ring-2 focus:ring-[#6E473B]"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.tabelaPreco === 'parque' ? '🎡 (Tabela Parque)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* SELEÇÃO DA QUINZENA / PERÍODO */}
            <div>
              <label className="block text-xs font-bold text-[#6E473B] mb-1">
                Período de Fechamento:
              </label>
              <div className="grid grid-cols-2 gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#D9D0C3]">
                <button
                  type="button"
                  onClick={() => setTipoPeriodo('q1')}
                  className={`py-1.5 text-[11px] font-extrabold rounded-lg transition-all ${
                    tipoPeriodo === 'q1'
                      ? 'bg-[#6E473B] text-white shadow-xs'
                      : 'text-[#6E473B] hover:bg-white/60'
                  }`}
                >
                  1ª Quinzena (Dia 1-15)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPeriodo('q2')}
                  className={`py-1.5 text-[11px] font-extrabold rounded-lg transition-all ${
                    tipoPeriodo === 'q2'
                      ? 'bg-[#6E473B] text-white shadow-xs'
                      : 'text-[#6E473B] hover:bg-white/60'
                  }`}
                >
                  2ª Quinzena (Dia 16-Fim)
                </button>
              </div>
            </div>

            {/* SELEÇÃO DO MÊS E ANO */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Mês:
                </label>
                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#D9D0C3] bg-white text-xs font-bold text-[#4A3026]"
                >
                  {mesesNomes.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Ano:
                </label>
                <select
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-xl border border-[#D9D0C3] bg-white text-xs font-bold text-[#4A3026]"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

          </div>

          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#6E473B]">Exibição:</span>
              <button
                onClick={() => setTipoPeriodo('mes')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  tipoPeriodo === 'mes' ? 'bg-[#6E473B] text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Mês Todo
              </button>
              <button
                onClick={() => setTipoPeriodo('todos')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  tipoPeriodo === 'todos' ? 'bg-[#6E473B] text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Histórico Geral
              </button>
            </div>

            {clienteAtual?.tabelaPreco === 'parque' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                🎡 Conta Especial: Toca do Urso (Faturamento Quinzenal s/ Sinal)
              </span>
            )}
          </div>
        </div>

        {/* ÁREA DE IMPRESSÃO / CORPO DO RELATÓRIO TIMBRADO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#FAF7F2] print:p-0 print:overflow-visible" ref={printAreaRef}>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E8E2D9] print:shadow-none print:border-none print:p-0">
            
            {/* CABEÇALHO TIMBRADO DA SABORES DA CASA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#6E473B]">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src={LOGO_DARK_BASE64 || '/logo-dark.png'}
                    alt={config.nome}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#6E473B] tracking-tight">
                    {config.nome}
                  </h1>
                  <p className="text-xs text-neutral-600 font-medium">
                    Doces & Salgados Artesanais para Festas e Eventos
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {config.cidade} • WhatsApp: {config.telefone}
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="inline-block text-[11px] font-extrabold px-3 py-1 rounded-md bg-[#6E473B] text-white uppercase tracking-wider mb-1">
                  Extrato de Cobrança Quinzenal
                </span>
                <p className="text-xs font-bold text-neutral-800">
                  Período: {rotuloPeriodo}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* DADOS DO CLIENTE / PARCEIRO */}
            <div className="my-5 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#8E6554] block">
                  Cliente / Razão Social:
                </span>
                <p className="text-sm font-extrabold text-[#2C2420]">
                  {clienteAtual?.nome}
                </p>
                <p className="text-neutral-600">
                  {clienteAtual?.endereco}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase text-[#8E6554] block">
                  Contato / Condição de Pagamento:
                </span>
                <p className="font-bold text-[#2C2420]">
                  {clienteAtual?.telefone}
                </p>
                <p className="text-amber-900 font-extrabold">
                  {clienteAtual?.tipoCobranca === 'quinzenal' || clienteAtual?.nome.toLowerCase().includes('urso')
                    ? 'Convênio Faturamento Quinzenal (Sem Sinal)'
                    : 'Faturamento Padrão'}
                </p>
              </div>
            </div>

            {/* CARDS COM O RESUMO TOTALIZADOR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              <div className="bg-[#F8F5F0] p-3 rounded-xl border border-[#E8E2D9] text-center">
                <span className="text-[10px] font-bold text-neutral-500 block uppercase">
                  Remessas Entregues
                </span>
                <p className="text-xl font-extrabold text-[#6E473B]">
                  {pedidosDoPeriodo.length}
                </p>
                <span className="text-[10px] text-neutral-500">pedidos</span>
              </div>

              <div className="bg-[#F8F5F0] p-3 rounded-xl border border-[#E8E2D9] text-center">
                <span className="text-[10px] font-bold text-neutral-500 block uppercase">
                  Itens Fornecidos
                </span>
                <p className="text-xl font-extrabold text-[#6E473B]">
                  {totalUnidades}
                </p>
                <span className="text-[10px] text-neutral-500">unidades totais</span>
              </div>

              <div className="bg-[#F8F5F0] p-3 rounded-xl border border-[#E8E2D9] text-center">
                <span className="text-[10px] font-bold text-neutral-500 block uppercase">
                  Total Faturado
                </span>
                <p className="text-xl font-extrabold text-neutral-800">
                  R$ {totalFaturado.toFixed(2)}
                </p>
                <span className="text-[10px] text-neutral-500">valor bruto</span>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">
                  Saldo a Pagar
                </span>
                <p className="text-xl font-black text-emerald-800">
                  R$ {saldoAPagar.toFixed(2)}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">a liquidar</span>
              </div>
            </div>

            {/* TABELA DE PEDIDOS DETALHADOS NO PERÍODO */}
            <div className="mb-6">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6E473B] mb-2 flex items-center justify-between">
                <span>Discriminação das Entregas do Período</span>
                <span className="text-[11px] font-normal text-neutral-500">
                  {pedidosDoPeriodo.length} pedidos
                </span>
              </h3>

              {pedidosDoPeriodo.length === 0 ? (
                <div className="text-center py-8 bg-[#FAF7F2] rounded-xl border border-dashed border-[#D9D0C3] text-neutral-500 text-xs">
                  Nenhum pedido entregue ou agendado para este cliente no período selecionado.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#E8E2D9] rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F2EDE4] text-[#6E473B] font-extrabold border-b border-[#E8E2D9]">
                      <tr>
                        <th className="py-2.5 px-3">Data / Hora</th>
                        <th className="py-2.5 px-3">Pedido</th>
                        <th className="py-2.5 px-3">Produtos Entregues</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {pedidosDoPeriodo.map((p) => {
                        const d = new Date(p.dataHoraEntrega);
                        const dataFmt = d.toLocaleDateString('pt-BR');
                        const horaFmt = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                            <td className="py-2 px-3 whitespace-nowrap font-medium text-neutral-700">
                              <span className="font-bold text-[#6E473B]">{dataFmt}</span> às {horaFmt}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap font-extrabold text-[#4A3026]">
                              #{p.numeroPedido}
                            </td>
                            <td className="py-2 px-3 text-neutral-700">
                              <div className="space-y-0.5">
                                {p.itens.map((item) => (
                                  <div key={item.id} className="flex items-center gap-1 text-[11px]">
                                    <strong className="text-[#6E473B]">{item.quantidade}x</strong>
                                    <span>{item.nomeProduto}</span>
                                    <span className="text-neutral-400">
                                      (R$ {item.precoUnitario.toFixed(2)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap text-right font-extrabold text-neutral-900">
                              R$ {p.valorTotal.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.statusPagamento === 'quitado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {p.statusPagamento === 'quitado' ? '✓ Quitado' : 'A faturar'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#F8F5F0] font-black text-xs border-t-2 border-[#6E473B]">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right text-[#6E473B]">
                          VALOR TOTAL CONSOLIDADO:
                        </td>
                        <td className="py-3 px-3 text-right text-base text-[#6E473B]">
                          R$ {totalFaturado.toFixed(2)}
                        </td>
                        <td className="py-3 px-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* RESUMO DOS PRODUTOS AGREGADOS (QUANTIDADES TOTAIS DO PERÍODO) */}
            {produtosConsolidados.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8E6554] mb-2">
                  Totais por Produto no Período (Volume de Produção)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {produtosConsolidados.map((prod) => (
                    <div key={prod.nome} className="flex justify-between items-center p-1.5 bg-white rounded-lg border border-[#E8E2D9]">
                      <span className="font-medium text-neutral-800 truncate mr-2" title={prod.nome}>
                        {prod.nome}
                      </span>
                      <strong className="text-[#6E473B] shrink-0">
                        {prod.quantidade} un.
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DADOS BANCÁRIOS / PIX PARA O CONTAS A PAGAR */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="font-extrabold block text-amber-900 mb-0.5">
                  Dados para Pagamento / Transferência Pix:
                </span>
                <p>
                  Chave Pix: <strong className="font-mono text-sm">{config.chavePix || '19981240173'}</strong>
                </p>
                <p className="text-[11px] text-amber-900/80">
                  Favorecido: {config.titularPix || config.nome} • {config.cidade}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-amber-200 sm:pl-4">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Valor a Transferir:
                </span>
                <span className="text-lg font-black text-amber-950">
                  R$ {saldoAPagar.toFixed(2)}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* RODAPÉ DE AÇÕES (OCULTO NA IMPRESSÃO) */}
        <div className="p-4 bg-white border-t border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            {saldoAPagar > 0 && onQuitarPedidosPeriodo && (
              <button
                onClick={handleQuitarTudo}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                title="Marcar todos os pedidos desta quinzena como quitados"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Dar Baixa Quitado (R$ {saldoAPagar.toFixed(2)})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* WHATSAPP */}
            <button
              onClick={handleEnviarWhatsApp}
              disabled={pedidosDoPeriodo.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Enviar cobrança detalhada no WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>

            {/* BAIXAR PDF */}
            <button
              onClick={handleBaixarPdf}
              disabled={gerandoPdf || pedidosDoPeriodo.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Baixar arquivo PDF timbrado"
            >
              <Download className="w-4 h-4" />
              <span>{gerandoPdf ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            {/* IMPRIMIR */}
            <button
              onClick={handleImprimir}
              className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
              title="Imprimir relatório"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* FECHAR */}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
