import { Cliente, ConfiguracaoLoja, MovimentacaoFinanceira, Pedido, Produto, SessaoUsuario, UsuarioPermitido } from '@/types';
import { CLIENTES_INICIAIS, CONFIG_INICIAL, MOVIMENTACOES_INICIAIS, PEDIDOS_INICIAIS, PRODUTOS_INICIAIS } from './initialData';

const STORAGE_KEYS = {
  CONFIG: 'sabores_config_v1',
  PRODUTOS: 'sabores_produtos_v2',
  CLIENTES: 'sabores_clientes_v1',
  PEDIDOS: 'sabores_pedidos_v2',
  MOVIMENTACOES: 'sabores_movimentacoes_v2',
  GOOGLE_USER: 'sabores_google_user_v1',
  USUARIOS_AUTORIZADOS: 'sabores_usuarios_autorizados_v1',
  AUTH_SESSION: 'sabores_auth_session_v1',
};

export const USUARIOS_INICIAIS: UsuarioPermitido[] = [
  {
    id: 'user-admin-1',
    email: 'ramonduzzioni@gmail.com',
    nome: 'Ramon Duzzioni (Proprietário)',
    papel: 'admin',
    ativo: true,
    adicionadoEm: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'user-admin-2',
    email: 'saboresdacasa.sp@gmail.com',
    nome: 'Sabores da Casa (Admin)',
    papel: 'admin',
    ativo: true,
    adicionadoEm: '2026-11-01T00:00:00.000Z',
  },
];

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

// Gestão de Usuários Autorizados (Whitelist de E-mails)
export function getUsuariosAutorizados(): UsuarioPermitido[] {
  return getLocal<UsuarioPermitido[]>(STORAGE_KEYS.USUARIOS_AUTORIZADOS, USUARIOS_INICIAIS);
}

export function saveUsuarioAutorizado(usuario: UsuarioPermitido): void {
  const list = getUsuariosAutorizados();
  const idx = list.findIndex((u) => u.email.toLowerCase() === usuario.email.toLowerCase());
  if (idx >= 0) {
    list[idx] = usuario;
  } else {
    list.push(usuario);
  }
  setLocal(STORAGE_KEYS.USUARIOS_AUTORIZADOS, list);
}

export function deleteUsuarioAutorizado(id: string): void {
  const list = getUsuariosAutorizados().filter((u) => u.id !== id);
  setLocal(STORAGE_KEYS.USUARIOS_AUTORIZADOS, list);
}

// Gestão de Sessão do Usuário
export function getSessaoAtual(): SessaoUsuario | null {
  return getLocal<SessaoUsuario | null>(STORAGE_KEYS.AUTH_SESSION, null);
}

export function setSessaoAtual(sessao: SessaoUsuario | null): void {
  setLocal(STORAGE_KEYS.AUTH_SESSION, sessao);
}

