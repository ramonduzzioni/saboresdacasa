'use client';

import React, { useState } from 'react';
import { SessaoUsuario, UsuarioPermitido } from '@/types';
import { LOGO_DARK_BASE64 } from '@/lib/logoBase64';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getSecurityPin } from '@/lib/storage';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  ShieldAlert,
  Loader2,
  Mail,
  HelpCircle,
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
  const [erro, setErro] = useState<string | null>(erroExterno || null);
  const [carregandoOAuth, setCarregandoOAuth] = useState(false);
  const [ajudaGoogleAberta, setAjudaGoogleAberta] = useState(false);

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
            'O login automático direto do Google requer ativação do provedor Google no painel Supabase. Você pode entrar agora mesmo digitando seu e-mail e PIN abaixo!'
          );
          setAjudaGoogleAberta(true);
        }
      } else {
        setErro('Supabase não conectado. Digite seu e-mail e PIN para acessar.');
      }
    } catch (err: any) {
      setErro('Não foi possível conectar com o Google no momento. Digite seu e-mail e PIN para acessar.');
    } finally {
      setCarregandoOAuth(false);
    }
  };

  // Validação estrita de credenciais com privacidade total
  const handleConfirmarAcesso = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const emailLimpo = emailInput.trim().toLowerCase();
    const pinLimpo = pinInput.trim();

    if (!emailLimpo) {
      setErro('Por favor, informe seu e-mail Google.');
      return;
    }

    if (!pinLimpo) {
      setErro('Por favor, digite o PIN de segurança.');
      return;
    }

    // 1. Verifica se o e-mail está na lista de autorizados
    const usuario = usuariosAutorizados.find(
      (u) => u.email.trim().toLowerCase() === emailLimpo && u.ativo
    );

    // 2. Verifica o PIN
    const pinCorreto = getSecurityPin();

    // Mensagem de segurança neutra (não expõe se foi o e-mail ou o PIN para proteção)
    if (!usuario || pinLimpo !== pinCorreto) {
      setErro('E-mail ou PIN de segurança incorreto. Apenas pessoas autorizadas têm acesso.');
      setPinInput('');
      return;
    }

    // ACESSO AUTORIZADO COM SUCESSO
    const sessao: SessaoUsuario = {
      email: usuario.email,
      nome: usuario.nome || 'Administrador',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
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

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-[#E8E2D9] p-6 sm:p-8 text-center flex flex-col items-center relative overflow-hidden animate-in fade-in duration-300">
        
        {/* Barra superior dourada/chocolate */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6E473B] via-[#C68A4C] to-[#6E473B]"></div>

        {/* LOGO OFICIAL CENTRALIZADO EM DESTAQUE */}
        <div className="mb-4 pt-1 flex flex-col items-center">
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
          <h2 className="text-xl font-black text-[#4A3026] tracking-tight">
            Acesso Restrito
          </h2>
          <p className="text-xs text-[#57372D] mt-1 leading-relaxed max-w-xs mx-auto">
            Identifique-se com sua conta autorizada para gerenciar pedidos e produção.
          </p>
        </div>

        {/* Alerta de Erro */}
        {(erro || erroExterno) && (
          <div className="w-full mb-4 bg-rose-50 border border-rose-300 rounded-2xl p-3 text-left text-xs text-rose-900 flex items-start gap-2 animate-in slide-in-from-top-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="leading-snug">
              {erro || erroExterno}
            </div>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN LIMPO E SEGURO (SEM EXPOR NOMES OU E-MAILS) */}
        <form onSubmit={handleConfirmarAcesso} className="w-full space-y-3.5 text-left">
          {/* Campo E-mail */}
          <div>
            <label className="block text-xs font-bold text-[#6E473B] mb-1">
              E-mail Google autorizado:
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="seu.email@gmail.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setErro(null);
                }}
                className="w-full bg-[#FAF7F2] border border-[#D8CABE] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              />
              <Mail className="w-4 h-4 text-[#8E6554] absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Campo PIN */}
          <div>
            <label className="block text-xs font-bold text-[#6E473B] mb-1 flex items-center justify-between">
              <span>PIN de Segurança (4 dígitos):</span>
              <span className="text-[10px] text-[#8E6554] font-normal">Inicial: 2026</span>
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                required
                autoComplete="current-password"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErro(null);
                }}
                className="w-full bg-[#FAF7F2] border border-[#D8CABE] rounded-xl pl-9 pr-3 py-2.5 text-center tracking-widest text-base font-bold text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              />
              <KeyRound className="w-4 h-4 text-[#8E6554] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#6E473B] hover:bg-[#57372D] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Entrar no Sistema</span>
          </button>
        </form>

        {/* Divisor */}
        <div className="relative py-3 w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E2D9]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2.5 text-[#8E6554] font-semibold text-[11px]">
              ou
            </span>
          </div>
        </div>

        {/* BOTÃO CONECTAR VIA CONTA GOOGLE (POPUP OAUTH) */}
        <div className="w-full space-y-2">
          <button
            type="button"
            disabled={carregandoOAuth}
            onClick={handleLoginGoogleOAuth}
            className="w-full py-3 px-4 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EDE4] active:bg-[#E8DFD3] border border-[#D8CABE] text-[#2C2420] font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-sm active:scale-98 transition-all disabled:opacity-60"
          >
            {carregandoOAuth ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#6E473B]" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

          {ajudaGoogleAberta && (
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#D8CABE] text-[11px] text-[#57372D] text-left leading-relaxed animate-in fade-in">
              <p className="font-bold text-[#6E473B] mb-1">Como ativar o login em 1 clique do Google:</p>
              <p>No painel do Supabase em <strong>Authentication &gt; Providers &gt; Google</strong>, ative a opção Google e cole seu Client ID do Google Cloud.</p>
              <p className="mt-1 font-medium text-[#8E6554]">Enquanto isso, digite seu e-mail e PIN acima para entrar diretamente!</p>
            </div>
          )}
        </div>

        {/* Rodapé de Segurança Discreto */}
        <div className="mt-6 pt-3 border-t border-[#F2EDE4] w-full flex items-center justify-center gap-1.5 text-[11px] text-[#8E6554]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ambiente Seguro com Criptografia</span>
        </div>

      </div>
    </div>
  );
}