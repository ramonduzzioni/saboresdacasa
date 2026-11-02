import { Cliente, ConfiguracaoLoja, MovimentacaoFinanceira, Pedido, Produto } from '@/types';
import { CLIENTES_INICIAIS, CONFIG_INICIAL, MOVIMENTACOES_INICIAIS, PEDIDOS_INICIAIS, PRODUTOS_INICIAIS } from './initialData';

const STORAGE_KEYS = {
  CONFIG: 'sabores_config_v1',
  PRODUTOS: 'sabores_produtos_v1',
  CLIENTES: 'sabores_clientes_v1',
  PEDIDOS: 'sabores_pedidos_v1',
  MOVIMENTACOES: 'sabores_movimentacoes_v1',
  GOOGLE_USER: 'sabores_google_user_v1',
};

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Erro ao ler do storage ${key}:`, err);
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('sabores-data-updated'));
  } catch (err) {
    console.error(`Erro ao salvar no storage ${key}:`, err);
  }
}

// Configuração
export function getConfig(): ConfiguracaoLoja {
  return getLocal<ConfiguracaoLoja>(STORAGE_KEYS.CONFIG, CONFIG_INICIAL);
}
export function saveConfig(cfg: ConfiguracaoLoja): void {
  setLocal(STORAGE_KEYS.CONFIG, cfg);
}

// Produtos
export function getProdutos(): Produto[] {
  return getLocal<Produto[]>(STORAGE_KEYS.PRODUTOS, PRODUTOS_INICIAIS);
}
export function saveProduto(produto: Produto): void {
  const list = getProdutos();
  const idx = list.findIndex((p) => p.id === produto.id);
  if (idx >= 0) {
    list[idx] = produto;
  } else {
    list.unshift(produto);
  }
  setLocal(STORAGE_KEYS.PRODUTOS, list);
}
export function deleteProduto(id: string): void {
  const list = getProdutos().filter((p) => p.id !== id);
  setLocal(STORAGE_KEYS.PRODUTOS, list);
}

// Clientes
export function getClientes(): Cliente[] {
  return getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, CLIENTES_INICIAIS);
}
export function saveCliente(cliente: Cliente): void {
  const list = getClientes();
  const idx = list.findIndex((c) => c.id === cliente.id);
  if (idx >= 0) {
    list[idx] = cliente;
  } else {
    list.unshift(cliente);
  }
  setLocal(STORAGE_KEYS.CLIENTES, list);
}
export function deleteCliente(id: string): void {
  const list = getClientes().filter((c) => c.id !== id);
  setLocal(STORAGE_KEYS.CLIENTES, list);
}

// Pedidos
export function getPedidos(): Pedido[] {
  const pedidos = getLocal<Pedido[]>(STORAGE_KEYS.PEDIDOS, PEDIDOS_INICIAIS);
  // Ordena por data mais próxima primeiro
  return pedidos.sort((a, b) => new Date(a.dataHoraEntrega).getTime() - new Date(b.dataHoraEntrega).getTime());
}

export function savePedido(pedido: Pedido): void {
  const list = getPedidos();
  const idx = list.findIndex((p) => p.id === pedido.id);
  if (idx >= 0) {
    list[idx] = pedido;
  } else {
    list.unshift(pedido);
  }
  setLocal(STORAGE_KEYS.PEDIDOS, list);
}

export function deletePedido(id: string): void {
  const list = getPedidos().filter((p) => p.id !== id);
  setLocal(STORAGE_KEYS.PEDIDOS, list);
}

// Movimentações Financeiras
export function getMovimentacoes(): MovimentacaoFinanceira[] {
  const movs = getLocal<MovimentacaoFinanceira[]>(STORAGE_KEYS.MOVIMENTACOES, MOVIMENTACOES_INICIAIS);
  return movs.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export function addMovimentacao(mov: MovimentacaoFinanceira): void {
  const list = getMovimentacoes();
  list.unshift(mov);
  setLocal(STORAGE_KEYS.MOVIMENTACOES, list);
}

// Usuário Google Simulado/Conectado
export interface GoogleUser {
  nome: string;
  email: string;
  avatarUrl: string;
  connectedAt: string;
}

export function getGoogleUser(): GoogleUser | null {
  return getLocal<GoogleUser | null>(STORAGE_KEYS.GOOGLE_USER, {
    nome: 'Confeitaria Sabores',
    email: 'saboresdacasa.sp@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    connectedAt: '2026-11-01T20:00:00.000Z',
  });
}

export function setGoogleUser(user: GoogleUser | null): void {
  setLocal(STORAGE_KEYS.GOOGLE_USER, user);
}
