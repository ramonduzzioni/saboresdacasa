import { Cliente, ConfiguracaoLoja, MovimentacaoFinanceira, Pedido, Produto, SessaoUsuario, UsuarioPermitido } from '@/types';
import { CLIENTES_INICIAIS, CONFIG_INICIAL, MOVIMENTACOES_INICIAIS, PEDIDOS_INICIAIS, PRODUTOS_INICIAIS } from './initialData';

const STORAGE_KEYS = {
  CONFIG: 'sabores_config_v1',
  PRODUTOS: 'sabores_produtos_v2',
  CLIENTES: 'sabores_clientes_v1',
  CLIENTES_EXCLUIDOS: 'sabores_clientes_excluidos_v1',
  PEDIDOS: 'sabores_pedidos_v2',
  MOVIMENTACOES: 'sabores_movimentacoes_v2',
  GOOGLE_USER: 'sabores_google_user_v1',
  USUARIOS_AUTORIZADOS: 'sabores_usuarios_autorizados_v3',
  AUTH_SESSION: 'sabores_auth_session_v3',
  SECURITY_PIN: 'sabores_security_pin_v1',
};

export const DEFAULT_PIN = '2026';

export function getSecurityPin(): string {
  return getLocal<string>(STORAGE_KEYS.SECURITY_PIN, DEFAULT_PIN);
}

export function saveSecurityPin(pin: string): void {
  setLocal(STORAGE_KEYS.SECURITY_PIN, pin);
}

export const USUARIOS_INICIAIS: UsuarioPermitido[] = [
  {
    id: 'user-admin-1',
    email: 'rduzzioni@gmail.com',
    nome: 'Ramon Duzzioni',
    papel: 'admin',
    ativo: true,
    adicionadoEm: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'user-admin-2',
    email: 'dduzzioni@gmail.com',
    nome: 'D. Duzzioni',
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
  const produtos = getLocal<Produto[]>(STORAGE_KEYS.PRODUTOS, PRODUTOS_INICIAIS);
  // Garante que cada produto tenha o preço do Parque Temático preenchido se não estiver definido
  return produtos.map((p) => {
    if (typeof p.precoParque !== 'number') {
      const inicial = PRODUTOS_INICIAIS.find(
        (pi) => pi.id === p.id || pi.nome.toLowerCase() === p.nome.toLowerCase()
      );
      if (inicial?.precoParque) {
        return { ...p, precoParque: inicial.precoParque };
      }
    }
    return p;
  });
}

export function getPrecoProdutoParaCliente(produto: Produto, cliente?: Cliente | null): number {
  if (!produto) return 0;
  const isParque =
    cliente?.tabelaPreco === 'parque' ||
    cliente?.nome?.toLowerCase().includes('urso') ||
    cliente?.nome?.toLowerCase().includes('parque');

  if (isParque) {
    if (typeof produto.precoParque === 'number' && produto.precoParque > 0) {
      return produto.precoParque;
    }
    const inicial = PRODUTOS_INICIAIS.find(
      (p) => p.id === produto.id || p.nome.toLowerCase() === produto.nome.toLowerCase()
    );
    if (inicial && typeof inicial.precoParque === 'number' && inicial.precoParque > 0) {
      return inicial.precoParque;
    }
  }
  return produto.precoBase;
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

// Clientes Excluídos (Lista negra permanente para que clientes deletados nunca ressuscitem)
export function getClientesExcluidos(): string[] {
  return getLocal<string[]>(STORAGE_KEYS.CLIENTES_EXCLUIDOS, []);
}

// Clientes
export function getClientes(): Cliente[] {
  const excluidos = getClientesExcluidos();
  const raw = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, CLIENTES_INICIAIS);
  const list = raw.filter((c) => !excluidos.includes(c.id));

  return list.map((c) => {
    if (c.nome.toLowerCase().includes('urso') || c.nome.toLowerCase().includes('parque')) {
      return {
        ...c,
        tabelaPreco: c.tabelaPreco || 'parque',
        tipoCobranca: c.tipoCobranca || 'quinzenal',
        isCasaDeEventos: true,
      };
    }
    return c;
  });
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
  // 1. Marca na lista permanente de excluídos
  const excluidos = getClientesExcluidos();
  if (!excluidos.includes(id)) {
    excluidos.push(id);
    setLocal(STORAGE_KEYS.CLIENTES_EXCLUIDOS, excluidos);
  }

  // 2. Remove da lista de clientes
  const list = getClientes().filter((c) => c.id !== id);
  setLocal(STORAGE_KEYS.CLIENTES, list);
}

// Pedidos
export function getPedidos(): Pedido[] {
  const pedidos = getLocal<Pedido[]>(STORAGE_KEYS.PEDIDOS, PEDIDOS_INICIAIS);
  const clientes = getClientes();
  const produtos = getProdutos();

  // Garante que pedidos de Parque Temático / Toca do Urso estejam com os preços corretos e 0% sinal
  const pedidosProcessados = pedidos.map((p) => {
    const isParque =
      p.tipoCobranca === 'quinzenal' ||
      p.clienteNome.toLowerCase().includes('urso') ||
      p.clienteNome.toLowerCase().includes('parque');

    if (isParque) {
      const clienteRef =
        clientes.find((c) => c.id === p.clienteId) ||
        clientes.find((c) => c.nome.toLowerCase() === p.clienteNome.toLowerCase()) ||
        clientes.find((c) => c.nome.toLowerCase().includes('urso')) ||
        ({
          id: p.clienteId || 'cli-parque',
          nome: p.clienteNome,
          tabelaPreco: 'parque',
          tipoCobranca: 'quinzenal',
        } as Cliente);

      let total = 0;
      let alterou = false;
      const itensCorrigidos = (p.itens || []).map((item) => {
        const prod = produtos.find(
          (x) => x.id === item.produtoId || x.nome.toLowerCase() === item.nomeProduto.toLowerCase()
        );
        if (prod) {
          const precoAdequado = getPrecoProdutoParaCliente(prod, clienteRef);
          if (precoAdequado > 0 && Math.abs(item.precoUnitario - precoAdequado) > 0.001) {
            alterou = true;
            const sub = Number((item.quantidade * precoAdequado).toFixed(2));
            total += sub;
            return {
              ...item,
              precoUnitario: precoAdequado,
              subtotal: sub,
            };
          }
        }
        total += item.subtotal || 0;
        return item;
      });

      if (alterou || p.valorSinal > 0 || p.tipoCobranca !== 'quinzenal') {
        const totalFinal = Number(total.toFixed(2));
        return {
          ...p,
          tipoCobranca: 'quinzenal' as const,
          itens: itensCorrigidos,
          valorTotal: totalFinal,
          valorSinal: 0,
          valorRestante: totalFinal,
        };
      }
    }
    return p;
  });

  // Ordena por data mais próxima primeiro
  return pedidosProcessados.sort((a, b) => new Date(a.dataHoraEntrega).getTime() - new Date(b.dataHoraEntrega).getTime());
}

export function savePedido(pedido: Pedido): void {
  const list = getPedidos();
  const idx = list.findIndex((p) => p.id === pedido.id);
  if (idx >= 0) {
    list[idx] = pedido;
  } else {
    list.push(pedido);
  }
  // Sempre reordena por data e hora de entrega (mais próxima primeiro)
  list.sort((a, b) => new Date(a.dataHoraEntrega).getTime() - new Date(b.dataHoraEntrega).getTime());
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

