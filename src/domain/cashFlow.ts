import { Account, Bill, Transaction, CreditCard } from '../types';

export interface CashFlowProjection {
  days: 7 | 15 | 30 | 60 | 90;
  currentBalance: number;     // in cents
  expectedIncome: number;     // in cents
  pendingBills: number;       // in cents
  creditCardInvoices: number; // in cents
  plannedInvestments: number; // in cents
  projectedBalance: number;   // in cents
  inflowsList: { description: string; amount: number; date: string }[];
  outflowsList: { description: string; amount: number; date: string; type: string }[];
}

export function projectCashFlow(
  accounts: Account[],
  bills: Bill[],
  transactions: Transaction[],
  creditCards: CreditCard[],
  days: 7 | 15 | 30 | 60 | 90,
  referenceDate = new Date()
): CashFlowProjection {
  // Current liquid cash across accounts
  const currentBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const horizonMs = days * 24 * 60 * 60 * 1000;
  const targetEndDate = new Date(referenceDate.getTime() + horizonMs);

  // Inflows: Future expected revenues / salaries
  const inflowsList: { description: string; amount: number; date: string }[] = [];
  let expectedIncome = 0;

  // Search scheduled incomes
  for (const tx of transactions) {
    if (tx.type === 'income') {
      const txDate = new Date(tx.date);
      if (txDate >= referenceDate && txDate <= targetEndDate) {
        expectedIncome += tx.amount;
        inflowsList.push({
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
        });
      }
    }
  }

  // If projection looks ahead into next month(s), add expected base recurring salaries
  if (expectedIncome === 0 && days >= 15) {
    // Proportional recurring estimated income based on days
    const salaryEstimate = Math.round(1000000 * (days / 30)); // R$ 10.000 monthly
    expectedIncome += salaryEstimate;
    inflowsList.push({
      description: 'Salários e Receitas Recorrentes Previstas',
      amount: salaryEstimate,
      date: new Date(referenceDate.getTime() + 15 * 86400000).toISOString().split('T')[0],
    });
  }

  // Outflows: Pending Bills (boletos e contas)
  const outflowsList: { description: string; amount: number; date: string; type: string }[] = [];
  let pendingBills = 0;

  for (const bill of bills) {
    if (bill.status === 'pending' || bill.status === 'projected') {
      const bDate = new Date(bill.dueDate);
      if (bDate <= targetEndDate) {
        pendingBills += bill.amount;
        outflowsList.push({
          description: `${bill.beneficiary} - ${bill.description}`,
          amount: bill.amount,
          date: bill.dueDate,
          type: 'Boleto / Conta',
        });
      }
    }
  }

  // Credit card commitments due in this period
  let creditCardInvoices = 0;
  for (const tx of transactions) {
    if (tx.paymentMethod === 'credit_card' && tx.dueDate) {
      const cDate = new Date(tx.dueDate);
      if (cDate >= referenceDate && cDate <= targetEndDate) {
        creditCardInvoices += tx.amount;
        outflowsList.push({
          description: `Fatura Cartão: ${tx.description}`,
          amount: tx.amount,
          date: tx.dueDate,
          type: 'Fatura de Cartão',
        });
      }
    }
  }

  // Planned investments (e.g. 10% of income)
  const plannedInvestments = Math.round(expectedIncome * 0.15);

  const projectedBalance = currentBalance + expectedIncome - pendingBills - creditCardInvoices - plannedInvestments;

  return {
    days,
    currentBalance,
    expectedIncome,
    pendingBills,
    creditCardInvoices,
    plannedInvestments,
    projectedBalance,
    inflowsList,
    outflowsList,
  };
}
