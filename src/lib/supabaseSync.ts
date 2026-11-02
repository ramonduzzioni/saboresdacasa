import { supabase, isSupabaseConfigured } from './supabase';
import { Cliente, MovimentacaoFinanceira, Pedido, Produto } from '@/types';
import { CLIENTES_INICIAIS, MOVIMENTACOES_INICIAIS, PEDIDOS_INICIAIS, PRODUTOS_INICIAIS } from './initialData';

// Sincroniza produtos do Supabase
export async function syncProdutosFromSupabase(fallback: Produto[]): Promise<Produto[]> {
  if (!supabase || !isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase.from('produtos').select('*');
    if (error || !data || data.length === 0) {
      // Se a tabela estiver vazia, faz o seed inicial
      if (data && data.length === 0) {
        await supabase.from('produtos').upsert(
          fallback.map((p) => ({
            id: p.id,
            nome: p.nome,
            categoria: p.categoria,
            tipo_unidade: p.tipoUnidade,
            preco_base: p.precoBase,
            descricao: p.descricao,
            ativo: p.ativo,
          }))
        );
      }
      return fallback;
    }
    return data.map((d: any) => ({
      id: d.id,
      nome: d.nome,
      categoria: d.categoria,
      tipoUnidade: d.tipo_unidade || 'unidade',
      precoBase: Number(d.preco_base),
      descricao: d.descricao || '',
      ativo: Boolean(d.ativo),
    }));
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
      if (data && data.length === 0) {
        await supabase.from('clientes').upsert(
          fallback.map((c) => ({
            id: c.id,
            nome: c.nome,
            telefone: c.telefone,
            endereco: c.endereco,
            google_maps_url: c.googleMapsUrl,
            observacoes: c.observacoes,
            is_casa_de_eventos: c.isCasaDeEventos,
          }))
        );
      }
      return fallback;
    }
    return data.map((d: any) => ({
      id: d.id,
      nome: d.nome,
      telefone: d.telefone,
      endereco: d.endereco || '',
      googleMapsUrl: d.google_maps_url || '',
      observacoes: d.observacoes || '',
      isCasaDeEventos: Boolean(d.is_casa_de_eventos),
    }));
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
    });
  } catch (err) {
    console.warn('Erro ao salvar cliente no Supabase:', err);
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
    return data.map((d: any) => ({
      id: d.id,
      numeroPedido: d.numero_pedido,
      clienteId: d.cliente_id || '',
      clienteNome: d.cliente_nome,
      clienteTelefone: d.cliente_telefone,
      clienteEndereco: d.cliente_endereco || '',
      googleMapsUrl: d.google_maps_url || '',
      dataHoraEntrega: d.data_hora_entrega,
      tipoEntrega: d.tipo_entrega || 'entrega',
      itens: d.itens || [],
      valorTotal: Number(d.valor_total),
      valorSinal: Number(d.valor_sinal),
      valorRestante: Number(d.valor_restante),
      statusPagamento: d.status_pagamento || 'pendente',
      observacoes: d.observacoes || '',
      createdAt: d.created_at || new Date().toISOString(),
    }));
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
