'use client';

import React, { useState } from 'react';
import { CategoriaProduto, Produto, TipoUnidade } from '@/types';
import { Plus, Edit2, Trash2, Tag, Check, X, Search, UtensilsCrossed } from 'lucide-react';

interface ProductsManagerProps {
  produtos: Produto[];
  onSaveProduto: (produto: Produto) => void;
  onDeleteProduto: (id: string) => void;
}

export function ProductsManager({ produtos, onSaveProduto, onDeleteProduto }: ProductsManagerProps) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);
  const [produtoIdConfirmando, setProdutoIdConfirmando] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProduto>('salgados');
  const [tipoUnidade, setTipoUnidade] = useState<TipoUnidade>('unidade');
  const [precoBase, setPrecoBase] = useState('');
  const [precoParque, setPrecoParque] = useState('');
  const [descricao, setDescricao] = useState('');

  const abrirNovo = () => {
    setProdutoEmEdicao(null);
    setNome('');
    setCategoria('salgados');
    setTipoUnidade('unidade');
    setPrecoBase('');
    setPrecoParque('');
    setDescricao('');
    setModalAberto(true);
  };

  const abrirEdicao = (p: Produto) => {
    setProdutoEmEdicao(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setTipoUnidade(p.tipoUnidade);
    setPrecoBase(typeof p.precoBase === 'number' ? p.precoBase.toString() : '');
    setPrecoParque(typeof p.precoParque === 'number' && p.precoParque > 0 ? p.precoParque.toString() : '');
    setDescricao(p.descricao || '');
    setModalAberto(true);
  };

  const parseValor = (val: string): number => {
    if (!val) return 0;
    const limpo = val.toString().replace(',', '.').trim();
    const n = parseFloat(limpo);
    return isNaN(n) ? 0 : n;
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const precoBaseNum = parseValor(precoBase);
    if (!nome.trim() || precoBaseNum <= 0) {
      alert('Informe o nome do produto e um preço padrão válido!');
      return;
    }

    const precoParqueTrim = precoParque ? precoParque.toString().trim() : '';
    const precoParqueNum = precoParqueTrim !== '' ? parseValor(precoParqueTrim) : undefined;

    const produto: Produto = {
      id: produtoEmEdicao ? produtoEmEdicao.id : `prod-${Date.now()}`,
      nome: nome.trim(),
      categoria,
      tipoUnidade,
      precoBase: precoBaseNum,
      precoParque: precoParqueNum !== undefined && precoParqueNum > 0 ? precoParqueNum : undefined,
      descricao: descricao.trim(),
      ativo: true,
    };

    onSaveProduto(produto);
    setModalAberto(false);
  };

  const produtosFiltrados = produtos.filter((p) => {
    const matchCat = categoriaAtiva === 'todos' || p.categoria === categoriaAtiva;
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  return (
    <div className="space-y-4">
      {/* Filtros por Categoria e Botão Novo */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Pills de Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'salgados', label: 'Salgados' },
            { id: 'doces', label: 'Doces' },
            { id: 'bolos', label: 'Bolos' },
            { id: 'tortas', label: 'Tortas' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoriaAtiva === cat.id
                  ? 'bg-[#6E473B] text-white shadow-xs'
                  : 'bg-white text-[#6E473B] hover:bg-[#FAF7F2] border border-[#E8E2D9]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={abrirNovo}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white font-bold text-sm shadow-sm active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {produtosFiltrados.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-2xl p-4 border border-[#E8E2D9] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C68A4C] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8E2D9]">
                    {prod.categoria} • por {prod.tipoUnidade}
                  </span>
                  <h3 className="font-bold text-base text-[#2C2420] mt-1 line-clamp-1">
                    {prod.nome}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => abrirEdicao(prod)}
                    className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#6E473B] transition-colors"
                    title="Editar produto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {produtoIdConfirmando === prod.id ? (
                    <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProduto(prod.id);
                          setProdutoIdConfirmando(null);
                        }}
                        className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdutoIdConfirmando(null)}
                        className="p-0.5 text-neutral-500 hover:text-neutral-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setProdutoIdConfirmando(prod.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {prod.descricao && (
                <p className="text-xs text-[#57372D] line-clamp-2 mb-3">
                  {prod.descricao}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[#F2EDE4] space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#8E6554]">Preço Padrão:</span>
                <span className="text-base font-extrabold text-[#6E473B]">
                  R$ {prod.precoBase.toFixed(2)}{' '}
                  <span className="text-[11px] font-normal text-[#8E6554]">/{prod.tipoUnidade}</span>
                </span>
              </div>

              {typeof prod.precoParque === 'number' && prod.precoParque > 0 ? (
                <div className="flex items-baseline justify-between bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    🎡 Parque Temático:
                  </span>
                  <span className="text-sm font-black text-amber-800">
                    R$ {prod.precoParque.toFixed(2)}{' '}
                    <span className="text-[10px] font-normal text-amber-900">/{prod.tipoUnidade}</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => abrirEdicao(prod)}
                  className="w-full text-left flex items-center justify-between text-[11px] text-amber-900 bg-amber-50/60 hover:bg-amber-100/70 px-2 py-1 rounded-lg border border-dashed border-amber-300 transition-colors"
                >
                  <span className="font-semibold">🎡 + Preço Parque Temático</span>
                  <span className="text-[10px] font-bold underline">Definir</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE PRODUTO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#6E473B]/20">
            <div className="bg-[#6E473B] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {produtoEmEdicao ? 'Alterar Cadastro de Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="p-1 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Cento de Coxinha Especial"
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6E473B] mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaProduto)}
                    className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                  >
                    <option value="salgados">Salgados</option>
                    <option value="doces">Doces</option>
                    <option value="bolos">Bolos</option>
                    <option value="tortas">Tortas</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6E473B] mb-1">
                    Vendido por
                  </label>
                  <select
                    value={tipoUnidade}
                    onChange={(e) => setTipoUnidade(e.target.value as TipoUnidade)}
                    className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                  >
                    <option value="unidade">Unidade (un)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="cento">Cento (100 un)</option>
                    <option value="porcao">Porção</option>
                  </select>
                </div>
              </div>

              {/* Preços: Padrão e Especial Parque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6E473B] mb-1">
                    Preço Padrão (R$) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={precoBase}
                    onChange={(e) => setPrecoBase(e.target.value)}
                    placeholder="Ex: 0,95 ou 85,00"
                    className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] font-bold focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[#8E6554] block mt-0.5">
                    Aceita vírgula ou ponto (ex: 0,95)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">🎡 Preço Parque Temático (R$)</span>
                    {precoParque && (
                      <button
                        type="button"
                        onClick={() => setPrecoParque('')}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Limpar
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={precoParque}
                    onChange={(e) => setPrecoParque(e.target.value)}
                    placeholder="Ex: 0,85 ou 78,00"
                    className="w-full bg-amber-50/70 border border-amber-300 rounded-xl p-2.5 text-sm text-[#2C2420] font-bold focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[#8E6554] block mt-0.5">
                    Se preenchido, será usado na Toca do Urso
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Descrição / Ingredientes Especiais
                </label>
                <textarea
                  rows={2}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes que podem sair no orçamento..."
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              {produtoEmEdicao && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteProduto(produtoEmEdicao.id);
                      setModalAberto(false);
                    }}
                    className="w-full py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir este Produto Definitivamente</span>
                  </button>
                </div>
              )}

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
                  <span>Salvar Produto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
