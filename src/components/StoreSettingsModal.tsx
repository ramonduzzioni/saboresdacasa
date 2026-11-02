'use client';

import React, { useState } from 'react';
import { ConfiguracaoLoja } from '@/types';
import { Settings, Check, X, Upload, Store } from 'lucide-react';

interface StoreSettingsModalProps {
  config: ConfiguracaoLoja;
  isOpen: boolean;
  onClose: () => void;
  onSave: (novaConfig: ConfiguracaoLoja) => void;
}

export function StoreSettingsModal({ config, isOpen, onClose, onSave }: StoreSettingsModalProps) {
  const [dados, setDados] = useState<ConfiguracaoLoja>({ ...config });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(dados);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="bg-[#FAF7F2] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#6E473B]/20">
        <div className="bg-[#6E473B] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#E6C285]" />
            <h3 className="font-bold text-base">Configurações da Confeitaria & PDF</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-[#6E473B] mb-1">
              Nome da Confeitaria (Cabeçalho do PDF)
            </label>
            <input
              type="text"
              required
              value={dados.nome}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] font-bold focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E473B] mb-1">
              Subtítulo / Slogan
            </label>
            <input
              type="text"
              value={dados.subtitulo}
              onChange={(e) => setDados({ ...dados, subtitulo: e.target.value })}
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6E473B] mb-1">
                Telefone / WhatsApp (Rodapé do PDF)
              </label>
              <input
                type="text"
                required
                value={dados.telefone}
                onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
                className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E473B] mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={dados.instagram}
                onChange={(e) => setDados({ ...dados, instagram: e.target.value })}
                placeholder="@seunome.doces"
                className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6E473B] mb-1">
                Chave Pix (Para receber o sinal de 50%)
              </label>
              <input
                type="text"
                required
                value={dados.chavePix}
                onChange={(e) => setDados({ ...dados, chavePix: e.target.value })}
                className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] font-bold focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E473B] mb-1">
                Nome do Titular da Chave Pix
              </label>
              <input
                type="text"
                required
                value={dados.titularPix}
                onChange={(e) => setDados({ ...dados, titularPix: e.target.value })}
                className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E473B] mb-1">
              Cidade & Estado (Ex: São Paulo - SP)
            </label>
            <input
              type="text"
              value={dados.cidade}
              onChange={(e) => setDados({ ...dados, cidade: e.target.value })}
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-sm text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E473B] mb-1">
              Termos e Condições Padrão do PDF
            </label>
            <textarea
              rows={2}
              value={dados.termoCondicoesPadrao}
              onChange={(e) => setDados({ ...dados, termoCondicoesPadrao: e.target.value })}
              className="w-full bg-white border border-[#D8CABE] rounded-xl p-2.5 text-xs text-[#2C2420] focus:ring-2 focus:ring-[#6E473B] focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-xl border-2 border-[#D8CABE] text-[#6E473B] font-bold text-sm hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 rounded-xl bg-[#6E473B] hover:bg-[#57372D] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Dados</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
