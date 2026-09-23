import { useState, useMemo } from 'react';
import { Household, HouseholdMember, Transaction, Category, FinancialGoal, Bill, Account, CreditCard } from '../types';
import { formatBRL, formatPercent, toCents } from '../domain/money';
import { calculateBudget503020 } from '../domain/budget503020';
import { projectCashFlow } from '../domain/cashFlow';
import {
  PieChart,
  ShieldCheck,
  TrendingUp,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PlanningViewProps {
  household: Household;
  members: HouseholdMember[];
  transactions: Transaction[];
  categories: Category[];
  goals: FinancialGoal[];
  bills: Bill[];
  accounts: Account[];
  creditCards: CreditCard[];
  onUpdateBudgetPercentages: (percentages: { needs: number; wants: number; savings: number }) => void;
  onAddGoal: (goal: FinancialGoal) => void;
}

export function PlanningView({
  household,
  members,
  transactions,
  categories,
  goals,
  bills,
  accounts,
  creditCards,
  onUpdateBudgetPercentages,
  onAddGoal,
}: PlanningViewProps) {
  const [activeSubtab, setActiveSubtab] = useState<'50_30_20' | 'goals' | 'cashflow'>('50_30_20');

  // Total House Income
  const totalHouseIncome = useMemo(
    () => members.reduce((sum, m) => sum + m.netIncome, 0),
    [members]
  );

  // Dynamic current active month
  const currentMonth = useMemo(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(t => t.date.slice(0, 7)).sort();
      return dates[dates.length - 1];
    }
    return new Date().toISOString().slice(0, 7);
  }, [transactions]);

  // 50/30/20 calculations
  const budgetSummary = useMemo(() => {
    const currentMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth) && t.scope !== 'personal');
    return calculateBudget503020(
      currentMonthTxs,
      categories,
      totalHouseIncome,
      household.budgetPercentages
    );
  }, [transactions, categories, totalHouseIncome, household.budgetPercentages, currentMonth]);

  // Cash flow projection
  const [cashFlowHorizon, setCashFlowHorizon] = useState<7 | 15 | 30 | 60 | 90>(30);
  const cashFlow = useMemo(() => {
    return projectCashFlow(accounts, bills, transactions, creditCards, cashFlowHorizon);
  }, [accounts, bills, transactions, creditCards, cashFlowHorizon]);

  // Emergency Fund Calculations
  // Essential monthly cost = Needs spent or target
  const monthlyEssentialCost = budgetSummary.needs.spentAmount || toCents(4500);
  const calculatedEmergencyTarget = monthlyEssentialCost * household.emergencyFundMonthsTarget;

  // New Goal Modal state
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetStr, setGoalTargetStr] = useState('');
  const [goalCurrentStr, setGoalCurrentStr] = useState('');
  const [goalMonths, setGoalMonths] = useState(12);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCents = toCents(parseFloat(goalTargetStr.replace(',', '.')) || 0);
    const currentCents = toCents(parseFloat(goalCurrentStr.replace(',', '.')) || 0);
    if (targetCents <= 0) return;

    const remaining = Math.max(0, targetCents - currentCents);
    const monthlyTarget = Math.round(remaining / Math.max(1, goalMonths));

    const newGoal: FinancialGoal = {
      id: `goal_${Date.now()}`,
      householdId: household.id,
      title: goalTitle || 'Nova Meta Financeira',
      category: 'custom',
      targetAmount: targetCents,
      currentAmount: currentCents,
      targetDate: new Date(Date.now() + goalMonths * 30 * 86400000).toISOString().split('T')[0],
      monthlyContributionTarget: monthlyTarget,
      isShared: true,
    };

    onAddGoal(newGoal);
    setShowNewGoalModal(false);
    setGoalTitle('');
    setGoalTargetStr('');
    setGoalCurrentStr('');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Sub-navigation */}
      <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveSubtab('50_30_20')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubtab === '50_30_20'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Modelo 50/30/20</span>
        </button>
        <button
          onClick={() => setActiveSubtab('goals')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubtab === 'goals'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Metas & Reserva</span>
        </button>
        <button
          onClick={() => setActiveSubtab('cashflow')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubtab === 'cashflow'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Fluxo de Caixa</span>
        </button>
      </div>

      {/* ================= SUBTAB 1: 50/30/20 ORÇAMENTO ================= */}
      {activeSubtab === '50_30_20' && (
        <div className="space-y-4">
          {/* Preset Buttons & Customization */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Metodologia Orçamentária
                </h2>
                <p className="text-[11px] text-slate-400">Personalize os percentuais da Casa</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                {household.budgetPercentages.needs}/{household.budgetPercentages.wants}/{household.budgetPercentages.savings}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
              {[
                { label: '50/30/20', needs: 50, wants: 30, savings: 20 },
                { label: '55/25/20', needs: 55, wants: 25, savings: 20 },
                { label: '60/20/20', needs: 60, wants: 20, savings: 20 },
                { label: '50/20/30', needs: 50, wants: 20, savings: 30 },
              ].map(preset => {
                const isActive =
                  household.budgetPercentages.needs === preset.needs &&
                  household.budgetPercentages.wants === preset.wants &&
                  household.budgetPercentages.savings === preset.savings;
                return (
                  <button
                    key={preset.label}
                    onClick={() =>
                      onUpdateBudgetPercentages({
                        needs: preset.needs,
                        wants: preset.wants,
                        savings: preset.savings,
                      })
                    }
                    className={`py-1.5 rounded-lg border text-[11px] transition ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Pillars In-Depth Cards */}
          <div className="space-y-3">
            {/* 1. Necessidades */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Necessidades (Meta {budgetSummary.needs.targetPercent}%)
                </span>
                <span className="font-bold text-white">
                  {formatBRL(budgetSummary.needs.spentAmount)} / {formatBRL(budgetSummary.needs.targetAmount)}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(budgetSummary.needs.actualPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Aluguel, Condomínio, Supermercado, Luz, Água, Internet</span>
                <span className="text-slate-300 font-semibold">
                  {budgetSummary.needs.remainingAmount >= 0
                    ? `Restam ${formatBRL(budgetSummary.needs.remainingAmount)}`
                    : `Excesso de ${formatBRL(Math.abs(budgetSummary.needs.remainingAmount))}`}
                </span>
              </div>
            </div>

            {/* 2. Estilo de Vida */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Estilo de Vida (Meta {budgetSummary.wants.targetPercent}%)
                </span>
                <span className="font-bold text-white">
                  {formatBRL(budgetSummary.wants.spentAmount)} / {formatBRL(budgetSummary.wants.targetAmount)}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(budgetSummary.wants.actualPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Restaurantes, Delivery, Lazer, Viagens, Streaming</span>
                <span className="text-slate-300 font-semibold">
                  {budgetSummary.wants.remainingAmount >= 0
                    ? `Restam ${formatBRL(budgetSummary.wants.remainingAmount)}`
                    : `Excesso de ${formatBRL(Math.abs(budgetSummary.wants.remainingAmount))}`}
                </span>
              </div>
            </div>

            {/* 3. Prioridades Financeiras */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Prioridades Financeiras (Meta {budgetSummary.savings.targetPercent}%)
                </span>
                <span className="font-bold text-white">
                  {formatBRL(budgetSummary.savings.spentAmount)} / {formatBRL(budgetSummary.savings.targetAmount)}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(budgetSummary.savings.actualPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Reserva de Emergência, Investimentos, Amortizações</span>
                <span className="text-slate-300 font-semibold">
                  {budgetSummary.savings.remainingAmount >= 0
                    ? `Falta investir ${formatBRL(budgetSummary.savings.remainingAmount)}`
                    : `Meta de poupança atingida!`}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Pacing Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Ritmo de Gastos Diários (Pacing)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Disponível para gastar até o fim do mês sem estourar o orçamento planejado:{' '}
              <strong className="text-emerald-400">{formatBRL(budgetSummary.availableToSpendThisMonth)}</strong>.
            </p>
            <p className="text-[11px] text-slate-400">
              Valor médio seguro por dia:{' '}
              <strong className="text-white">{formatBRL(budgetSummary.dailyAvailableSpend)}/dia</strong> durante os próximos{' '}
              {budgetSummary.daysRemainingInMonth} dias restantes.
            </p>
          </div>
        </div>
      )}

      {/* ================= SUBTAB 2: METAS & RESERVA ================= */}
      {activeSubtab === 'goals' && (
        <div className="space-y-4">
          {/* Reserva de Emergência Calculator Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/50 border border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Calculadora da Reserva da Casa</h3>
                  <p className="text-[10px] text-slate-400">
                    Custo essencial médio: {formatBRL(monthlyEssentialCost)}/mês
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded-lg">
                Meta: {household.emergencyFundMonthsTarget} meses
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Reserva Desejada Recomendada:</span>
                <span className="text-base font-extrabold text-white">
                  {formatBRL(calculatedEmergencyTarget)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Acumulado Atual:</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatBRL(goals.find(g => g.category === 'emergency_fund')?.currentAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Goals Header & Create Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Objetivos & Metas Cadastradas
            </h3>
            <button
              onClick={() => setShowNewGoalModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-emerald-400 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Meta</span>
            </button>
          </div>

          {/* Goals List */}
          <div className="space-y-3">
            {goals.map(goal => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white">{goal.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Alvo: {goal.targetDate}</span>
                        <span>• Contribuição: {formatBRL(goal.monthlyContributionTarget)}/mês</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400">{pct}%</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-300 pt-0.5">
                    <span>
                      Acumulado: <strong>{formatBRL(goal.currentAmount)}</strong>
                    </span>
                    <span className="text-slate-400">
                      Falta: <strong className="text-slate-200">{formatBRL(remaining)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Goal Modal */}
          {showNewGoalModal && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-white">Criar Nova Meta Financeira</h4>
              <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Título da Meta</label>
                  <input
                    type="text"
                    placeholder="Ex: Reforma da Varanda, Viagem..."
                    value={goalTitle}
                    onChange={e => setGoalTitle(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Valor Alvo (R$)</label>
                    <input
                      type="text"
                      placeholder="Ex: 5000,00"
                      value={goalTargetStr}
                      onChange={e => setGoalTargetStr(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Já Economizado (R$)</label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={goalCurrentStr}
                      onChange={e => setGoalCurrentStr(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Prazo Estimado (meses)</label>
                  <select
                    value={goalMonths}
                    onChange={e => setGoalMonths(parseInt(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  >
                    <option value="6">6 meses</option>
                    <option value="12">12 meses (1 ano)</option>
                    <option value="24">24 meses (2 anos)</option>
                    <option value="36">36 meses (3 anos)</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                  >
                    Salvar Meta
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewGoalModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ================= SUBTAB 3: FLUXO DE CAIXA ================= */}
      {activeSubtab === 'cashflow' && (
        <div className="space-y-4">
          {/* Horizon Selector */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Horizonte de Projeção:</span>
            <div className="flex gap-1">
              {[7, 15, 30, 60, 90].map(h => (
                <button
                  key={h}
                  onClick={() => setCashFlowHorizon(h as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    cashFlowHorizon === h
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {h}d
                </button>
              ))}
            </div>
          </div>

          {/* Cash Flow Projection Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Saldo Atual das Contas:</span>
              <span className="font-bold text-slate-200">{formatBRL(cashFlow.currentBalance)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-emerald-400">
              <span>(+) Receitas Previstas ({cashFlow.days} dias):</span>
              <span className="font-bold">+{formatBRL(cashFlow.expectedIncome)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-amber-400">
              <span>(-) Boletos & Contas a Pagar:</span>
              <span className="font-bold">-{formatBRL(cashFlow.pendingBills)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-rose-400">
              <span>(-) Faturas de Cartão de Crédito:</span>
              <span className="font-bold">-{formatBRL(cashFlow.creditCardInvoices)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-cyan-400">
              <span>(-) Aportes / Metas Planejadas:</span>
              <span className="font-bold">-{formatBRL(cashFlow.plannedInvestments)}</span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-300">
                Saldo Projetado para {cashFlow.days} dias:
              </span>
              <span className="text-xl font-extrabold text-emerald-400">
                {formatBRL(cashFlow.projectedBalance)}
              </span>
            </div>
          </div>

          {/* Outflows schedule list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">Compromissos Mapeados no Período</h4>
            <div className="space-y-1.5">
              {cashFlow.outflowsList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block">{item.description}</span>
                    <span className="text-[10px] text-slate-400">{item.date} • {item.type}</span>
                  </div>
                  <span className="font-bold text-rose-400">-{formatBRL(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
