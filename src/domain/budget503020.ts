import { Transaction, Category, BudgetGroup, SmartAlert } from '../types';
import { formatBRL, formatPercent } from './money';

export interface Budget503020Summary {
  totalIncome: number; // in cents
  totalSpent: number;  // in cents
  needs: {
    targetPercent: number;
    targetAmount: number;
    spentAmount: number;
    actualPercent: number;
    remainingAmount: number; // targetAmount - spentAmount
  };
  wants: {
    targetPercent: number;
    targetAmount: number;
    spentAmount: number;
    actualPercent: number;
    remainingAmount: number;
  };
  savings: {
    targetPercent: number;
    targetAmount: number;
    spentAmount: number;
    actualPercent: number;
    remainingAmount: number;
  };
  availableToSpendThisMonth: number; // Total budgeted spending remaining
  daysRemainingInMonth: number;
  dailyAvailableSpend: number; // availableToSpend / daysRemaining
  alerts: SmartAlert[];
}

export function calculateBudget503020(
  transactions: Transaction[],
  categories: Category[],
  totalLiquidIncomeCents: number,
  percentages = { needs: 50, wants: 30, savings: 20 },
  referenceDate = new Date()
): Budget503020Summary {
  // Category mapping
  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  let needsSpent = 0;
  let wantsSpent = 0;
  let savingsSpent = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      const category = categoryMap.get(tx.categoryId);
      const group: BudgetGroup = category ? category.budgetGroup : 'wants';

      if (group === 'needs') {
        needsSpent += tx.amount;
      } else if (group === 'wants') {
        wantsSpent += tx.amount;
      } else if (group === 'savings') {
        savingsSpent += tx.amount;
      }
    }
  }

  const totalSpent = needsSpent + wantsSpent + savingsSpent;
  const safeIncome = Math.max(totalLiquidIncomeCents, 1);

  // Targets
  const needsTarget = Math.round((safeIncome * percentages.needs) / 100);
  const wantsTarget = Math.round((safeIncome * percentages.wants) / 100);
  const savingsTarget = Math.round((safeIncome * percentages.savings) / 100);

  // Remaining
  const needsRemaining = needsTarget - needsSpent;
  const wantsRemaining = wantsTarget - wantsSpent;
  const savingsRemaining = savingsTarget - savingsSpent;

  // Actual percentages of current income
  const needsActualPct = Number(((needsSpent / safeIncome) * 100).toFixed(1));
  const wantsActualPct = Number(((wantsSpent / safeIncome) * 100).toFixed(1));
  const savingsActualPct = Number(((savingsSpent / safeIncome) * 100).toFixed(1));

  // Days remaining in current month
  const now = referenceDate;
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

  // Allowable spending pool (Needs + Wants remaining)
  const availableToSpend = Math.max(0, needsRemaining + wantsRemaining);
  const dailyAvailable = Math.round(availableToSpend / daysRemaining);

  // Generate intelligent, constructive alerts
  const alerts: SmartAlert[] = [];

  // Wants / Estilo de Vida pacing alert
  if (wantsActualPct >= percentages.wants) {
    const excess = wantsSpent - wantsTarget;
    alerts.push({
      id: 'alert_wants_exceeded',
      type: 'warning',
      title: 'Atenção ao Estilo de Vida',
      message: `Estilo de Vida atingiu ${formatPercent(wantsActualPct)} da renda (${formatBRL(excess)} acima da meta de ${percentages.wants}%). Ajuste os próximos dias para equilibrar o mês.`,
      categoryGroup: 'wants',
      timestamp: new Date().toISOString(),
    });
  } else if (wantsActualPct >= percentages.wants * 0.8) {
    alerts.push({
      id: 'alert_wants_approaching',
      type: 'info',
      title: 'Ritmo de Estilo de Vida',
      message: `Estilo de Vida está em ${formatPercent(wantsActualPct)} da renda mensal. Sua meta é ${percentages.wants}%. Restam ${formatBRL(wantsRemaining)} antes de atingir o orçamento planejado.`,
      categoryGroup: 'wants',
      timestamp: new Date().toISOString(),
    });
  }

  // Needs pacing alert
  if (needsActualPct > percentages.needs) {
    alerts.push({
      id: 'alert_needs_high',
      type: 'info',
      title: 'Custos Essenciais Elevados',
      message: `Necessidades somam ${formatPercent(needsActualPct)} da renda (meta de ${percentages.needs}%). Verifique contas sazonais como energia ou manutenção.`,
      categoryGroup: 'needs',
      timestamp: new Date().toISOString(),
    });
  }

  // Days remaining alert
  alerts.push({
    id: 'alert_days_pace',
    type: 'info',
    title: 'Disponibilidade Diária',
    message: `Restam ${daysRemaining} dias para o fechamento do mês. Você tem uma média de ${formatBRL(dailyAvailable)}/dia disponível para gastos previstos.`,
    timestamp: new Date().toISOString(),
  });

  return {
    totalIncome: totalLiquidIncomeCents,
    totalSpent,
    needs: {
      targetPercent: percentages.needs,
      targetAmount: needsTarget,
      spentAmount: needsSpent,
      actualPercent: needsActualPct,
      remainingAmount: needsRemaining,
    },
    wants: {
      targetPercent: percentages.wants,
      targetAmount: wantsTarget,
      spentAmount: wantsSpent,
      actualPercent: wantsActualPct,
      remainingAmount: wantsRemaining,
    },
    savings: {
      targetPercent: percentages.savings,
      targetAmount: savingsTarget,
      spentAmount: savingsSpent,
      actualPercent: savingsActualPct,
      remainingAmount: savingsRemaining,
    },
    availableToSpendThisMonth: availableToSpend,
    daysRemainingInMonth: daysRemaining,
    dailyAvailableSpend: dailyAvailable,
    alerts,
  };
}
