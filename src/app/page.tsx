'use client';

import React, { useState, useEffect } from 'react';
import {
  Cliente,
  ConfiguracaoLoja,
  MovimentacaoFinanceira,
  Pedido,
  Produto,
  SessaoUsuario,
  UsuarioPermitido,
} from '@/types';
import {
  getConfig,
  saveConfig,
  getProdutos,
  saveProduto,
  deleteProduto,
  getClientes,
  saveCliente,
  deleteCliente,
  getPedidos,
  savePedido,
  deletePedido,
  getMovimentacoes,
  addMovimentacao,
  getUsuariosAutorizados,
  saveUsuarioAutorizado,
  deleteUsuarioAutorizado,
  getSessaoAtual,
  setSessaoAtual,
} from '@/lib/storage';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  syncProdutosFromSupabase,
  saveProdutoToSupabase,
  deleteProdutoFromSupabase,
  syncClientesFromSupabase,
  saveClienteToSupabase,
  syncPedidosFromSupabase,
  savePedidoToSupabase,
  deletePedidoFromSupabase,
} from '@/lib/supabaseSync';

import { LoginScreen } from '@/components/LoginScreen';
import { TeamManager } from '@/components/TeamManager';
import { TopAgendaWidget } from '@/components/TopAgendaWidget';
import { QuickOrderEditorModal } from '@/components/QuickOrderEditorModal';
import { OrderPdfModal } from '@/components/OrderPdfModal';
import { AiOrderImportModal } from '@/components/AiOrderImportModal';
import { NewOrderModal } from '@/components/NewOrderModal';
import { ClientsManager } from '@/components/ClientsManager';
import { ProductsManager } from '@/components/ProductsManager';
import { FinanceDashboard } from '@/components/FinanceDashboard';
import { StoreSettingsModal } from '@/components/StoreSettingsModal';

import {
  Sparkles,
  Plus,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Clock,
  MapPin,
  Navigation,
  MessageCircle,
  FileText,
  Edit3,
  Trash2,
  CheckCircle2,
  Search,
  ExternalLink,
  Database,
  Crown,
  ChefHat,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

import { CONFIG_INICIAL } from '@/lib/initialData';

export default function Home() {
  // Estado de Autenticação & Sessão
  const [sessao, setSessao] = useState<SessaoUsuario | null>(null);
  const [usuariosAutorizados, setUsuariosAutorizados] = useState<UsuarioPermitido[]>([]);
  const [carregouAuth, setCarregouAuth] = useState(false);
  const [erroAuthGoogle, setErroAuthGoogle] = useState<string | null>(null);

  // Estado Global do Sistema
  const [config, setConfig] = useState<ConfiguracaoLoja>(CONFIG_INICIAL);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoFinanceira[]>([]);

  // Aba ativa: pedidos | clientes | produtos | admin | equipe
  const [abaAtiva, setAbaAtiva] = useState<'pedidos' | 'clientes' | 'produtos' | 'admin' | 'equipe'>('pedidos');

  // Modais
  const [pedidoParaEditar, setPedidoParaEditar] = useState<Pedido | null>(null);
  const [pedidoParaPdf, setPedidoParaPdf] = useState<Pedido | null>(null);
  const [modalAiAberto, setModalAiAberto] = useState(false);
  const [modalNovoPedidoAberto, setModalNovoPedidoAberto] = useState(false);
  const [modalConfigAberto, setModalConfigAberto] = useState(false);

  // Busca e Filtros de Pedidos
  const [buscaPedido, setBuscaPedido] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Validador de sessão estrita Supabase OAuth
  const processarSessaoOAuthSupabase = async (supabaseSession: any) => {
    if (!supabaseSession?.user?.email) return;
    const emailGoogle = supabaseSession.user.email.toLowerCase().trim();
    const listaAtual = getUsuariosAutorizados();
    const usuarioAutorizado = listaAtual.find(
      (u) => u.email.toLowerCase().trim() === emailGoogle && u.ativo
    );

    if (usuarioAutorizado) {
      const novaSessao: SessaoUsuario = {
        email: usuarioAutorizado.email,
        nome: usuarioAutorizado.nome || supabaseSession.user.user_metadata?.full_name || 'Usuário Google',
        avatarUrl:
          supabaseSession.user.user_metadata?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        papel: usuarioAutorizado.papel,
      };
      setSessaoAtual(novaSessao);
      setSessao(novaSessao);
      setErroAuthGoogle(null);
    } else {
      console.warn(`Tentativa de acesso não autorizada: ${emailGoogle}`);
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      setSessaoAtual(null);
      setSessao(null);
      setErroAuthGoogle(
        `⛔ Acesso Negado: A conta Google (${emailGoogle}) não tem permissão para acessar o sistema. Apenas as contas autorizadas (rduzzioni@gmail.com e dduzzioni@gmail.com) podem acessar.`
      );
    }
  };

  // Carrega e sincroniza dados do LocalStorage e Supabase
  const carregarDados = () => {
    setConfig(getConfig());
    setProdutos(getProdutos());
    setClientes(getClientes());
    setPedidos(getPedidos());
    setMovimentacoes(getMovimentacoes());
    setUsuariosAutorizados(getUsuariosAutorizados());
    setSessao(getSessaoAtual());
    setCarregouAuth(true);

    // Se o Supabase estiver configurado, sincroniza na nuvem
    if (isSupabaseConfigured) {
      syncProdutosFromSupabase(getProdutos()).then((p) => setProdutos(p));
      syncClientesFromSupabase(getClientes()).then((c) => setClientes(c));
      syncPedidosFromSupabase(getPedidos()).then((ped) => setPedidos(ped));
    }
  };

  useEffect(() => {
    carregarDados();
    const handleUpdate = () => carregarDados();
    window.addEventListener('sabores-data-updated', handleUpdate);

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          processarSessaoOAuthSupabase(session);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          processarSessaoOAuthSupabase(session);
        }
      });

      return () => {
        window.removeEventListener('sabores-data-updated', handleUpdate);
        authListener?.subscription.unsubscribe();
      };
    }

    return () => window.removeEventListener('sabores-data-updated', handleUpdate);
  }, []);

  // Handlers de Login / Logout
  const handleLoginSuccess = (novaSessao: SessaoUsuario) => {
    setSessaoAtual(novaSessao);
    setSessao(novaSessao);
    setErroAuthGoogle(null);
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair da sua conta?')) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error(e);
        }
      }
      setSessaoAtual(null);
      setSessao(null);
      setErroAuthGoogle(null);
    }
  };

  // Handlers para Pedidos
  const handleSavePedido = (p: Pedido) => {
    savePedido(p);
    savePedidoToSupabase(p);
    carregarDados();
  };

  const handleDeletePedido = (id: string) => {
    if (confirm('Deseja realmente excluir este pedido?')) {
      deletePedido(id);
      deletePedidoFromSupabase(id);
      carregarDados();
    }
  };

  const handleMudarStatusPagamento = (pedido: Pedido, novoStatus: 'pendente' | 'sinal_pago' | 'quitado') => {
    const atualizado: Pedido = {
      ...pedido,
      statusPagamento: novoStatus,
      valorRestante: novoStatus === 'quitado' ? 0 : pedido.valorTotal - pedido.valorSinal,
    };
    savePedido(atualizado);

    if (novoStatus === 'quitado') {
      addMovimentacao({
        id: `mov-${Date.now()}`,
        tipo: 'entrada',
        valor: pedido.valorRestante,
        descricao: `Recebimento Quitação Pedido #${pedido.numeroPedido} - ${pedido.clienteNome}`,
        categoria: 'Venda de Pedido',
        data: new Date().toISOString(),
        pedidoId: pedido.id,
      });
    }
    carregarDados();
  };

  const handleWhatsApp = (pedido: Pedido) => {
    const limpo = pedido.clienteTelefone.replace(/\D/g, '');
    const dataFmt = new Date(pedido.dataHoraEntrega).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const texto = encodeURIComponent(
      `Olá ${pedido.clienteNome}! Aqui é da *${config.nome}*.\n\nPassando para confirmar seu pedido *#${pedido.numeroPedido}* agendado para *${dataFmt}*.\n\n*Total:* R$ ${pedido.valorTotal.toFixed(2)}\n*Sinal:* R$ ${pedido.valorSinal.toFixed(2)}\n*Saldo na entrega:* R$ ${pedido.valorRestante.toFixed(2)}\n\nQualquer ajuste de quantidades é só nos avisar!`
    );
    window.open(`https://wa.me/55${limpo}?text=${texto}`, '_blank');
  };

  // Filtra pedidos da aba
  const pedidosFiltrados = pedidos.filter((p) => {
    const matchBusca =
      p.clienteNome.toLowerCase().includes(buscaPedido.toLowerCase()) ||
      p.numeroPedido.toString().includes(buscaPedido);
    const matchStatus = filtroStatus === 'todos' || p.statusPagamento === filtroStatus;
    return matchBusca && matchStatus;
  });

  // SE NÃO ESTIVER LOGADO: EXIBE A TELA DE LOGIN COM GOOGLE E O LOGO DA CONFEITARIA
  if (!carregouAuth || !sessao) {
    return (
      <LoginScreen
        usuariosAutorizados={usuariosAutorizados}
        onLoginSuccess={handleLoginSuccess}
        erroExterno={erroAuthGoogle}
      />
    );
  }

  const isAdmin = sessao.papel === 'admin';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2420] pb-24 sm:pb-12">
      
      {/* BARRA SUPERIOR / HEADER COM GOOGLE ACCOUNT */}
      <header className="bg-white border-b border-[#E8E2D9] sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Marca da Confeitaria com Logo Oficial */}
          <div className="flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center p-1 shadow-xs overflow-hidden">
              <img
                src={config.logoUrl || '/logo-dark.png'}
                alt={config.nome}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-[#6E473B] tracking-tight leading-tight">
                {config.nome}
              </h1>
              <p className="text-[11px] text-[#8E6554] hidden sm:block">
                {config.subtitulo}
              </p>
            </div>
          </div>

          {/* Usuário Google Logado, Perfil e Botões */}
          <div className="flex items-center gap-2">
            {isSupabaseConfigured && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Database className="w-3 h-3 text-emerald-600" />
                Supabase Nuvem
              </span>
            )}

            {/* Identificação da Conta Google com Papel */}
            <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E8E2D9] py-1 px-2.5 rounded-full">
              <div
                className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  isAdmin ? 'bg-amber-600' : 'bg-[#6E473B]'
                }`}
              >
                {isAdmin ? <Crown className="w-3.5 h-3.5 text-amber-200" /> : <ChefHat className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left leading-none">
                <span className="font-bold text-xs text-[#2C2420] block max-w-[120px] sm:max-w-none truncate">
                  {sessao.nome.split(' ')[0]}
                </span>
                <span className="text-[10px] font-semibold text-[#8E6554]">
                  {isAdmin ? 'Proprietária' : 'Atendente'}
                </span>
              </div>
            </div>

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
              title="Sair da conta"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        
        {/* WIDGET DA AGENDA GOOGLE FIXO NO TOPO (4 PRÓXIMOS PEDIDOS) */}
        <TopAgendaWidget
          pedidos={pedidos}
          config={config}
          onEditQuick={(pedido) => setPedidoParaEditar(pedido)}
          onOpenPdf={(pedido) => setPedidoParaPdf(pedido)}
        />

        {/* BOTÕES DE AÇÃO RÁPIDA (TOUCH GIGANTE PARA CELULAR) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          
          {/* Botão de IA WhatsApp */}
          <button
            onClick={() => setModalAiAberto(true)}
            className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#6E473B] to-[#8E6554] text-white shadow-md hover:shadow-lg active:scale-98 transition-all"
          >
            <div className="p-2.5 rounded-xl bg-white/20">
              <Sparkles className="w-6 h-6 text-[#E6C285]" />
            </div>
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider text-[#E6C285] font-bold block">
                Agilidade no Balcão
              </span>
              <span className="text-base font-extrabold block">
                Importar do WhatsApp com IA
              </span>
            </div>
          </button>

          {/* Botão Novo Pedido Manual */}
          <button
            onClick={() => setModalNovoPedidoAberto(true)}
            className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white border-2 border-[#6E473B] text-[#6E473B] shadow-sm hover:bg-[#FAF7F2] active:scale-98 transition-all"
          >
            <div className="p-2.5 rounded-xl bg-[#6E473B] text-white">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider text-[#8E6554] font-bold block">
                Cadastro Direto
              </span>
              <span className="text-base font-extrabold block">
                Novo Pedido Manual
              </span>
            </div>
          </button>
        </div>

        {/* NAVEGAÇÃO EM 2 FILAS SIMÉTRICAS (GRID 3x2 COM 6 BOTÕES) */}
        <div className="bg-white p-2 rounded-2xl border border-[#E8E2D9] mb-6 shadow-xs">
          <div className="grid grid-cols-3 gap-2">
            
            {/* 1. Pedidos */}
            <button
              onClick={() => setAbaAtiva('pedidos')}
              className={`py-3 px-1.5 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
                abaAtiva === 'pedidos'
                  ? 'bg-[#6E473B] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#6E473B] hover:bg-[#E8E2D9] border border-[#E8E2D9]'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Pedidos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  abaAtiva === 'pedidos' ? 'bg-white/20 text-white' : 'bg-[#E8E2D9] text-[#6E473B]'
                }`}
              >
                {pedidos.length}
              </span>
            </button>

            {/* 2. Clientes */}
            <button
              onClick={() => setAbaAtiva('clientes')}
              className={`py-3 px-1.5 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
                abaAtiva === 'clientes'
                  ? 'bg-[#6E473B] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#6E473B] hover:bg-[#E8E2D9] border border-[#E8E2D9]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Clientes</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  abaAtiva === 'clientes' ? 'bg-white/20 text-white' : 'bg-[#E8E2D9] text-[#6E473B]'
                }`}
              >
                {clientes.length}
              </span>
            </button>

            {/* 3. Cardápio */}
            <button
              onClick={() => setAbaAtiva('produtos')}
              className={`py-3 px-1.5 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
                abaAtiva === 'produtos'
                  ? 'bg-[#6E473B] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#6E473B] hover:bg-[#E8E2D9] border border-[#E8E2D9]'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              <span>Cardápio</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  abaAtiva === 'produtos' ? 'bg-white/20 text-white' : 'bg-[#E8E2D9] text-[#6E473B]'
                }`}
              >
                {produtos.length}
              </span>
            </button>

            {/* Segunda Linha: Exclusiva da Proprietária (Simetria perfeita de 6 botões) */}
            {isAdmin && (
              <>
                {/* 4. Caixa */}
                <button
                  onClick={() => setAbaAtiva('admin')}
                  className={`py-3 px-1.5 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
                    abaAtiva === 'admin'
                      ? 'bg-[#6E473B] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#6E473B] hover:bg-[#E8E2D9] border border-[#E8E2D9]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Caixa</span>
                </button>

                {/* 5. Equipe */}
                <button
                  onClick={() => setAbaAtiva('equipe')}
                  className={`py-3 px-1.5 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
                    abaAtiva === 'equipe'
                      ? 'bg-[#6E473B] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#6E473B] hover:bg-[#E8E2D9] border border-[#E8E2D9]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Equipe</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      abaAtiva === 'equipe' ? 'bg-white/20 text-white' : 'bg-[#E8E2D9] text-[#6E473B]'
                    }`}
                  >
                    {usuariosAutorizados.length}
                  </span>
                </button>

                {/* 6. Ajustes (O 6º botão simétrico, substitui a engrenagem do topo) */}
                <button
                  onClick={() => setModalConfigAberto(true)}
                  className="py-3 px-1.5 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 transition-all bg-[#FAF7F2] text-[#6E473B] hover:bg-[#E8E2D9] border border-[#E8E2D9] active:scale-95"
                  title="Configurações da Confeitaria, Chave Pix e PDF"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Ajustes</span>
                </button>
              </>
            )}

          </div>
        </div>

        {/* CONTEÚDO DA ABA SELECIONADA */}

        {/* ABA 1: PEDIDOS & ENCOMENDAS */}
        {abaAtiva === 'pedidos' && (
          <div className="space-y-4">
            
            {/* Filtros e Busca */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#8E6554]" />
                <input
                  type="text"
                  placeholder="Buscar por cliente ou número do pedido..."
                  value={buscaPedido}
                  onChange={(e) => setBuscaPedido(e.target.value)}
                  className="w-full bg-white pl-9 pr-4 py-2.5 rounded-xl border border-[#D8CABE] text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'pendente', label: 'Aguardando' },
                  { id: 'sinal_pago', label: 'Sinal 50%' },
                  { id: 'quitado', label: 'Quitados' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setFiltroStatus(st.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${
                      filtroStatus === st.id
                        ? 'bg-[#6E473B] text-white border-[#6E473B]'
                        : 'bg-white text-[#6E473B] border-[#D8CABE]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-3.5">
              {pedidosFiltrados.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-[#E8E2D9]">
                  <p className="text-sm text-neutral-500">Nenhum pedido encontrado com os filtros atuais.</p>
                </div>
              ) : (
                pedidosFiltrados.map((pedido) => {
                  const dataObj = new Date(pedido.dataHoraEntrega);
                  const dataFmt = dataObj.toLocaleDateString('pt-BR');
                  const horaFmt = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={pedido.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D9] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F2EDE4]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#6E473B] border border-[#E8E2D9]">
                            #{pedido.numeroPedido}
                          </span>
                          <h3 className="font-bold text-base text-[#2C2420]">
                            {pedido.clienteNome}
                          </h3>
                        </div>

                        {/* Status de Pagamento Interativo */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              pedido.statusPagamento === 'quitado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pedido.statusPagamento === 'sinal_pago'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {pedido.statusPagamento === 'quitado'
                              ? '✓ Quitado'
                              : pedido.statusPagamento === 'sinal_pago'
                              ? 'Sinal 50% Pago'
                              : 'Aguardando Pagamento'}
                          </span>

                          {pedido.statusPagamento !== 'quitado' && (
                            <button
                              onClick={() => handleMudarStatusPagamento(pedido, 'quitado')}
                              className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              title="Marcar como totalmente pago"
                            >
                              Dar Baixa Quitado
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Informações de Entrega e Itens */}
                      <div className="py-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        
                        {/* Data e Local */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-[#6E473B]">
                            <Clock className="w-4 h-4 text-[#C68A4C]" />
                            <span>
                              {dataFmt} às {horaFmt} ({pedido.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'})
                            </span>
                          </div>

                          <div className="flex items-start gap-1.5 text-neutral-600">
                            <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                            <span>{pedido.clienteEndereco}</span>
                          </div>

                          {pedido.googleMapsUrl && (
                            <a
                              href={pedido.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hover:bg-emerald-100"
                            >
                              <Navigation className="w-3 h-3 text-emerald-600" />
                              <span>Abrir rota no GPS</span>
                            </a>
                          )}
                        </div>

                        {/* Lista de Itens do Pedido */}
                        <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9]">
                          <span className="font-bold text-[11px] uppercase tracking-wider text-[#8E6554] block mb-1">
                            Itens ({pedido.itens.length}):
                          </span>
                          <div className="space-y-1">
                            {pedido.itens.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-xs">
                                <span className="font-medium text-[#2C2420]">
                                  <strong>{item.quantidade}x</strong> {item.nomeProduto}
                                </span>
                                <span className="font-bold text-[#6E473B]">
                                  R$ {item.subtotal.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Barra de Totais e Botões de Ação */}
                      <div className="pt-3 border-t border-[#F2EDE4] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        
                        <div className="flex items-baseline gap-3 text-xs">
                          <div>
                            <span className="text-neutral-500">Total:</span>{' '}
                            <strong className="text-base font-extrabold text-[#6E473B]">
                              R$ {pedido.valorTotal.toFixed(2)}
                            </strong>
                          </div>
                          <div className="text-emerald-700 font-semibold">
                            Sinal: R$ {pedido.valorSinal.toFixed(2)}
                          </div>
                          {pedido.valorRestante > 0 && (
                            <div className="text-amber-800 font-semibold">
                              Resta: R$ {pedido.valorRestante.toFixed(2)}
                            </div>
                          )}
                        </div>

                        {/* BOTÕES DE AÇÃO RÁPIDA (DESTAQUE PARA EDICÃO DE QUANTIDADES) */}
                        <div className="flex items-center gap-2">
                          
                          {/* BOTÃO CRÍTICO: ALTERAR QUANTIDADES COM FACILIDADE */}
                          <button
                            onClick={() => setPedidoParaEditar(pedido)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                            title="Alterar quantidades do pedido"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Alterar Qtds</span>
                          </button>

                          {/* WHATSAPP */}
                          <button
                            onClick={() => handleWhatsApp(pedido)}
                            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95"
                            title="Chamar no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* PDF */}
                          <button
                            onClick={() => setPedidoParaPdf(pedido)}
                            className="p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#6E473B] border border-[#D8CABE] transition-colors active:scale-95"
                            title="Gerar PDF do Orçamento/Pedido"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* EXCLUIR */}
                          <button
                            onClick={() => handleDeletePedido(pedido.id)}
                            className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Excluir pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ABA 2: CLIENTES & ROTAS */}
        {abaAtiva === 'clientes' && (
          <ClientsManager
            clientes={clientes}
            onSaveCliente={(c) => {
              saveCliente(c);
              saveClienteToSupabase(c);
              carregarDados();
            }}
            onDeleteCliente={(id) => {
              deleteCliente(id);
              carregarDados();
            }}
          />
        )}

        {/* ABA 3: CARDÁPIO / PRODUTOS */}
        {abaAtiva === 'produtos' && (
          <ProductsManager
            produtos={produtos}
            onSaveProduto={(p) => {
              saveProduto(p);
              saveProdutoToSupabase(p);
              carregarDados();
            }}
            onDeleteProduto={(id) => {
              deleteProduto(id);
              deleteProdutoFromSupabase(id);
              carregarDados();
            }}
          />
        )}

        {/* ABA 4: FINANCEIRO & GRÁFICOS (APENAS PROPRIETÁRIA) */}
        {abaAtiva === 'admin' && isAdmin && (
          <FinanceDashboard
            movimentacoes={movimentacoes}
            pedidos={pedidos}
            onAddMovimentacao={(m) => {
              addMovimentacao(m);
              carregarDados();
            }}
          />
        )}

        {/* ABA 5: EQUIPE & ACESSOS GOOGLE (APENAS PROPRIETÁRIA) */}
        {abaAtiva === 'equipe' && isAdmin && (
          <TeamManager
            usuarios={usuariosAutorizados}
            onSaveUsuario={(u) => {
              saveUsuarioAutorizado(u);
              carregarDados();
            }}
            onDeleteUsuario={(id) => {
              deleteUsuarioAutorizado(id);
              carregarDados();
            }}
          />
        )}

      </main>

      {/* MODAL 1: EDIÇÃO RÁPIDA DE QUANTIDADES (EXCLUSIVO PARA CLIENTES FREQUENTES) */}
      <QuickOrderEditorModal
        pedido={pedidoParaEditar}
        produtosDisponiveis={produtos}
        isOpen={!!pedidoParaEditar}
        onClose={() => setPedidoParaEditar(null)}
        onSave={(atualizado) => {
          handleSavePedido(atualizado);
        }}
      />

      {/* MODAL 2: VISUALIZAÇÃO E DOWNLOAD DO PDF FIEL À REFERÊNCIA */}
      <OrderPdfModal
        pedido={pedidoParaPdf}
        config={config}
        isOpen={!!pedidoParaPdf}
        onClose={() => setPedidoParaPdf(null)}
      />

      {/* MODAL 3: IMPORTAÇÃO DE TEXTO DO WHATSAPP COM IA */}
      <AiOrderImportModal
        clientes={clientes}
        produtos={produtos}
        isOpen={modalAiAberto}
        onClose={() => setModalAiAberto(false)}
        onOrderCreated={(novo) => {
          savePedido(novo);
          carregarDados();
          setPedidoParaPdf(novo);
        }}
      />

      {/* MODAL 4: NOVO PEDIDO MANUAL */}
      <NewOrderModal
        clientes={clientes}
        produtos={produtos}
        isOpen={modalNovoPedidoAberto}
        onClose={() => setModalNovoPedidoAberto(false)}
        onSave={(novo) => {
          savePedido(novo);
          carregarDados();
        }}
      />

      {/* MODAL 5: CONFIGURAÇÕES DA LOJA & DADOS DO PDF (APENAS PROPRIETÁRIA) */}
      {isAdmin && (
        <StoreSettingsModal
          config={config}
          isOpen={modalConfigAberto}
          onClose={() => setModalConfigAberto(false)}
          onSave={(novaConfig) => {
            saveConfig(novaConfig);
            carregarDados();
          }}
        />
      )}

    </div>
  );
}
