export type TipoUnidade = 'unidade' | 'cento' | 'kg' | 'porcao';

export type CategoriaProduto = 'doces' | 'salgados' | 'bolos' | 'tortas' | 'bebidas' | 'outros';

export interface Produto {
  id: string;
  nome: string;
  categoria: CategoriaProduto;
  tipoUnidade: TipoUnidade;
  precoBase: number;
  descricao?: string;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  googleMapsUrl?: string;
  observacoes?: string;
  isCasaDeEventos?: boolean;
}

export interface ItemPedido {
  id: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  tipoUnidade: TipoUnidade;
  precoUnitario: number;
  subtotal: number;
  observacao?: string;
}

export type StatusPagamento = 'pendente' | 'sinal_pago' | 'quitado';
export type TipoEntrega = 'entrega' | 'retirada';

export interface Pedido {
  id: string;
  numeroPedido: number;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEndereco: string;
  googleMapsUrl?: string;
  dataHoraEntrega: string; // ISO string
  tipoEntrega: TipoEntrega;
  itens: ItemPedido[];
  valorTotal: number;
  valorSinal: number;
  valorRestante: number;
  statusPagamento: StatusPagamento;
  googleCalendarEventId?: string;
  observacoes?: string;
  createdAt: string;
}

export interface ConfiguracaoLoja {
  nome: string;
  subtitulo: string;
  logoUrl: string;
  telefone: string;
  instagram: string;
  email: string;
  cidade: string;
  endereco: string;
  chavePix: string;
  titularPix: string;
  percentualSinalPadrao: number; // Ex: 50
  termoCondicoesPadrao: string;
}

export interface MovimentacaoFinanceira {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  categoria: string;
  data: string;
  pedidoId?: string;
}

export type PapelUsuario = 'admin' | 'atendente';

export interface UsuarioPermitido {
  id: string;
  email: string;
  nome: string;
  papel: PapelUsuario;
  ativo: boolean;
  adicionadoEm: string;
}

export interface SessaoUsuario {
  email: string;
  nome: string;
  avatarUrl: string;
  papel: PapelUsuario;
}

