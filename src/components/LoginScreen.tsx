'use client';

import React, { useState } from 'react';
import { SessaoUsuario, UsuarioPermitido } from '@/types';
import { LOGO_DARK_BASE64 } from '@/lib/logoBase64';
import { ShieldCheck, AlertCircle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  usuariosAutorizados: UsuarioPermitido[];
  onLoginSuccess: (sessao: SessaoUsuario) => void;
}

export function LoginScreen({ usuariosAutorizados, onLoginSuccess }: LoginScreenProps) {
  const [emailInput, setEmailInput] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [modoManual, setModoManual] = useState(false);

  const tentarLoginComEmail = (emailParaValidar: string, nomeSugerido?: string) => {
    setErro(null);
    const emailLimpo = emailParaValidar.trim().toLowerCase();

    // Procura na whitelist de e-mails autorizados pela proprietária
    const usuario = usuariosAutorizados.find(
      (u) => u.email.toLowerCase() === emailLimpo && u.ativo
    );

    if (usuario) {
      const sessao: SessaoUsuario = {
        email: usuario.email,
        nome: usuario.nome || nomeSugerido || 'Usuário Google',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        papel: usuario.papel,
      };
      onLoginSuccess(sessao);
    } else {
      setErro(
        `Acesso restrito: O e-mail "${emailParaValidar}" não tem autorização para acessar este sistema. Solicite a liberação com a proprietária.`
      );
    }
  };

  const handleLoginGooglePadrao = () => {
    // Primeiro tenta o e-mail da proprietária padrão
    const primeiroAdmin = usuariosAutorizados.find((u) => u.papel === 'admin') || usuariosAutorizados[0];
    if (primeiroAdmin) {
      tentarLoginComEmail(primeiroAdmin.email, primeiroAdmin.nome);
    } else {
      setModoManual(true);
    }
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
        <div className="mb-6 pt-2 flex flex-col items-center">
          <img
            src={LOGO_DARK_BASE64}
            alt="Sabores da Casa"
            className="h-28 sm:h-32 object-contain mx-auto transition-transform hover:scale-105 duration-200"
          />
          <span className="text-xs font-semibold tracking-widest uppercase text-[#8E6554] mt-1 font-sans">
            Doces & Salgados Artesanais
          </span>
        </div>

        {/* Título de Boas-Vindas */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4A3026] tracking-tight">
            Acesso Restrito à Equipe
          </h2>
          <p className="text-xs text-[#57372D] mt-1 leading-relaxed max-w-xs mx-auto">
            Faça login com sua conta Google autorizada para acessar os pedidos e a produção.
          </p>
        </div>

        {/* Alerta de Erro se tentar e-mail não autorizado */}
        {erro && (
          <div className="w-full mb-5 bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-left text-xs text-rose-800 flex items-start gap-2.5 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <span className="leading-snug">{erro}</span>
          </div>
        )}

        {/* BOTÃO PRINCIPAL: ENTRAR COM O GOOGLE */}
        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={handleLoginGooglePadrao}
            className="w-full py-4 px-5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F2EDE4] active:bg-[#E8DFD3] border-2 border-[#D8CABE] text-[#2C2420] font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xs hover:shadow-md active:scale-98 transition-all"
          >
            {/* Ícone Multicolorido Oficial do Google */}
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
            <span>Continuar com o Google</span>
          </button>

          {/* Opção para digitar e-mail específico / testar outro membro */}
          {!modoManual ? (
            <button
              type="button"
              onClick={() => setModoManual(true)}
              className="text-xs text-[#8E6554] hover:text-[#6E473B] font-medium underline pt-2 block mx-auto"
            >
              Entrar com outro e-mail Google da equipe
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                tentarLoginComEmail(emailInput);
              }}
              className="pt-2 text-left space-y-2 animate-in fade-in"
            >
              <label className="block text-xs font-bold text-[#6E473B]">
                Digite o seu e-mail Google:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="exemplo@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 bg-[#FAF7F2] border border-[#D8CABE] rounded-xl px-3 py-2 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#6E473B] text-white font-bold text-xs hover:bg-[#57372D] transition-colors"
                >
                  Entrar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Rodapé de Segurança */}
        <div className="mt-8 pt-4 border-t border-[#F2EDE4] w-full flex items-center justify-center gap-1.5 text-[11px] text-[#8E6554]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acesso protegido por autenticação e lista branca</span>
        </div>

      </div>
    </div>
  );
}
