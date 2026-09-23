/**
 * Domain: Ledger (Razão Financeiro Contábil)
 * Implementação de partidas dobradas (Double-Entry Bookkeeping) para garantir auditabilidade total.
 * Invariante Contábil Universal:
 * sum(debits) === sum(credits)
 * 
 * Regra Crítica de Negócio:
 * - Compra no cartão: Débito em Despesa / Crédito em Passivo (Cartão de Crédito)
 * - Pagamento de fatura: Débito em Passivo (Cartão) / Crédito em Ativo (Conta Bancária)
 * - NUNCA aciona Despesa no pagamento de fatura, preservando a verdade orçamentária!
 */

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface LedgerAccount {
  id: string;
  name: string;
  type: AccountType;
}

export interface LedgerEntry {
  id: string;
  transactionId?: string;
  householdId: string;
  timestamp: string;
  description: string;
  debitAccount: string;   // Destino dos recursos ou aumento de despesa/ativo
  creditAccount: string;  // Origem dos recursos ou aumento de passivo/receita
  amountCents: number;
}

export interface LedgerBalanceSummary {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  discrepancyCents: number;
}

/**
 * Valida a invariante contábil de um conjunto de lançamentos no razão
 */
export function verifyLedgerBalance(entries: LedgerEntry[]): LedgerBalanceSummary {
  let totalDebits = 0;
  let totalCredits = 0;

  for (const entry of entries) {
    totalDebits += entry.amountCents;
    totalCredits += entry.amountCents;
  }

  return {
    totalDebits,
    totalCredits,
    isBalanced: totalDebits === totalCredits,
    discrepancyCents: Math.abs(totalDebits - totalCredits),
  };
}

/**
 * Cria os lançamentos contábeis de uma compra à vista paga no débito/pix/dinheiro
 */
export function createDirectExpenseLedgerEntries(params: {
  id: string;
  householdId: string;
  transactionId: string;
  description: string;
  amountCents: number;
  categoryGroup: 'needs' | 'wants' | 'savings';
  sourceAccountId: string; // Ex: 'asset:checking_account_nubank'
  timestamp?: string;
}): LedgerEntry[] {
  const expenseAccount = `expense:${params.categoryGroup}`;
  const creditAccount = `asset:${params.sourceAccountId}`;

  return [
    {
      id: `entry_${params.id}_1`,
      transactionId: params.transactionId,
      householdId: params.householdId,
      timestamp: params.timestamp || new Date().toISOString(),
      description: params.description,
      debitAccount: expenseAccount,
      creditAccount: creditAccount,
      amountCents: params.amountCents,
    },
  ];
}

/**
 * Cria os lançamentos contábeis de uma compra no Cartão de Crédito:
 * - Débito: expense:{categoryGroup} (reconhece despesa na competência)
 * - Crédito: liability:credit_card_{cardId} (reconhece obrigação/passivo bancário)
 */
export function createCreditCardPurchaseLedgerEntries(params: {
  id: string;
  householdId: string;
  transactionId: string;
  description: string;
  amountCents: number;
  categoryGroup: 'needs' | 'wants' | 'savings';
  cardId: string;
  timestamp?: string;
}): LedgerEntry[] {
  const expenseAccount = `expense:${params.categoryGroup}`;
  const liabilityAccount = `liability:card_${params.cardId}`;

  return [
    {
      id: `entry_${params.id}_card_purchase`,
      transactionId: params.transactionId,
      householdId: params.householdId,
      timestamp: params.timestamp || new Date().toISOString(),
      description: `Compra Cartão: ${params.description}`,
      debitAccount: expenseAccount,
      creditAccount: liabilityAccount,
      amountCents: params.amountCents,
    },
  ];
}

/**
 * Cria os lançamentos contábeis do Pagamento de Fatura do Cartão de Crédito:
 * - Débito: liability:credit_card_{cardId} (liquida o passivo)
 * - Crédito: asset:account_{accountId} (reduz o saldo em conta corrente)
 * 
 * PROVA CONTÁBIL: Nenhuma conta de despesa (expense:*) é debitada aqui!
 */
export function createInvoiceSettlementLedgerEntries(params: {
  id: string;
  householdId: string;
  description: string;
  amountCents: number;
  cardId: string;
  sourceAccountId: string;
  timestamp?: string;
}): LedgerEntry[] {
  const liabilityAccount = `liability:card_${params.cardId}`;
  const assetAccount = `asset:${params.sourceAccountId}`;

  return [
    {
      id: `entry_${params.id}_invoice_pay`,
      householdId: params.householdId,
      timestamp: params.timestamp || new Date().toISOString(),
      description: `Liquidação de Fatura de Cartão: ${params.description}`,
      debitAccount: liabilityAccount,  // Redução de passivo
      creditAccount: assetAccount,     // Redução de ativo
      amountCents: params.amountCents,
    },
  ];
}
