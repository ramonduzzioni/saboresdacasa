'use client';

import React, { useState } from 'react';
import { SessaoUsuario, UsuarioPermitido } from '@/types';
import { LOGO_DARK_BASE64 } from '@/lib/logoBase64';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getSecurityPin } from '@/lib/storage';
import {
  ShieldCheck,
  AlertCircle,
  Lock,
  KeyRound,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface LoginScreenProps {
  usuariosAutorizados: UsuarioPermitido[];
  onLoginSuccess: (sessao: SessaoUsuario) => void;
  erroExterno?: string | null;
}

export function LoginScreen({
  usuariosAutorizados,
  onLoginSuccess,
  erroExterno,
}: LoginScreenProps) {
  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioPermitido | null>(null);
  const [erro, setErro] = useState<string | null>(erroExterno || null);
  const [carregandoOAuth, setCarregandoOAuth] = useState(false);
  const [modoDigitarEmail, setModoDigitarEmail] = useState(false);

  // Tentativa de login via Google OAuth do Supabase
  const handleLoginGoogleOAuth = async () => {
    setErro(null);
    setCarregandoOAuth(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });

        if (error) {
          console.warn('Erro OAuth Google Supabase:', error.message);
          setErro(
            `Aviso: Para login direto com a janela do Google, ative o provedor Google no painel Supabase (Auth > Providers > Google). Enquanto isso, entre selecionando sua conta autorizada abaixo.`
          );
        }
      } else {
        setErro('Supabase não conectado. Utilize o acesso direto com a conta autorizada abaixo.');
      }
    } catch (err: any) {
      setErro(`Erro ao conectar com Google: ${err?.message || 'Falha na conexão'}`);
    } finally {
      setCarregandoOAuth(false);
    }
  };

  // Validação estrita de e-mail e PIN de segurança
  const handleConfirmarAcesso = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const emailAlvo = (usuarioSelecionado?.email || emailInput).trim().toLowerCase();
    if (!emailAlvo) {
      setErro('Por favor, informe um e-mail válido.');
      return;
    }

    // 1. VERIFICAÇÃO ESTRITA DA LISTA BRANCA (WHITELIST)
    const usuario = usuariosAutorizados.find(
      (u) => u.email.trim().toLowerCase() === emailAlvo && u.ativo
    );

    if (!usuario) {
      setErro(
        `⛔ Acesso Negado: O e-mail "${emailAlvo}" NÃO está autorizado no Sabores da Casa. Apenas as contas cadastradas (rduzzioni@gmail.com e dduzzioni@gmail.com) têm permissão de acesso.`
      );
      setPinInput('');
      return;
    }

    // 2. VERIFICAÇÃO DO PIN DE SEGURANÇA
    const pinCorreto = getSecurityPin();
    if (pinInput.trim() !== pinCorreto) {
      setErro('🔒 PIN de segurança incorreto. Digite o código de 4 dígitos da confeitaria.');
      return;
    }

    // ACESSO AUTORIZADO
    const sessao: SessaoUsuario = {
      email: usuario.email,
      nome: usuario.nome,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      papel: usuario.papel,
    };
    onLoginSuccess(sessao);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      {/* Decoração sutil de fundo estilo marca d'água */}
      <div className="fixed -bottom-20 -right-20 w-96 h-96 opacity-[0.04] pointer-events-none select-none">
        <svg viewBox="0 0 100 100" fill="#6E473B">
          <path d="M50 0 C60 30, 90 40, 100 50 C90 60, 60 70, 50 100 C40 70, 10 60, 0 50 C10 40, 40 30, 50 0 Z" />
        </svg>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E8E2D9] p-6 sm:p-8 text-center flex flex-col items-center relative overflow-hidden animate-in fade-in duration-300">
        
        {/* Barra superior de segurança */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6E473B] via-[#C68A4C] to-[#6E473B]"></div>

        {/* LOGO OFICIAL CENTRALIZADO EM DESTAQUE */}
        <div className="mb-5 pt-1 flex flex-col items-center">
          <img
            src={LOGO_DARK_BASE64}
            alt="Sabores da Casa"
            className="h-24 sm:h-28 object-contain mx-auto transition-transform hover:scale-105 duration-200"
          />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8E6554] mt-1 font-sans">
            Doces & Salgados Artesanais
          </span>
        </div>

        {/* Título de Boas-Vindas */}
        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-[#4A3026] tracking-tight">
            Acesso Restrito
          </h2>
          <p className="text-xs text-[#57372D] mt-1 leading-relaxed max-w-xs mx-auto">
            Apenas contas Google previamente cadastradas pela proprietária têm acesso ao sistema.
          </p>
        </div>

        {/* Alerta de Erro se tentar e-mail não autorizado */}
        {(erro || erroExterno) && (
          <div className="w-full mb-4 bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 text-left text-xs text-rose-900 flex items-start gap-2.5 animate-in slide-in-from-top-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="leading-snug">
              <strong>Atenção:</strong> {erro || erroExterno}
            </div>
          </div>
        )}

        {/* BOTÃO PRINCIPAL: ENTRAR COM O GOOGLE */}
        <div className="w-full space-y-3.5">
          <button
            type="button"
            disabled={carregandoOAuth}
            onClick={handleLoginGoogleOAuth}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#F2EDE4] active:bg-[#E8DFD3] border-2 border-[#D8CABE] text-[#2C2420] font-extrabold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md active:scale-98 transition-all disabled:opacity-60"
          >
            {carregandoOAuth ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#6E473B]" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Conectar via Conta Google</span>
          </button>

          {/* Divisor Visual */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E2D9]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#8E6554] font-semibold">
                ou acesso autorizado com PIN
              </span>
            </div>
          </div>

          {/* Seleção de Contas Autorizadas */}
          <div className="text-left space-y-2">
            <label className="block text-xs font-bold text-[#6E473B]">
              Selecione sua conta autorizada:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {usuariosAutorizados.map((u) => {
                const selecionado =
                  usuarioSelecionado?.id === u.id ||
                  (!usuarioSelecionado && !modoDigitarEmail && emailInput === u.email);

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setUsuarioSelecionado(u);
                      setEmailInput(u.email);
                      setModoDigitarEmail(false);
                      setErro(null);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selecionado
                        ? 'border-[#6E473B] bg-[#FAF7F2] ring-2 ring-[#6E473B]/20 font-bold'
                        : 'border-[#E8E2D9] bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2C2420] truncate">
                        {u.nome}
                      </div>
                      <div className="text-[11px] text-[#8E6554] truncate">
                        {u.email}
                      </div>
                    </div>
                    {selecionado ? (
                      <span className="text-[11px] font-bold text-[#6E473B] bg-[#E8DFD3] px-2 py-0.5 rounded-md shrink-0">
                        Selecionada
                      </span>
                    ) : (
                      <UserCheck className="w-4 h-4 text-[#8E6554] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opção para digitar outro e-mail caso não esteja na lista inicial */}
          {modoDigitarEmail ? (
            <div className="text-left pt-1">
              <label className="block text-xs font-bold text-[#6E473B] mb-1">
                Outro e-mail Google:
              </label>
              <input
                type="email"
                placeholder="seu.email@gmail.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setUsuarioSelecionado(null);
                  setErro(null);
                }}
                className="w-full bg-[#FAF7F2] border border-[#D8CABE] rounded-xl px-3 py-2 text-xs text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setModoDigitarEmail(true);
                setUsuarioSelecionado(null);
                setEmailInput('');
              }}
              className="text-[11px] text-[#8E6554] hover:text-[#6E473B] underline text-center block mx-auto"
            >
              Digitar outro e-mail para validar
            </button>
          )}

          {/* FORMULÁRIO COM PIN DE SEGURANÇA */}
          <form onSubmit={handleConfirmarAcesso} className="space-y-3 pt-2">
            <div className="text-left">
              <label className="block text-xs font-bold text-[#6E473B] mb-1 flex items-center justify-between">
                <span>PIN de Segurança (4 dígitos):</span>
                <span className="text-[10px] text-[#8E6554] font-normal">Padrão: 2026</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CABE] rounded-xl px-3.5 py-2.5 text-center tracking-widest text-base font-bold text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
                <KeyRound className="w-4 h-4 text-[#8E6554] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#6E473B] hover:bg-[#57372D] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>Verificar Acesso & Entrar</span>
            </button>
          </form>
        </div>

        {/* Rodapé de Segurança */}
        <div className="mt-6 pt-3 border-t border-[#F2EDE4] w-full flex items-center justify-center gap-1.5 text-[11px] text-[#8E6554]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protegido: Whitelist restrita a rduzzioni e dduzzioni</span>
        </div>

      </div>
    </div>
  );
}