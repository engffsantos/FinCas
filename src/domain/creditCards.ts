/**
 * Domain: Credit Cards & Invoices
 * Regra Crítica: Uma compra no cartão representa despesa no momento do consumo/competência.
 * O pagamento da fatura representa liquidação de passivo bancário e restauração de limite,
 * NUNCA gerando uma nova despesa no orçamento.
 */

import { CreditCard, Transaction, Account } from '../types';

export interface CardInvoiceSummary {
  cardId: string;
  cardName: string;
  closingDate: string; // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
  currentInvoiceAmount: number; // in cents
  nextInvoicesCommitted: number; // in cents (parcelas futuras)
  totalCommitted: number;       // current + future
  availableLimit: number;       // in cents
  totalLimit: number;           // in cents
  unpaidTransactions: Transaction[];
  status: 'open' | 'closed' | 'paid';
}

/**
 * Calcula o extrato e status da fatura de um cartão de crédito para uma competência (ex: 2026-09)
 */
export function calculateCardInvoice(
  card: CreditCard,
  transactions: Transaction[],
  competenceMonth: string, // YYYY-MM
  referenceDate = new Date()
): CardInvoiceSummary {
  // Transações atreladas a este cartão
  const cardTxs = transactions.filter(
    tx => tx.creditCardId === card.id && tx.paymentMethod === 'credit_card'
  );

  let currentInvoiceAmount = 0;
  let nextInvoicesCommitted = 0;
  const unpaidTransactions: Transaction[] = [];

  for (const tx of cardTxs) {
    // Se a transação pertence ao mês de competência da fatura
    const txMonth = tx.date.substring(0, 7);
    if (txMonth === competenceMonth) {
      currentInvoiceAmount += tx.amount;
      unpaidTransactions.push(tx);
    } else if (txMonth > competenceMonth) {
      // Parcelas futuras já agendadas
      nextInvoicesCommitted += tx.amount;
    }
  }

  const totalCommitted = currentInvoiceAmount + nextInvoicesCommitted;
  const availableLimit = Math.max(0, card.creditLimit - totalCommitted);

  const [year, month] = competenceMonth.split('-').map(Number);
  const closingDate = `${year}-${String(month).padStart(2, '0')}-${String(card.closingDay).padStart(2, '0')}`;
  const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(card.dueDay).padStart(2, '0')}`;

  const isClosed = referenceDate >= new Date(closingDate);

  return {
    cardId: card.id,
    cardName: card.name,
    closingDate,
    dueDate,
    currentInvoiceAmount,
    nextInvoicesCommitted,
    totalCommitted,
    availableLimit,
    totalLimit: card.creditLimit,
    unpaidTransactions,
    status: isClosed ? 'closed' : 'open',
  };
}

/**
 * Processa o pagamento da fatura:
 * - Debita o saldo da conta corrente selecionada
 * - Liquida o passivo do cartão (restaura limite disponível)
 * - Retorna se a operação é válida e o novo saldo da conta
 */
export function settleCardInvoicePayment(
  account: Account,
  invoiceAmountCents: number
): { success: boolean; newAccountBalance: number; error?: string } {
  if (invoiceAmountCents <= 0) {
    return { success: false, newAccountBalance: account.balance, error: 'Valor da fatura deve ser maior que zero' };
  }

  const newAccountBalance = account.balance - invoiceAmountCents;
  return {
    success: true,
    newAccountBalance,
  };
}
