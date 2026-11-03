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
    produtoId?: string | null;
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
Sua missão é ler uma mensagem de WhatsApp de um cliente e extrair rigorosamente TODOS os itens pedidos, sem cortar, resumir ou esquecer nenhum item.

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

REGRAS CRÍTICAS DE EXTRAÇÃO:
1. EXTRAIA TODOS OS ITENS: Se a mensagem listar 6, 8 ou 10 sabores/produtos diferentes, você DEVE retornar exatamente todos os itens no array "itens". NUNCA limite a 3 ou 4 itens!
2. PRODUTOS NÃO CADASTRADOS: Se o cliente pedir um doce, salgado ou bolo que ainda não está no cardápio acima (ex: Casadinhos, Cajuzinhos, Napolitano, docinho personalizado, torta especial), NUNCA O DESCARTEM! Retorne o objeto com "produtoId": null e "nomeProduto" com o nome exato do produto solicitado.
3. VINCULAÇÃO DE PRODUTOS CADASTRADOS: Se o item coincidir com um produto do cardápio cadastrado (ex: "Coxinha Tradicional", "Brigadeiro"), use o "produtoId" dele.
4. OBSERVAÇÕES ESPECÍFICAS: Se o cliente colocar observações em um item (ex: "sem MMs", "fritar bem dourado"), extraia no campo "observacao" daquele item. Não insira textos automáticos como "extraído por IA".
5. CLIENTE E PAGAMENTO: Identifique o cliente. Se for "Parque Temático Toca do Urso" (ou "Toca do Urso"), tipoCobranca = "quinzenal" (faturamento quinzenal sem sinal). Para clientes comuns, tipoCobranca = "padrao_50".
6. DATA E HORA DE ENTREGA: Formato ISO 8601 (ano 2026). Se não tiver horário, assuma 17:00.

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
      "produtoId": "ID do produto do cardápio ou null se não cadastrado",
      "nomeProduto": "Nome do produto",
      "quantidade": 45,
      "observacao": "detalhe se houver"
    }
  ],
  "observacoes": "observações gerais da entrega/preparo (ou vazio)"
}`;

  // Tenta modelos rápidos do Gemini com fallback
  const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

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
