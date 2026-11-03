import { Pedido } from '@/types';

/**
 * Formata a mensagem especial do WhatsApp para a Toca do Urso / Parque Temático.
 * Requisito:
 * - Número do pedido (mesmo que salva no sistema)
 * - Data e hora de entrega
 * - Itens SEM o preço
 * - Sem saudações ou valores financeiros
 */
export function formatarMensagemWhatsAppParque(pedido: Pedido): string {
  const dataObj = new Date(pedido.dataHoraEntrega);
  const dataFmt = dataObj.toLocaleDateString('pt-BR');
  const horaFmt = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const itensTexto = (pedido.itens || [])
    .map((item) => `• ${item.quantidade}x ${item.nomeProduto}${item.observacao ? ` (${item.observacao})` : ''}`)
    .join('\n');

  let msg = `*Pedido #${pedido.numeroPedido}*\n*Entrega:* ${dataFmt} às ${horaFmt}\n\n*Itens:*\n${itensTexto}`;

  if (pedido.observacoes && pedido.observacoes.trim()) {
    msg += `\n\n*Obs:* ${pedido.observacoes.trim()}`;
  }

  return msg;
}

/**
 * Envia ou compartilha a mensagem no WhatsApp.
 * - Para o Parque Temático / Toca do Urso: envia a mensagem especial sem preços,
 *   usando o compartilhamento nativo para escolher o grupo do WhatsApp no celular.
 * - Para outros clientes: abre o WhatsApp limpo sem mensagens automáticas pré-digitadas.
 */
export async function enviarMensagemWhatsApp(pedido: Pedido): Promise<void> {
  const isParque =
    pedido.tipoCobranca === 'quinzenal' ||
    pedido.clienteNome.toLowerCase().includes('urso') ||
    pedido.clienteNome.toLowerCase().includes('parque');

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isParque) {
    const textoMsg = formatarMensagemWhatsAppParque(pedido);

    // Tenta compartilhamento nativo do dispositivo (abre menu para escolher o Grupo do WhatsApp)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          text: textoMsg,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // Usuário cancelou o envio
      }
    }

    // Fallback se navigator.share não estiver disponível
    const encoded = encodeURIComponent(textoMsg);
    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encoded}`;
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
    return;
  }

  // Clientes comuns: abre direto sem texto automático
  const limpo = pedido.clienteTelefone.replace(/\D/g, '');
  if (limpo) {
    window.open(`https://wa.me/55${limpo}`, '_blank');
  } else {
    if (isMobile) {
      window.location.href = 'whatsapp://send';
    } else {
      window.open('https://api.whatsapp.com/send', '_blank');
    }
  }
}
