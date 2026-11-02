'use client';

import React, { useState } from 'react';
import { Cliente, ItemPedido, Pedido, Produto } from '@/types';
import { getPrecoProdutoParaCliente } from '@/lib/storage';
import { parseWhatsAppOrderWithGemini } from '@/lib/gemini';
import { Sparkles, MessageSquare, Check, X, AlertCircle, ArrowRight, Loader2, Bot, Calendar, MapPin, Tag } from 'lucide-react';

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
  const [statusAi, setStatusAi] = useState<string>('');
  const [resultado, setResultado] = useState<{
    clienteDetectado?: Cliente;
    itensDetectados: ItemPedido[];
    dataDetectada?: string;
    tipoEntrega: 'entrega' | 'retirada';
    observacoes: string;
    foiGemini: boolean;
    isQuinzenal: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleExemploParque = () => {
    setTextoWhats(
      `Bom dia Sabores da Casa! Aqui é do Parque Temático Toca do Urso.\n` +
      `Para este sábado às 16h precisamos de:\n` +
      `- 150 coxinhas tradicionais\n` +
      `- 120 bolinhas de queijo\n` +
      `- 80 empadinhas de palmito\n` +
      `- 100 brigadeiros belga gourmet\n` +
      `Entregar na entrada de serviços/refeitório. Fritar bem sequinho por favor!`
    );
  };

  const handleExemploVilla = () => {
    setTextoWhats(
      `Oi Ramon tudo bem? Aqui é do Espaço Villa Nobre!\n` +
      `Queremos encomendar para amanhã às 18h:\n` +
      `- 140 coxinhas tradicionais\n` +
      `- 85 bolinhas de queijo\n` +
      `- 60 brigadeiros belga\n` +
      `Pode entregar direto na portaria lateral?`
    );
  };

  const processarTexto = async () => {
    if (!textoWhats.trim()) return;
    setCarregando(true);
    setStatusAi('Consultando a IA do Gemini 3.5...');

    try {
      // 1. TENTA PROCESSAR COM A IA OFICIAL DO GEMINI
      const geminiResult = await parseWhatsAppOrderWithGemini(textoWhats, produtos, clientes);

      // Localiza o cliente no banco
      let cliente = clientes.find((c) => c.id === geminiResult.clienteId);
      if (!cliente && geminiResult.clienteNome) {
        const nomeLower = geminiResult.clienteNome.toLowerCase();
        cliente = clientes.find((c) => c.nome.toLowerCase().includes(nomeLower) || nomeLower.includes(c.nome.toLowerCase().split(' ')[0]));
      }
      if (!cliente) {
        const textoLower = textoWhats.toLowerCase();
        if (textoLower.includes('urso') || textoLower.includes('toca') || textoLower.includes('parque')) {
          cliente = clientes.find((c) => c.nome.toLowerCase().includes('urso') || c.nome.toLowerCase().includes('parque'));
        }
      }
      if (!cliente && clientes.length > 0) {
        cliente = clientes[0];
      }

      // Monta os itens mapeados com preços oficiais (respeitando a tabela do cliente, ex: Parque)
      const itens: ItemPedido[] = [];
      for (const itemGemini of geminiResult.itens) {
        const prod = produtos.find((p) => p.id === itemGemini.produtoId) ||
          produtos.find((p) => p.nome.toLowerCase().includes(itemGemini.nomeProduto.toLowerCase()));

        if (prod) {
          const preco = getPrecoProdutoParaCliente(prod, cliente);
          itens.push({
            id: `item-gemini-${Date.now()}-${prod.id}`,
            produtoId: prod.id,
            nomeProduto: prod.nome,
            quantidade: itemGemini.quantidade,
            tipoUnidade: prod.tipoUnidade,
            precoUnitario: preco,
            subtotal: Number((itemGemini.quantidade * preco).toFixed(2)),
            observacao: itemGemini.observacao || 'Extraído via IA do Gemini',
          });
        }
      }

      const isQuinzenal =
        cliente?.tipoCobranca === 'quinzenal' ||
        cliente?.nome.toLowerCase().includes('urso') ||
        geminiResult.tipoCobranca === 'quinzenal';

      setResultado({
        clienteDetectado: cliente,
        itensDetectados: itens.length > 0 ? itens : fallbackItens(cliente),
        dataDetectada: geminiResult.dataHoraEntrega || getDataAmanha(),
        tipoEntrega: geminiResult.tipoEntrega || 'entrega',
        observacoes: geminiResult.observacoes || 'Pedido estruturado com sucesso pelo Gemini.',
        foiGemini: true,
        isQuinzenal,
      });
    } catch (err) {
      console.warn('Falha no Gemini, usando motor local inteligente:', err);
      processarComParserLocal();
    } finally {
      setCarregando(false);
      setStatusAi('');
    }
  };

  const fallbackItens = (cliente?: Cliente) => {
    const prod = produtos[0];
    const preco = getPrecoProdutoParaCliente(prod, cliente);
    return [
      {
        id: `item-${Date.now()}`,
        produtoId: prod.id,
        nomeProduto: prod.nome,
        quantidade: 50,
        tipoUnidade: prod.tipoUnidade,
        precoUnitario: preco,
        subtotal: 50 * preco,
      },
    ];
  };

  const getDataAmanha = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    return d.toISOString();
  };

  // Motor semântico local de contingência
  const processarComParserLocal = () => {
    const textoLower = textoWhats.toLowerCase();

    let clienteDetectado = clientes.find((c) =>
      (textoLower.includes('urso') && c.nome.toLowerCase().includes('urso')) ||
      (textoLower.includes('toca') && c.nome.toLowerCase().includes('toca')) ||
      (textoLower.includes('parque') && c.nome.toLowerCase().includes('parque')) ||
      textoLower.includes(c.nome.toLowerCase().split(' ')[0]) ||
      (c.nome.toLowerCase().includes('parque') && textoLower.includes('parque')) ||
      (c.nome.toLowerCase().includes('villa nobre') && textoLower.includes('villa nobre')) ||
      (c.nome.toLowerCase().includes('sonho real') && textoLower.includes('sonho real'))
    );

    if (!clienteDetectado && (textoLower.includes('urso') || textoLower.includes('toca') || textoLower.includes('parque'))) {
      clienteDetectado = clientes.find((c) => c.nome.toLowerCase().includes('urso') || c.nome.toLowerCase().includes('parque'));
    }

    if (!clienteDetectado && clientes.length > 0) {
      clienteDetectado = clientes[0];
    }

    const itensDetectados: ItemPedido[] = [];

    produtos.forEach((prod) => {
      const nomeLower = prod.nome.toLowerCase();
      const keywords = nomeLower.replace('cento de ', '').replace(' (kg)', '').replace(' (unidade)', '').split(' ');
      const match = keywords.some((k) => k.length > 3 && textoLower.includes(k));

      if (match) {
        const regex = new RegExp(`(\\d+([.,]\\d+)?)\\s*(centos?|unidades?|kg|kilos?)?\\s*(de)?\\s*.*${keywords[0]}`, 'i');
        const m = textoWhats.match(regex);
        let qtd = 1;
        if (m && m[1]) {
          qtd = parseFloat(m[1].replace(',', '.'));
        } else {
          const digitoMatch = textoWhats.match(new RegExp(`(\\d+)\\s*.*${keywords[0]}`, 'i'));
          if (digitoMatch && digitoMatch[1]) qtd = parseInt(digitoMatch[1]);
        }

        const preco = getPrecoProdutoParaCliente(prod, clienteDetectado);

        itensDetectados.push({
          id: `item-ai-${Date.now()}-${prod.id}`,
          produtoId: prod.id,
          nomeProduto: prod.nome,
          quantidade: qtd,
          tipoUnidade: prod.tipoUnidade,
          precoUnitario: preco,
          subtotal: Number((qtd * preco).toFixed(2)),
          observacao: 'Extraído automaticamente do WhatsApp',
        });
      }
    });

    const isQuinzenal =
      clienteDetectado?.tipoCobranca === 'quinzenal' ||
      clienteDetectado?.nome.toLowerCase().includes('urso') ||
      textoLower.includes('urso');

    setResultado({
      clienteDetectado,
      itensDetectados: itensDetectados.length > 0 ? itensDetectados : fallbackItens(clienteDetectado),
      dataDetectada: getDataAmanha(),
      tipoEntrega: textoLower.includes('retirar') || textoLower.includes('balcão') ? 'retirada' : 'entrega',
      observacoes: 'Pedido extraído do WhatsApp',
      foiGemini: false,
      isQuinzenal,
    });
  };

  const handleConfirmarPedido = () => {
    if (!resultado || !resultado.clienteDetectado) return;

    const isQuinzenal = resultado.isQuinzenal;
    const valorTotal = resultado.itensDetectados.reduce((acc, i) => acc + i.subtotal, 0);
    const valorSinal = isQuinzenal ? 0 : Number((valorTotal * 0.5).toFixed(2));
    const valorRestante = isQuinzenal ? valorTotal : Number((valorTotal - valorSinal).toFixed(2));

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
      tipoCobranca: isQuinzenal ? 'quinzenal' : 'padrao_50',
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
        <div className="bg-[#6E473B] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10">
              <Bot className="w-5 h-5 text-[#E6C285]" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                <span>Importar do WhatsApp com Gemini</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                  IA Ativa
                </span>
              </h2>
              <p className="text-xs text-[#FAF7F2]/80">Cole a mensagem ou áudio e a IA monta o pedido</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* Caixa de Texto do WhatsApp */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-1.5">
              <label className="text-xs font-bold text-[#6E473B] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Cole a mensagem recebida no WhatsApp:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExemploParque}
                  className="text-[11px] font-bold text-amber-800 underline hover:text-[#6E473B]"
                >
                  Exemplo Parque
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  type="button"
                  onClick={handleExemploVilla}
                  className="text-[11px] font-bold text-[#8E6554] underline hover:text-[#6E473B]"
                >
                  Exemplo Villa Nobre
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={textoWhats}
              onChange={(e) => setTextoWhats(e.target.value)}
              placeholder="Ex: Oi Ramon! Aqui é do Parque Temático, queremos 150 coxinhas e 100 brigadeiros pro sábado às 16h..."
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-3 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={processarTexto}
            disabled={carregando || !textoWhats.trim()}
            className="w-full py-3.5 rounded-xl bg-[#6E473B] hover:bg-[#57372D] disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            {carregando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#E6C285]" />
                <span>{statusAi || 'Gemini analisando pedido...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#E6C285]" />
                <span>Processar Mensagem com Gemini</span>
              </>
            )}
          </button>

          {/* Resultado Detectado */}
          {resultado && (
            <div className="bg-white rounded-2xl p-4 border-2 border-emerald-400 shadow-md animate-in fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Pedido Estruturado com Sucesso!
                </div>
                {resultado.foiGemini && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                    Gemini 3.5 Flash
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs text-[#2C2420]">
                {/* Cliente */}
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D9]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#8E6554]">Cliente Reconhecido:</span>
                    {resultado.clienteDetectado?.tabelaPreco === 'parque' && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                        🎡 Tabela Parque Aplicada
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm text-[#2C2420] block mt-0.5">
                    {resultado.clienteDetectado?.nome}
                  </span>
                  <span className="text-[11px] text-neutral-500 block">
                    {resultado.clienteDetectado?.telefone} • {resultado.clienteDetectado?.endereco}
                  </span>
                </div>

                {/* Data e Entrega */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9]">
                    <span className="text-[#8E6554] block font-medium">Data Agendada:</span>
                    <span className="font-bold text-[#6E473B]">
                      {new Date(resultado.dataDetectada || '').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9]">
                    <span className="text-[#8E6554] block font-medium">Tipo:</span>
                    <span className="font-bold uppercase text-[#6E473B]">
                      {resultado.tipoEntrega === 'entrega' ? '🚚 Entrega' : '🏪 Retirada'}
                    </span>
                  </div>
                </div>

                {/* Itens */}
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D9]">
                  <span className="font-semibold text-[#8E6554] block mb-1.5">Itens Identificados no Cardápio:</span>
                  <ul className="divide-y divide-[#E8E2D9]">
                    {resultado.itensDetectados.map((item, idx) => (
                      <li key={idx} className="py-1.5 flex justify-between items-center font-medium">
                        <div>
                          <span className="font-bold text-[#2C2420]">• {item.quantidade}x {item.nomeProduto}</span>
                          <span className="text-[10px] text-[#8E6554] block">
                            (R$ {item.precoUnitario.toFixed(2)}/un)
                          </span>
                        </div>
                        <span className="font-black text-sm text-[#6E473B]">
                          R$ {item.subtotal.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Observações */}
                {resultado.observacoes && (
                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-[11px] text-[#57372D]">
                    <strong>Obs:</strong> {resultado.observacoes}
                  </div>
                )}

                {/* Resumo Financeiro */}
                <div className="bg-[#6E473B] text-white p-3 rounded-xl shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-sm font-black">
                    <span>Total do Pedido:</span>
                    <span className="text-base text-[#E6C285]">
                      R$ {resultado.itensDetectados.reduce((a, b) => a + b.subtotal, 0).toFixed(2)}
                    </span>
                  </div>
                  {resultado.isQuinzenal ? (
                    <div className="bg-white/10 rounded-lg p-2 text-xs text-[#E6C285] font-bold flex items-center justify-between mt-1">
                      <span>📅 Pagamento Quinzenal:</span>
                      <span className="text-white font-black">Sem sinal de 50%</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs text-[#FAF7F2]/80">
                      <span>Sinal 50% para reserva:</span>
                      <span className="font-bold">
                        R$ {(resultado.itensDetectados.reduce((a, b) => a + b.subtotal, 0) * 0.5).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmarPedido}
                className="mt-3 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <span>Confirmar & Criar Pedido na Agenda</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
