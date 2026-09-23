/**
 * Domain: Installments & Purchases
 * Gerenciamento de compras parceladas preservando:
 * 1. Compromisso financeiro total contraído
 * 2. Impacto mensal parcelado no fluxo de caixa e orçamento
 * 3. Divisão exata de centavos entre as parcelas sem dízimas periódicas residuais
 */

import { InstallmentPlan } from '../types';

export interface GeneratedInstallment {
  installmentNumber: number;
  totalInstallments: number;
  yearMonth: string; // YYYY-MM
  dueDate: string;   // YYYY-MM-DD
  amountCents: number;
}

/**
 * Cria um cronograma de parcelas distribuindo qualquer sobra de centavos
 * nas primeiras parcelas (Largest Remainder Method).
 * Exemplo: R$ 100,00 em 3 parcelas -> P1: 33,34, P2: 33,33, P3: 33,33. Soma = 100,00 exatos!
 */
export function generateInstallmentSchedule(
  totalAmountCents: number,
  installmentCount: number,
  startYearMonth: string, // "YYYY-MM"
  dueDay: number = 10
): GeneratedInstallment[] {
  if (installmentCount <= 0 || totalAmountCents <= 0) {
    return [];
  }

  const baseInstallment = Math.floor(totalAmountCents / installmentCount);
  const remainderCents = totalAmountCents - baseInstallment * installmentCount;

  const [startYear, startMonth] = startYearMonth.split('-').map(Number);
  const installments: GeneratedInstallment[] = [];

  for (let i = 0; i < installmentCount; i++) {
    // Calcular mês de competência progressivo
    const currentMonthIndex = startMonth - 1 + i;
    const year = startYear + Math.floor(currentMonthIndex / 12);
    const month = (currentMonthIndex % 12) + 1;
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const safeDay = Math.min(dueDay, 28); // Evita dias inválidos como 30 de fevereiro
    const dueDate = `${yearMonth}-${String(safeDay).padStart(2, '0')}`;

    // Distribui 1 centavo extra para os primeiros meses até cobrir o resto
    const amountCents = baseInstallment + (i < remainderCents ? 1 : 0);

    installments.push({
      installmentNumber: i + 1,
      totalInstallments: installmentCount,
      yearMonth,
      dueDate,
      amountCents,
    });
  }

  return installments;
}

/**
 * Calcula o saldo devedor restante de um plano de parcelamento após N parcelas pagas
 */
export function calculateRemainingInstallmentBalance(
  plan: InstallmentPlan,
  installmentsPaid: number
): { remainingAmountCents: number; remainingCount: number } {
  const remainingCount = Math.max(0, plan.installmentCount - installmentsPaid);
  if (remainingCount === 0) {
    return { remainingAmountCents: 0, remainingCount: 0 };
  }

  const basePerInstallment = Math.floor(plan.totalAmount / plan.installmentCount);
  const remainder = plan.totalAmount - basePerInstallment * plan.installmentCount;
  
  // Se as parcelas pagas já cobriram os centavos extras (que caem nas primeiras parcelas):
  let paidAmount = 0;
  for (let i = 0; i < installmentsPaid; i++) {
    paidAmount += basePerInstallment + (i < remainder ? 1 : 0);
  }

  return {
    remainingAmountCents: Math.max(0, plan.totalAmount - paidAmount),
    remainingCount,
  };
}
