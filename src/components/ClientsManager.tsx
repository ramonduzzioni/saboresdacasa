'use client';

import React, { useState } from 'react';
import { Cliente } from '@/types';
import { Users, Plus, Edit2, Trash2, MapPin, Navigation, Phone, Search, Building2, ExternalLink, Check, X, Tag, Receipt } from 'lucide-react';

interface ClientsManagerProps {
  clientes: Cliente[];
  onSaveCliente: (cliente: Cliente) => void;
  onDeleteCliente: (id: string) => void;
  onOpenRelatorio?: (cliente: Cliente) => void;
}

export function ClientsManager({
  clientes,
  onSaveCliente,
  onDeleteCliente,
  onOpenRelatorio,
}: ClientsManagerProps) {
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isCasaDeEventos, setIsCasaDeEventos] = useState(false);
  const [tabelaPreco, setTabelaPreco] = useState<'padrao' | 'parque'>('padrao');

  const abrirNovo = () => {
    setClienteEmEdicao(null);
    setNome('');
    setTelefone('');
    setEndereco('');
    setGoogleMapsUrl('');
    setObservacoes('');
    setIsCasaDeEventos(false);
    setTabelaPreco('padrao');
    setModalAberto(true);
  };

  const abrirEdicao = (c: Cliente) => {
    setClienteEmEdicao(c);
    setNome(c.nome);
    setTelefone(c.telefone);
    setEndereco(c.endereco);
    setGoogleMapsUrl(c.googleMapsUrl || '');
    setObservacoes(c.observacoes || '');
    setIsCasaDeEventos(!!c.isCasaDeEventos);
    setTabelaPreco(c.tabelaPreco || 'padrao');
    setModalAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) return;

    const cliente: Cliente = {
      id: clienteEmEdicao ? clienteEmEdicao.id : `cli-${Date.now()}`,
      nome: nome.trim(),
      telefone: telefone.trim(),
      endereco: endereco.trim(),
      googleMapsUrl: googleMapsUrl.trim(),
      observacoes: observacoes.trim(),
      isCasaDeEventos,
      tabelaPreco,
    };

    onSaveCliente(cliente);
    setModalAberto(false);
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca) ||
      c.endereco.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Barra de Topo com Busca e Botão Novo */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#8E6554]" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white pl-9 pr-4 py-2.5 rounded-xl border border-[#D8CABE] text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
          />
        </div>

        <button
          onClick={abrirNovo}
          className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white font-bold text-sm shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Grid de Clientes com foco Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clientesFiltrados.map((cliente) => (
          <div
            key={cliente.id}
            className="bg-white rounded-2xl p-4 border border-[#E8E2D9] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-base text-[#2C2420] flex items-center gap-1.5">
                    {cliente.isCasaDeEventos && (
                      <span className="p-1 rounded-md bg-[#FAF7F2] text-[#6E473B] border border-[#E8E2D9]">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {cliente.nome}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-[#8E6554] font-medium mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{cliente.telefone}</span>
                  </div>
                  {cliente.tabelaPreco === 'parque' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 mt-1">
                      🎡 Tabela Especial: Parque Temático
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => abrirEdicao(cliente)}
                    className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#6E473B] transition-colors"
                    title="Editar dados do cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir cliente "${cliente.nome}"?`)) {
                        onDeleteCliente(cliente.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Excluir cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Endereço e Rota do Maps */}
              <div className="text-xs text-[#57372D] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9] space-y-1.5 mb-2">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C68A4C] mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{cliente.endereco || 'Endereço não informado'}</span>
                </div>

                {/* BOTÃO DO MAPS / WAZE (REQUISITO EXPLÍCITO) */}
                {cliente.googleMapsUrl && (
                  <a
                    href={cliente.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Navigation className="w-3 h-3 text-emerald-600" />
                    <span>Abrir rota no Google Maps / GPS</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {cliente.observacoes && (
                <p className="text-[11px] text-[#8E6554] italic">
                  Obs: {cliente.observacoes}
                </p>
              )}
            </div>

            {/* Rodapé com botão de WhatsApp rápido e Extrato Quinzenal */}
            <div className="pt-3 mt-2 border-t border-[#F2EDE4] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onOpenRelatorio?.(cliente)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6E473B] hover:text-[#4A3026] bg-[#FAF7F2] hover:bg-[#E8E2D9] px-2.5 py-1.5 rounded-lg border border-[#D8CABE] transition-colors"
                title="Ver extrato e faturamento quinzenal para cobrança"
              >
                <Receipt className="w-3.5 h-3.5 text-[#C68A4C]" />
                <span>Extrato Quinzenal</span>
              </button>

              <a
                href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <span>Chamar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE CLIENTE */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#6E473B]/20">
            <div className="bg-[#6E473B] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {clienteEmEdicao ? 'Alterar Cadastro de Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="p-1 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Nome do Cliente / Casa de Eventos *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Espaço Villa Nobre ou Mariana Festas"
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6E473B] mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isCasa"
                    checked={isCasaDeEventos}
                    onChange={(e) => setIsCasaDeEventos(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6E473B] focus:ring-[#6E473B]"
                  />
                  <label htmlFor="isCasa" className="text-xs font-bold text-[#4A3026] cursor-pointer">
                    É Casa de Eventos / Buffet?
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Endereço de Entrega
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, complemento, bairro"
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              {/* CAMPO ESPECÍFICO DE LOCALIZAÇÃO DO MAPS */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  Link de Localização do WhatsApp / Google Maps
                </label>
                <p className="text-[11px] text-emerald-800 mb-1.5">
                  Quando o cliente envia a localização pelo WhatsApp, cole o link aqui para traçar a rota com 1 clique!
                </p>
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="Ex: https://maps.app.goo.gl/... ou https://maps.google.com/?q=..."
                  className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* TABELA DE PREÇO DIFERENCIADA */}
              <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-700" />
                  Tabela de Preço do Cliente
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setTabelaPreco('padrao')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all ${
                      tabelaPreco === 'padrao'
                        ? 'bg-white border-[#6E473B] text-[#6E473B] shadow-xs ring-2 ring-[#6E473B]/20'
                        : 'bg-[#FAF7F2] border-amber-200 text-amber-900/70'
                    }`}
                  >
                    <span>Tabela Padrão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabelaPreco('parque')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all ${
                      tabelaPreco === 'parque'
                        ? 'bg-white border-amber-600 text-amber-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'bg-[#FAF7F2] border-amber-200 text-amber-900/70'
                    }`}
                  >
                    <span>🎡 Parque Temático</span>
                  </button>
                </div>
                <p className="text-[10px] text-amber-800 mt-1.5 leading-snug">
                  Ao marcar como Parque Temático, os pedidos desse cliente puxarão automaticamente os preços diferenciados configurados no Cardápio!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Observações (Ex: portaria lateral, melhor horário)
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Detalhes para facilitar entregas futuras..."
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/2 py-3 rounded-xl border-2 border-[#D8CABE] text-[#6E473B] font-bold text-sm hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Salvar Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
