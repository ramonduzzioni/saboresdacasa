import { Cliente, ItemPedido, Produto } from '@/types';
import { getPrecoProdutoParaCliente } from './storage';

const STORAGE_KEY = 'sabores_gemini_api_key_v1';
const DEFAULT_KEY_B64 = 'QVEuQWI4Uk42SVY1SzAyRnJiekR0ZTgza0JpYVZvcUUxdmVybDBMQldDYlZrWHVhRWJ5bVE=';

export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const salva = localStorage.getItem(STORAGE_KEY);
    if (salva && salva.trim()) return salva.trim();
  }
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(DEFAULT_KEY_B64);
    }
    return Buffer.from(DEFAULT_KEY_B64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(novaChave: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, novaChave.trim());
  }
}

export interface GeminiParsedOrder {
  clienteId?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  clienteEndereco?: string;
  dataHoraEntrega?: string;
  tipoEntrega: 'entrega' | 'retirada';
  tipoCobranca?: 'padrao_50' | 'quinzenal';
  itens: {
    produtoId: string;
    nomeProduto: string;
    quantidade: number;
    observacao?: string;
  }[];
  observacoes: string;
}

export async function parseWhatsAppOrderWithGemini(
  textoWhatsApp: string,
  produtos: Produto[],
  clientes: Cliente[]
): Promise<GeminiParsedOrder> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Chave do Gemini não configurada.');
  }

  const prompt = `Você é o assistente inteligente da confeitaria "Sabores da Casa" (doces e salgados artesanais).
Sua missão é ler uma mensagem de WhatsApp copiada de um cliente (que pode ser informal, com gírias, erros de digitação ou áudio transcrito) e extrair os dados estruturados do pedido com máxima precisão.

CARDÁPIO ATUAL DE PRODUTOS DISPONÍVEIS:
${produtos.map((p) => `- ID: "${p.id}", Nome: "${p.nome}", Unidade: "${p.tipoUnidade}", Preço Padrão: R$ ${p.precoBase.toFixed(2)}${p.precoParque ? `, Preço Parque: R$ ${p.precoParque.toFixed(2)}` : ''}`).join('\n')}

CLIENTES CADASTRADOS:
${clientes.map((c) => `- ID: "${c.id}", Nome: "${c.nome}", Tel: "${c.telefone}", Endereço: "${c.endereco}", Tabela: "${c.tabelaPreco || 'padrao'}"`).join('\n')}

DATA ATUAL DE REFERÊNCIA: ${new Date().toISOString()} (Ano atual: 2026).
Se o cliente disser "amanhã", calcule a data a partir de hoje. Se disser "sábado", use o próximo sábado. Se não especificar ano, use 2026.

MENSAGEM DO WHATSAPP A SER ANALISADA:
"""
${textoWhatsApp}
"""

INSTRUÇÕES OBRIGATÓRIAS:
1. Identifique o cliente: Se mencionar o nome de um cliente cadastrado (ou Parque Temático, Toca do Urso, Villa Nobre, etc.), use o ID correspondente.
2. IMPORTANTE SOBRE FORMA DE PAGAMENTO: O cliente principal "Parque Temático Toca do Urso" (ou "A Toca do Urso") paga QUINZENALMENTE (tipoCobranca = "quinzenal"). NUNCA cobre sinal de 50% da Toca do Urso! Para os demais clientes comuns, tipoCobranca = "padrao_50".
3. Mapeie cada item pedido para o produto correspondente do cardápio pelo ID correto.
4. Extraia as quantidades exatas por unidade.
5. Extraia data e hora de entrega no formato ISO 8601 (ex: "2026-11-03T18:00:00.000Z"). Se não houver horário, assuma 17:00.
6. Identifique se é "entrega" ou "retirada" (padrão é entrega).
7. Extraia observações (ex: "fritar bem quentinho", "portaria lateral", "massa sem cebola").

RESPONDA EXCLUSIVAMENTE COM UM OBJETO JSON VÁLIDO no seguinte formato (sem markdown, sem texto antes ou depois):
{
  "clienteId": "ID do cliente encontrado ou null",
  "clienteNome": "Nome do cliente",
  "clienteTelefone": "Telefone se mencionado",
  "clienteEndereco": "Endereço se mencionado",
  "dataHoraEntrega": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "tipoEntrega": "entrega" ou "retirada",
  "tipoCobranca": "quinzenal" ou "padrao_50",
  "itens": [
    {
      "produtoId": "ID do produto do cardápio",
      "nomeProduto": "Nome do produto",
      "quantidade": 100,
      "observacao": "detalhe se houver"
    }
  ],
  "observacoes": "observações gerais da entrega/preparo"
}`;

  // Tenta modelos rápidos do Gemini com fallback
  const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.replace(/```json/gi, '').replace(/```/g, '').trim());
          return parsed as GeminiParsedOrder;
        }
      }
    } catch (err) {
      console.warn(`Tentativa com ${model} falhou:`, err);
    }
  }

  throw new Error('Não foi possível obter resposta dos modelos Gemini.');
}
