import { Category, PaymentMethod, ExpenseScope, BudgetGroup, SplitMethod } from '../types';
import { toCents } from './money';

export interface ParsedTransactionDraft {
  type: 'expense' | 'income';
  amount: number; // in cents
  description: string;
  establishment?: string;
  categoryId: string;
  budgetGroup: BudgetGroup;
  scope: ExpenseScope;
  paymentMethod: PaymentMethod;
  splitMethod: SplitMethod;
  confidence: number;
}

/**
 * Intelligent parser for Natural Language & Fast Quick Entry in PT-BR.
 * Examples:
 * - "Gastei 42 reais no mercado no débito"
 * - "R$ 42,90 Mercado Débito Casa"
 * - "Paguei 180 de internet para a casa"
 * - "Enel 165,50"
 */
export function parseNaturalLanguageInput(
  rawText: string,
  categories: Category[],
  defaultMemberIncomeProportions: SplitMethod = 'proportional_income'
): ParsedTransactionDraft {
  const text = rawText.trim().toLowerCase();

  // 1. Detect Amount
  let amountCents = 0;
  // Match "r$ 42,90" or "42,90" or "42 reais" or "180 de" or "180"
  const currencyMatch = text.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|conto)?/i);
  if (currencyMatch && currencyMatch[1]) {
    const rawNum = currencyMatch[1].replace(',', '.');
    const num = parseFloat(rawNum);
    if (!isNaN(num) && num > 0) {
      amountCents = toCents(num);
    }
  }

  // 2. Detect Payment Method
  let paymentMethod: PaymentMethod = 'pix';
  if (text.includes('crédito') || text.includes('credito') || text.includes('cartao de credito')) {
    paymentMethod = 'credit_card';
  } else if (text.includes('débito') || text.includes('debito')) {
    paymentMethod = 'debit_card';
  } else if (text.includes('pix')) {
    paymentMethod = 'pix';
  } else if (text.includes('boleto')) {
    paymentMethod = 'boleto';
  } else if (text.includes('dinheiro') || text.includes('especie')) {
    paymentMethod = 'cash';
  }

  // 3. Detect Scope (Personal vs House / Shared)
  let scope: ExpenseScope = 'house';
  if (text.includes('pessoal') || text.includes('só meu') || text.includes('so meu') || text.includes('individual')) {
    scope = 'personal';
  } else if (text.includes('casa') || text.includes('compartilhad') || text.includes('coletiv') || text.includes('nosso')) {
    scope = 'house';
  }

  // 4. Detect Category & Budget Group by Keywords & Merchant History
  let matchedCategoryId = categories[0]?.id || 'cat_supermarket';
  let matchedBudgetGroup: BudgetGroup = 'needs';
  let establishment = '';
  let description = rawText;

  const keywordMap: Record<string, { catId: string; group: BudgetGroup; est?: string }> = {
    'mercado': { catId: 'cat_supermarket', group: 'needs', est: 'Supermercado' },
    'supermercado': { catId: 'cat_supermarket', group: 'needs', est: 'Supermercado' },
    'pão de açúcar': { catId: 'cat_supermarket', group: 'needs', est: 'Pão de Açúcar' },
    'carrefour': { catId: 'cat_supermarket', group: 'needs', est: 'Carrefour' },
    'enel': { catId: 'cat_utilities', group: 'needs', est: 'Enel Energia' },
    'luz': { catId: 'cat_utilities', group: 'needs', est: 'Companhia Elétrica' },
    'energia': { catId: 'cat_utilities', group: 'needs', est: 'Energia Elétrica' },
    'sabesp': { catId: 'cat_utilities', group: 'needs', est: 'Sabesp Água' },
    'água': { catId: 'cat_utilities', group: 'needs', est: 'Água e Saneamento' },
    'internet': { catId: 'cat_internet', group: 'needs', est: 'Provedor Internet' },
    'claro': { catId: 'cat_internet', group: 'needs', est: 'Claro' },
    'vivo': { catId: 'cat_internet', group: 'needs', est: 'Vivo Fibra' },
    'aluguel': { catId: 'cat_housing', group: 'needs', est: 'Imobiliária / Proprietário' },
    'condomínio': { catId: 'cat_housing', group: 'needs', est: 'Administradora Condomínio' },
    'farmácia': { catId: 'cat_health', group: 'needs', est: 'Farmácia' },
    'droga raia': { catId: 'cat_health', group: 'needs', est: 'Droga Raia' },
    'remédio': { catId: 'cat_health', group: 'needs', est: 'Farmácia' },
    'ifood': { catId: 'cat_restaurant', group: 'wants', est: 'iFood' },
    'restaurante': { catId: 'cat_restaurant', group: 'wants', est: 'Restaurante' },
    'lanche': { catId: 'cat_restaurant', group: 'wants', est: 'Lanchonete' },
    'pizza': { catId: 'cat_restaurant', group: 'wants', est: 'Pizzaria' },
    'uber': { catId: 'cat_transport', group: 'needs', est: 'Uber' },
    'gasolina': { catId: 'cat_transport', group: 'needs', est: 'Posto de Combustível' },
    'posto': { catId: 'cat_transport', group: 'needs', est: 'Posto de Combustível' },
    'cinema': { catId: 'cat_entertainment', group: 'wants', est: 'Cinema' },
    'netflix': { catId: 'cat_streaming', group: 'wants', est: 'Netflix' },
    'spotify': { catId: 'cat_streaming', group: 'wants', est: 'Spotify' },
  };

  for (const [key, mapping] of Object.entries(keywordMap)) {
    if (text.includes(key)) {
      matchedCategoryId = mapping.catId;
      matchedBudgetGroup = mapping.group;
      if (mapping.est) establishment = mapping.est;
      break;
    }
  }

  // Find actual Category in registered categories if ID exists
  const existingCat = categories.find(c => c.id === matchedCategoryId);
  if (existingCat) {
    matchedBudgetGroup = existingCat.budgetGroup;
    if (!description || description === rawText) {
      description = establishment || existingCat.name;
    }
  }

  // Split Method: if house, use default proportional income unless specific category defaults
  const splitMethod: SplitMethod = scope === 'personal' ? 'selected_members' : defaultMemberIncomeProportions;

  return {
    type: 'expense',
    amount: amountCents,
    description: establishment || description || 'Nova Despesa',
    establishment: establishment || undefined,
    categoryId: matchedCategoryId,
    budgetGroup: matchedBudgetGroup,
    scope,
    paymentMethod,
    splitMethod,
    confidence: amountCents > 0 ? 0.95 : 0.6,
  };
}
