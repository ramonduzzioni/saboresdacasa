import { supabase, isSupabaseConfigured } from './supabase';
import { Cliente, MovimentacaoFinanceira, Pedido, Produto } from '@/types';
import { CLIENTES_INICIAIS, MOVIMENTACOES_INICIAIS, PEDIDOS_INICIAIS, PRODUTOS_INICIAIS } from './initialData';

// Sincroniza produtos do Supabase
export async function syncProdutosFromSupabase(fallback: Produto[]): Promise<Produto[]> {
  if (!supabase || !isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase.from('produtos').select('*');
    if (error || !data || data.length === 0) {
      return fallback;
    }
    return data.map((d: any) => {
      const inicial = PRODUTOS_INICIAIS.find(
        (p) => p.id === d.id || p.nome.toLowerCase() === d.nome.toLowerCase()
      );
      const precoBase = Number(d.preco_base);
      const precoParque =
        typeof d.preco_parque === 'number'
          ? Number(d.preco_parque)
          : inicial?.precoParque;

      return {
        id: d.id,
        nome: d.nome,
        categoria: d.categoria,
        tipoUnidade: d.tipo_unidade || 'unidade',
        precoBase,
        precoParque,
        descricao: d.descricao || '',
        ativo: Boolean(d.ativo),
      };
    });
  } catch (err) {
    console.warn('Erro ao sincronizar produtos do Supabase:', err);
    return fallback;
  }
}

// Salva produto no Supabase
export async function saveProdutoToSupabase(produto: Produto): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    await supabase.from('produtos').upsert({
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      tipo_unidade: produto.tipoUnidade,
      preco_base: produto.precoBase,
      preco_parque: produto.precoParque || null,
      descricao: produto.descricao,
      ativo: produto.ativo,
    });
  } catch (err) {
    console.warn('Erro ao salvar produto no Supabase:', err);
  }
}

// Remove produto do Supabase
export async function deleteProdutoFromSupabase(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    await supabase.from('produtos').delete().eq('id', id);
  } catch (err) {
    console.warn('Erro ao deletar produto do Supabase:', err);
  }
}

// Sincroniza clientes do Supabase
export async function syncClientesFromSupabase(fallback: Cliente[]): Promise<Cliente[]> {
  if (!supabase || !isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase.from('clientes').select('*');
    if (error || !data || data.length === 0) {
      return fallback;
    }

    const excluidos: string[] =
      typeof window !== 'undefined'
        ? JSON.parse(
            window.localStorage.getItem('sabores_clientes_excluidos_v1') || '[]'
          )
        : [];

    return data
      .filter((d: any) => !excluidos.includes(d.id))
      .map((d: any) => {
        const isParque =
          d.tabela_preco === 'parque' ||
          d.nome?.toLowerCase().includes('urso') ||
          d.nome?.toLowerCase().includes('parque');

        return {
          id: d.id,
          nome: d.nome,
          telefone: d.telefone,
          endereco: d.endereco || '',
          googleMapsUrl: d.google_maps_url || '',
          observacoes: d.observacoes || '',
          isCasaDeEventos: Boolean(d.is_casa_de_eventos),
          tabelaPreco: isParque ? 'parque' : d.tabela_preco || 'padrao',
          tipoCobranca: isParque ? 'quinzenal' : d.tipo_cobranca || 'padrao_50',
        };
      });
  } catch (err) {
    console.warn('Erro ao sincronizar clientes do Supabase:', err);
    return fallback;
  }
}

// Salva cliente no Supabase
export async function saveClienteToSupabase(cliente: Cliente): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    await supabase.from('clientes').upsert({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      google_maps_url: cliente.googleMapsUrl,
      observacoes: cliente.observacoes,
      is_casa_de_eventos: cliente.isCasaDeEventos,
      tabela_preco: cliente.tabelaPreco || 'padrao',
      tipo_cobranca: cliente.tipoCobranca || 'padrao_50',
    });
  } catch (err) {
    console.warn('Erro ao salvar cliente no Supabase:', err);
  }
}

// Remove cliente do Supabase
export async function deleteClienteFromSupabase(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    await supabase.from('clientes').delete().eq('id', id);
  } catch (err) {
    console.warn('Erro ao deletar cliente no Supabase:', err);
  }
}

// Sincroniza pedidos do Supabase
export async function syncPedidosFromSupabase(fallback: Pedido[]): Promise<Pedido[]> {
  if (!supabase || !isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase.from('pedidos').select('*');
    if (error || !data || data.length === 0) {
      return fallback;
    }
    return data
      .map((d: any) => {
        const isParque =
          d.tipo_cobranca === 'quinzenal' ||
          d.cliente_nome?.toLowerCase().includes('urso') ||
          d.cliente_nome?.toLowerCase().includes('parque');

        let itens = Array.isArray(d.itens) ? d.itens : [];
        let valorTotal = Number(d.valor_total);
        let valorSinal = isParque ? 0 : Number(d.valor_sinal);
        let valorRestante = isParque ? valorTotal : Number(d.valor_restante);

        if (isParque) {
          let soma = 0;
          let recalculou = false;
          itens = itens.map((it: any) => {
            const inicial = PRODUTOS_INICIAIS.find(
              (p) => p.id === it.produtoId || p.nome.toLowerCase() === it.nomeProduto?.toLowerCase()
            );
            if (inicial?.precoParque && Math.abs(it.precoUnitario - inicial.precoParque) > 0.001) {
              recalculou = true;
              const subtotal = Number((it.quantidade * inicial.precoParque).toFixed(2));
              soma += subtotal;
              return {
                ...it,
                precoUnitario: inicial.precoParque,
                subtotal,
              };
            }
            soma += Number(it.subtotal || 0);
            return it;
          });
          if (recalculou) {
            valorTotal = Number(soma.toFixed(2));
            valorRestante = valorTotal;
            valorSinal = 0;
          }
        }

        return {
          id: d.id,
          numeroPedido: d.numero_pedido,
          clienteId: d.cliente_id || '',
          clienteNome: d.cliente_nome,
          clienteTelefone: d.cliente_telefone,
          clienteEndereco: d.cliente_endereco || '',
          googleMapsUrl: d.google_maps_url || '',
          dataHoraEntrega: d.data_hora_entrega,
          tipoEntrega: d.tipo_entrega || 'entrega',
          itens,
          valorTotal,
          valorSinal,
          valorRestante,
          statusPagamento: d.status_pagamento || 'pendente',
          tipoCobranca: isParque ? 'quinzenal' : d.tipo_cobranca || 'padrao_50',
          observacoes: d.observacoes || '',
          createdAt: d.created_at || new Date().toISOString(),
        };
      })
      .sort((a: any, b: any) => new Date(a.dataHoraEntrega).getTime() - new Date(b.dataHoraEntrega).getTime());
  } catch (err) {
    console.warn('Erro ao sincronizar pedidos do Supabase:', err);
    return fallback;
  }
}

// Salva pedido no Supabase
export async function savePedidoToSupabase(pedido: Pedido): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    await supabase.from('pedidos').upsert({
      id: pedido.id,
      numero_pedido: pedido.numeroPedido,
      cliente_id: pedido.clienteId,
      cliente_nome: pedido.clienteNome,
      cliente_telefone: pedido.clienteTelefone,
      cliente_endereco: pedido.clienteEndereco,
      google_maps_url: pedido.googleMapsUrl,
      data_hora_entrega: pedido.dataHoraEntrega,
      tipo_entrega: pedido.tipoEntrega,
      itens: pedido.itens,
      valor_total: pedido.valorTotal,
      valor_sinal: pedido.valorSinal,
      valor_restante: pedido.valorRestante,
      status_pagamento: pedido.statusPagamento,
      tipo_cobranca: pedido.tipoCobranca || 'padrao_50',
      observacoes: pedido.observacoes,
    });
  } catch (err) {
    console.warn('Erro ao salvar pedido no Supabase:', err);
  }
}

export async function deletePedidoFromSupabase(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    await supabase.from('pedidos').delete().eq('id', id);
  } catch (err) {
    console.warn('Erro ao deletar pedido no Supabase:', err);
  }
}
