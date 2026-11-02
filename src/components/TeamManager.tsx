'use client';

import React, { useState } from 'react';
import { PapelUsuario, UsuarioPermitido } from '@/types';
import { Users, UserPlus, Shield, ShieldCheck, Trash2, Check, X, Crown, ChefHat, Mail } from 'lucide-react';

interface TeamManagerProps {
  usuarios: UsuarioPermitido[];
  onSaveUsuario: (usuario: UsuarioPermitido) => void;
  onDeleteUsuario: (id: string) => void;
}

export function TeamManager({ usuarios, onSaveUsuario, onDeleteUsuario }: TeamManagerProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<PapelUsuario>('atendente');

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nome.trim()) return;

    const novoUsuario: UsuarioPermitido = {
      id: `user-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      papel,
      ativo: true,
      adicionadoEm: new Date().toISOString(),
    };

    onSaveUsuario(novoUsuario);
    setNome('');
    setEmail('');
    setPapel('atendente');
    setModalAberto(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho da Equipe */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#6E473B] border border-[#E8E2D9]">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2C2420]">
                Controle de Acessos & Equipe
              </h2>
              <p className="text-xs text-[#8E6554]">
                Apenas contas Google cadastradas nesta lista conseguem entrar no sistema
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 py-3 px-5 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white font-bold text-sm shadow-sm active:scale-95 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Autorizar Nova Conta Google</span>
        </button>
      </div>

      {/* Explicação dos Perfis de Acesso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs text-[#4A3026]">
          <div className="flex items-center gap-2 font-extrabold text-amber-900 mb-1.5">
            <Crown className="w-4 h-4 text-amber-700" />
            <span>Perfil: Proprietária (Acesso Total)</span>
          </div>
          <p className="text-[#57372D] leading-relaxed">
            Acesso irrestrito a todo o sistema: Pedidos, Clientes, <strong>Painel Financeiro com Gráficos de Lucro</strong>, Chaves Pix e Administração de Usuários.
          </p>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs text-[#2C2420]">
          <div className="flex items-center gap-2 font-extrabold text-emerald-900 mb-1.5">
            <ChefHat className="w-4 h-4 text-emerald-700" />
            <span>Perfil: Atendimento & Produção</span>
          </div>
          <p className="text-[#57372D] leading-relaxed">
            Perfeito para funcionários: podem ver agenda, lançar pedidos, importar do WhatsApp e gerar PDF, mas <strong>NÃO veem a aba financeira nem faturamento</strong>.
          </p>
        </div>
      </div>

      {/* Lista de Usuários Autorizados */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F2EDE4] font-bold text-sm text-[#2C2420] flex items-center justify-between">
          <span>Membros com Acesso Autorizado ({usuarios.length})</span>
          <span className="text-xs text-[#8E6554] font-normal">Google OAuth Whitelist</span>
        </div>

        <div className="divide-y divide-[#F2EDE4]">
          {usuarios.map((u) => {
            const isAdmin = u.papel === 'admin';
            return (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#FAF7F2]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs ${
                      isAdmin ? 'bg-gradient-to-br from-amber-600 to-amber-800' : 'bg-[#6E473B]'
                    }`}
                  >
                    {isAdmin ? <Crown className="w-5 h-5 text-amber-200" /> : <ChefHat className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#2C2420]">{u.nome}</h4>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {isAdmin ? 'Proprietária (Admin)' : 'Atendimento / Cozinha'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8E6554] mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{u.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {usuarios.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Revogar o acesso de "${u.nome}" (${u.email})?`)) {
                          onDeleteUsuario(u.id);
                        }
                      }}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                      title="Revogar acesso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revogar Acesso</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL PARA AUTORIZAR NOVA CONTA GOOGLE */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#6E473B]/20">
            <div className="bg-[#6E473B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#E6C285]" />
                <h3 className="font-bold text-base">Autorizar Conta Google</h3>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-1 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Nome da Pessoa *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carla (Confeiteira) ou Marcos (Balcão)"
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  E-mail Google (@gmail.com) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
                <p className="text-[11px] text-[#8E6554] mt-1">
                  A pessoa usará este e-mail para clicar no botão "Continuar com o Google".
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E473B] mb-1">
                  Nível de Permissão
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPapel('atendente')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      papel === 'atendente'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-[#D8CABE] text-[#2C2420]'
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1">
                      <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
                      Atendimento
                    </span>
                    <span className="text-[10px] text-neutral-500 leading-tight">
                      Pedidos e clientes. Oculta o financeiro.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPapel('admin')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      papel === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                        : 'bg-white border-[#D8CABE] text-[#2C2420]'
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-700" />
                      Proprietária
                    </span>
                    <span className="text-[10px] text-neutral-500 leading-tight">
                      Acesso total, financeiro e usuários.
                    </span>
                  </button>
                </div>
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
                  <span>Autorizar Acesso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
