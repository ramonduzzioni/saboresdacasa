'use client';

import React, { useRef, useState } from 'react';
import { Pedido, ConfiguracaoLoja } from '@/types';
import { LOGO_DARK_BASE64 } from '@/lib/logoBase64';
import { X, Download, Share2, Printer, Phone, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderPdfModalProps {
  pedido: Pedido | null;
  config: ConfiguracaoLoja;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderPdfModal({ pedido, config, isOpen, onClose }: OrderPdfModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [gerando, setGerando] = useState(false);

  if (!isOpen || !pedido) return null;

  const dataFormatada = new Date(pedido.dataHoraEntrega).toLocaleDateString('pt-BR');
  const horaFormatada = new Date(pedido.dataHoraEntrega).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Função nativa de impressão direta e "Salvar como PDF" (100% confiável, vetorizada e nítida)
  const handleImprimir = () => {
    window.print();
  };

  // Download direto do arquivo .PDF via html2canvas + jsPDF
  const handleBaixarPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setGerando(true);
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
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
      pdf.save(`Pedido-${pedido.numeroPedido}-${pedido.clienteNome.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.warn('html2canvas encontrou restrição no ambiente do navegador, acionando impressão nativa:', err);
      // Fallback transparente: abre o diálogo nativo onde o usuário salva como PDF em 1 clique
      window.print();
    } finally {
      setGerando(false);
    }
  };

  const handleCompartilharWhatsApp = () => {
    const limpo = pedido.clienteTelefone.replace(/\D/g, '');
    const texto = encodeURIComponent(
      `Olá ${pedido.clienteNome}! Segue o detalhamento do seu *Pedido #${pedido.numeroPedido}* na *${config.nome}*:\n\n` +
      `📅 *Data de Entrega/Retirada:* ${dataFormatada} às ${horaFormatada}\n` +
      `📍 *Local:* ${pedido.tipoEntrega === 'entrega' ? pedido.clienteEndereco : 'Retirada no balcão'}\n\n` +
      `*Itens:*\n` +
      pedido.itens.map((i) => `• ${i.quantidade}x ${i.nomeProduto} — R$ ${i.subtotal.toFixed(2)}`).join('\n') +
      `\n\n💰 *Total:* R$ ${pedido.valorTotal.toFixed(2)}\n` +
      `💳 *Sinal (50%):* R$ ${pedido.valorSinal.toFixed(2)} (${pedido.statusPagamento === 'quitado' ? 'Quitado' : 'Aguardando/Confirmado'})\n` +
      `💵 *Saldo restante:* R$ ${pedido.valorRestante.toFixed(2)}\n\n` +
      `*Chave Pix para pagamento:* ${config.chavePix} (${config.titularPix})\n\n` +
      `Qualquer dúvida estamos à disposição!`
    );
    window.open(`https://wa.me/55${limpo}?text=${texto}`, '_blank');
  };

  const logoSrc = config.logoUrl && !config.logoUrl.includes('logo-dark.png')
    ? config.logoUrl
    : LOGO_DARK_BASE64;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200 print-dialog-overlay">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden print-dialog-card">
        
        {/* Barra de Ações Superior do Modal (Oculta na impressão) */}
        <div className="bg-[#4A3026] text-[#FAF7F2] p-3 sm:px-6 flex items-center justify-between shrink-0 print-dialog-header no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base">Orçamento & Pedido #{pedido.numeroPedido}</span>
            <span className="text-xs bg-[#FAF7F2]/20 px-2 py-0.5 rounded text-[#E6C285]">
              Layout Fiel Studio
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Imprimir / Salvar PDF Nativo */}
            <button
              onClick={handleImprimir}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#4A3026] text-xs font-bold transition-all shadow-xs"
              title="Abre a janela de impressão ou salvar em PDF nativo"
            >
              <Printer className="w-4 h-4 text-[#6E473B]" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            {/* Botão Baixar .PDF */}
            <button
              onClick={handleBaixarPdf}
              disabled={gerando}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E6C285] hover:bg-[#d8b06e] text-[#4A3026] text-xs font-bold transition-all shadow-xs"
              title="Baixar arquivo PDF direto no aparelho"
            >
              <Download className="w-4 h-4" />
              <span>{gerando ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            {/* Botão Compartilhar WhatsApp */}
            <button
              onClick={handleCompartilharWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors ml-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ÁREA DE RENDERIZAÇÃO DO PDF — DESIGN FIEL À REFERÊNCIA DO CLIENTE */}
        <div className="overflow-y-auto p-2 sm:p-6 bg-neutral-200 flex justify-center print-scroll-container">
          <div
            id="printable-receipt"
            ref={printAreaRef}
            className="w-full max-w-[650px] bg-[#FAF7F2] text-[#2C2420] shadow-xl relative overflow-hidden flex flex-col justify-between"
            style={{
              minHeight: '880px',
              backgroundColor: '#FAF7F2',
              fontFamily: '"Georgia", serif, sans-serif',
            }}
          >
            <div className="p-8 sm:p-10 flex-1">
              
              {/* CABEÇALHO COM LOGO */}
              <div className="text-center mb-6">
                <div className="flex flex-col items-center">
                  <img
                    src={logoSrc}
                    alt={config.nome}
                    className="h-20 sm:h-24 mx-auto mb-1.5 object-contain"
                  />
                  <p className="text-xs text-[#8E6554] tracking-widest uppercase font-sans font-medium">
                    {config.subtitulo}
                  </p>
                </div>
              </div>

              {/* FAIXA MARROM ESCURA COM DATA E NÚMERO DO PEDIDO */}
              <div
                className="text-[#FAF7F2] px-4 py-1.5 text-xs tracking-wider font-sans font-semibold mb-8 flex justify-between items-center rounded-xs"
                style={{ backgroundColor: '#6E473B' }}
              >
                <span>Data: {dataFormatada}</span>
                <span>Pedido #{String(pedido.numeroPedido).padStart(5, '0')}</span>
              </div>

              {/* BLOCO DESTINATÁRIO (A/C) ALINHADO À DIREITA */}
              <div className="flex justify-end mb-8 font-sans">
                <div className="text-right max-w-xs">
                  <span className="text-xs font-semibold text-[#8E6554] block mb-1 uppercase tracking-wider">
                    A/C:
                  </span>
                  <h3 className="font-bold text-base text-[#2C2420]">{pedido.clienteNome}</h3>
                  <p className="text-xs text-[#57372D] mt-0.5">{pedido.clienteTelefone}</p>
                  <p className="text-xs text-[#57372D] leading-snug mt-0.5">
                    {pedido.tipoEntrega === 'entrega' ? pedido.clienteEndereco : 'Retirada no Balcão'}
                  </p>
                  <p className="text-xs font-medium text-[#C68A4C] mt-1">
                    Horário previsto: {horaFormatada}
                  </p>
                </div>
              </div>

              {/* TABELA DE PRODUTOS / SERVIÇOS */}
              <div className="mb-6 font-sans">
                <table className="w-full border-collapse" style={{ border: '1px solid #BFA495' }}>
                  <thead>
                    <tr
                      className="text-[#6E473B] text-xs font-bold uppercase tracking-wider"
                      style={{ borderBottom: '1px solid #BFA495' }}
                    >
                      <th className="py-2.5 px-3 text-left w-2/5" style={{ borderRight: '1px solid #BFA495' }}>
                        PRODUTO / ITEM
                      </th>
                      <th className="py-2.5 px-3 text-left w-2/5" style={{ borderRight: '1px solid #BFA495' }}>
                        DESCRIÇÃO & OBS
                      </th>
                      <th className="py-2.5 px-3 text-right w-1/5">VALOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.itens.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="text-xs"
                        style={{
                          borderBottom: '1px solid #D8CABE',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : '#F2EDE4',
                        }}
                      >
                        <td className="py-3 px-3 align-top font-semibold text-[#2C2420]" style={{ borderRight: '1px solid #D8CABE' }}>
                          {item.quantidade}x {item.nomeProduto}
                          <span className="block text-[10px] text-[#8E6554] font-normal">
                            R$ {item.precoUnitario.toFixed(2)} / {item.tipoUnidade}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top text-[#57372D] leading-relaxed" style={{ borderRight: '1px solid #D8CABE' }}>
                          {item.observacao || 'Produção artesanal com ingredientes nobres selecionados.'}
                        </td>
                        <td className="py-3 px-3 align-top text-right font-bold text-[#6E473B] whitespace-nowrap">
                          R$ {item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* BLOCO SÓLIDO MARROM DO TOTAL */}
              <div className="flex justify-end mb-8 font-sans">
                <div
                  className="text-white px-6 py-2 rounded-xs shadow-xs text-right min-w-[240px]"
                  style={{ backgroundColor: '#6E473B' }}
                >
                  <span className="text-xs uppercase tracking-wider text-[#FAF7F2]/80 mr-2 font-medium">TOTAL:</span>
                  <span className="text-lg font-extrabold tracking-tight">
                    R$ {pedido.valorTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* SEÇÃO FORMA DE PAGAMENTO & CONDIÇÕES */}
              <div className="flex flex-col items-end text-right font-sans mb-8">
                <div className="w-16 h-0.5 bg-[#8E6554] mb-3"></div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold text-[#6E473B] uppercase tracking-wider mb-1">
                    FORMA DE PAGAMENTO
                  </h4>
                  <p className="text-xs text-[#57372D]">
                    Sinal de 50% (<strong>R$ {pedido.valorSinal.toFixed(2)}</strong>) via Pix
                  </p>
                  <p className="text-xs text-[#57372D]">
                    Chave Pix: <strong>{config.chavePix}</strong> ({config.titularPix})
                  </p>
                  <p className="text-xs text-[#8E6554] mt-0.5">
                    Saldo restante (<strong>R$ {pedido.valorRestante.toFixed(2)}</strong>) no ato da entrega/retirada.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#6E473B] uppercase tracking-wider mb-1">
                    TERMOS E CONDIÇÕES
                  </h4>
                  <p className="text-xs text-[#57372D] max-w-sm">
                    {pedido.observacoes || config.termoCondicoesPadrao}
                  </p>
                </div>
              </div>

            </div>

            {/* BARRA MARROM ESCURA NO RODAPÉ */}
            <div
              className="text-[#FAF7F2] py-2.5 px-6 font-sans text-[11px] flex flex-wrap items-center justify-between gap-3"
              style={{ backgroundColor: '#6E473B' }}
            >
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#E6C285]" />
                <span>{config.telefone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#E6C285]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                <span>{config.instagram}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E6C285]" />
                <span>{config.cidade}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
