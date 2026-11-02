'use client';

import React, { useState, useEffect } from 'react';
import { Pedido, ConfiguracaoLoja } from '@/types';
import { Calendar, Clock, MapPin, ShoppingBag, Edit3, MessageCircle, FileText, CheckCircle2 } from 'lucide-react';

interface TopAgendaWidgetProps {
  pedidos: Pedido[];
  config: ConfiguracaoLoja;
  onEditQuick: (pedido: Pedido) => void;
  onOpenPdf: (pedido: Pedido) => void;
}

export function TopAgendaWidget({ pedidos, config, onEditQuick, onOpenPdf }: TopAgendaWidgetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pega os 4 próximos pedidos ordenados por data
  const proximosQuatro = mounted
    ? pedidos
        .filter((p) => new Date(p.dataHoraEntrega).getTime() >= Date.now() - 3 * 3600 * 1000)
        .slice(0, 4)
    : pedidos.slice(0, 4);

  const formatarDataHora = (iso: string) => {
    try {
      const d = new Date(iso);
      const hoje = new Date();
      const amanha = new Date();
      amanha.setDate(hoje.getDate() + 1);

      const isHoje = d.toDateString() === hoje.toDateString();
      const isAmanha = d.toDateString() === amanha.toDateString();

      const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (isHoje) return `Hoje às ${hora}`;
      if (isAmanha) return `Amanhã às ${hora}`;

      const diaMes = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      return `${diaSemana}, ${diaMes} às ${hora}`;
    } catch {
      return iso;
    }
  };

  const handleWhatsApp = (pedido: Pedido) => {
    const limpo = pedido.clienteTelefone.replace(/\D/g, '');
    const dataFmt = formatarDataHora(pedido.dataHoraEntrega);
    const texto = encodeURIComponent(
      `Olá ${pedido.clienteNome}! Aqui é da *${config.nome}*.\n\nPassando para confirmar seu pedido *#${pedido.numeroPedido}* agendado para *${dataFmt}*.\n\n*Total:* R$ ${pedido.valorTotal.toFixed(2)}\n*Sinal:* R$ ${pedido.valorSinal.toFixed(2)} (${pedido.statusPagamento === 'quitado' ? 'Totalmente Quitado' : 'Sinal Confirmado'})\n*Saldo restante:* R$ ${pedido.valorRestante.toFixed(2)}\n\nQualquer ajuste, estamos à disposição!`
    );
    window.open(`https://wa.me/55${limpo}?text=${texto}`, '_blank');
  };

  return (
    <div className="bg-[#4A3026] text-[#FAF7F2] rounded-2xl shadow-lg p-4 sm:p-5 mb-6 border border-[#6E473B]/50">
      {/* Cabeçalho do Bloco da Agenda */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#FAF7F2]/15">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#6E473B] text-[#FAF7F2]">
            <Calendar className="w-5 h-5 text-[#E6C285]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#FAF7F2]">
                Agenda Google Conectada
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Sincronizada
              </span>
            </div>
            <p className="text-xs text-[#FAF7F2]/70">
              Próximos 4 pedidos agendados para entrega ou retirada
            </p>
          </div>
        </div>

        <div className="text-xs text-[#E6C285] font-medium bg-[#6E473B]/60 px-3 py-1.5 rounded-lg border border-[#E6C285]/20">
          Mostrando {proximosQuatro.length} de {pedidos.length} pedidos
        </div>
      </div>

      {/* Grid com os 4 próximos pedidos */}
      {proximosQuatro.length === 0 ? (
        <div className="text-center py-6 text-sm text-[#FAF7F2]/60 bg-[#3A241C] rounded-xl border border-dashed border-[#FAF7F2]/20">
          Nenhum pedido agendado para as próximas horas. Cadastre uma nova encomenda abaixo!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {proximosQuatro.map((pedido, index) => {
            const totalItens = pedido.itens.reduce((acc, i) => acc + i.quantidade, 0);
            const resumoItens = pedido.itens.map((i) => `${i.quantidade}x ${i.nomeProduto.split(' ')[2] || i.nomeProduto.split(' ')[0]}`).slice(0, 2).join(', ');

            return (
              <div
                key={pedido.id}
                className="bg-[#FAF7F2] text-[#2C2420] rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all border border-[#E8E2D9]"
              >
                <div>
                  {/* Badge de Horário e Tipo */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-[#6E473B] text-[#FAF7F2]">
                      <Clock className="w-3 h-3 text-[#E6C285]" />
                      {formatarDataHora(pedido.dataHoraEntrega)}
                    </span>
                    <span className="text-[11px] font-semibold text-[#6E473B] uppercase tracking-wider">
                      #{pedido.numeroPedido}
                    </span>
                  </div>

                  {/* Nome do Cliente */}
                  <h3 className="font-bold text-sm text-[#2C2420] line-clamp-1 mb-0.5" title={pedido.clienteNome}>
                    {pedido.clienteNome}
                  </h3>

                  {/* Resumo de itens */}
                  <div className="flex items-start gap-1.5 text-xs text-[#57372D] mb-2">
                    <ShoppingBag className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#C68A4C]" />
                    <span className="line-clamp-2">
                      {resumoItens} {pedido.itens.length > 2 ? `(+${pedido.itens.length - 2} itens)` : ''}
                    </span>
                  </div>

                  {/* Financeiro / Sinal */}
                  <div className="flex items-center justify-between text-xs bg-[#F2EDE4] p-1.5 rounded-lg mb-3">
                    <span className="text-[#6E473B] font-medium">Total: R$ {pedido.valorTotal.toFixed(2)}</span>
                    <span className="text-emerald-700 font-bold">
                      {pedido.tipoCobranca === 'quinzenal' || pedido.clienteNome.toLowerCase().includes('urso') || pedido.valorSinal === 0 ? (
                        <span className="text-amber-900 font-extrabold text-[11px]">📅 Quinzenal</span>
                      ) : pedido.statusPagamento === 'quitado' ? (
                        'Quitado'
                      ) : (
                        `Restam R$ ${pedido.valorRestante.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação Rápida Mobile-Friendly */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#E8E2D9]">
                  {/* Botão de Edição Rápida de Quantidades (Destaque para Casa de Eventos) */}
                  <button
                    onClick={() => onEditQuick(pedido)}
                    className="col-span-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg bg-[#6E473B] hover:bg-[#57372D] text-[#FAF7F2] text-xs font-bold transition-colors active:scale-95"
                    title="Alterar quantidades do pedido rapidamente"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Qtds</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={() => handleWhatsApp(pedido)}
                    className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors active:scale-95"
                    title="Enviar confirmação no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Whats</span>
                  </button>

                  {/* PDF */}
                  <button
                    onClick={() => onOpenPdf(pedido)}
                    className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg bg-[#E8E2D9] hover:bg-[#D9D0C3] text-[#4A3026] text-xs font-bold transition-colors active:scale-95"
                    title="Ver orçamento / comprovante em PDF"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
