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

  // Form State
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProduto>('salgados');
  const [tipoUnidade, setTipoUnidade] = useState<TipoUnidade>('cento');
  const [precoBase, setPrecoBase] = useState('');
  const [descricao, setDescricao] = useState('');

  const abrirNovo = () => {
    setProdutoEmEdicao(null);
    setNome('');
    setCategoria('salgados');
    setTipoUnidade('cento');
    setPrecoBase('');
    setDescricao('');
    setModalAberto(true);
  };

  const abrirEdicao = (p: Produto) => {
    setProdutoEmEdicao(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setTipoUnidade(p.tipoUnidade);
    setPrecoBase(p.precoBase.toString());
    setDescricao(p.descricao || '');
    setModalAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !precoBase) return;

    const produto: Produto = {
      id: produtoEmEdicao ? produtoEmEdicao.id : `prod-${Date.now()}`,
      nome: nome.trim(),
      categoria,
      tipoUnidade,
      precoBase: parseFloat(precoBase),
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
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${prod.nome}"?`)) onDeleteProduto(prod.id);
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Excluir produto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {prod.descricao && (
                <p className="text-xs text-[#57372D] line-clamp-2 mb-3">
                  {prod.descricao}
                </p>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-[#F2EDE4]">
              <span className="text-xs text-[#8E6554]">Preço de tabela:</span>
              <span className="text-lg font-extrabold text-[#6E473B]">
                R$ {prod.precoBase.toFixed(2)}{' '}
                <span className="text-xs font-normal text-[#8E6554]">/{prod.tipoUnidade}</span>
              </span>
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
                    <option value="cento">Cento (100 un)</option>
                    <option value="unidade">Unidade</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="porcao">Porção</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Preço Base (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={precoBase}
                  onChange={(e) => setPrecoBase(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] font-bold focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
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
