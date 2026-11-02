import { Pedido } from '@/types';

/**
 * Gera um link direto para criar o evento no Google Agenda (Google Calendar)
 * sem precisar de permissões complexas de API OAuth no navegador.
 * Abre diretamente a tela de confirmação do evento no celular ou computador.
 */
export function getGoogleCalendarLink(pedido: Pedido): string {
  try {
    const dataEntrega = new Date(pedido.dataHoraEntrega);
    if (isNaN(dataEntrega.getTime())) {
      return 'https://calendar.google.com';
    }

    // Formato exigido pelo Google Calendar: YYYYMMDDTHHmmssZ (em UTC)
    const formatGDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const dataFim = new Date(dataEntrega.getTime() + 60 * 60 * 1000); // 1 hora de duração estimada

    const titulo = `Sabores da Casa: Pedido #${pedido.numeroPedido} - ${pedido.clienteNome}`;
    
    const resumoItens = pedido.itens
      .map((i) => `• ${i.quantidade}x ${i.nomeProduto}`)
      .join('\n');

    const tipoCobrancaStr =
      pedido.tipoCobranca === 'quinzenal' || pedido.clienteNome.toLowerCase().includes('urso')
        ? 'Faturamento Quinzenal (Sem Sinal)'
        : `Total: R$ ${pedido.valorTotal.toFixed(2)} | Sinal: R$ ${pedido.valorSinal.toFixed(2)} | Restante: R$ ${pedido.valorRestante.toFixed(2)}`;

    const detalhes = [
      `📦 PEDIDO #${pedido.numeroPedido}`,
      `👤 Cliente: ${pedido.clienteNome}`,
      `📞 WhatsApp: ${pedido.clienteTelefone}`,
      `💰 Condição: ${tipoCobrancaStr}`,
      `🚚 Tipo: ${pedido.tipoEntrega === 'entrega' ? 'Entrega em domicílio' : 'Retirada no balcão'}`,
      `📍 Endereço: ${pedido.clienteEndereco || 'Balcão da Confeitaria'}`,
      '',
      '📋 ITENS DO PEDIDO:',
      resumoItens,
      pedido.observacoes ? `\n📝 Observações: ${pedido.observacoes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const localizacao = pedido.clienteEndereco || 'Sabores da Casa - Balcão';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: titulo,
      dates: `${formatGDate(dataEntrega)}/${formatGDate(dataFim)}`,
      details: detalhes,
      location: localizacao,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch {
    return 'https://calendar.google.com';
  }
}
