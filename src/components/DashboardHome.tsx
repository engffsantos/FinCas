import { useMemo } from 'react';
import { Household, HouseholdMember, Transaction, Bill, Category, FinancialGoal } from '../types';
import { formatBRL, formatPercent } from '../domain/money';
import { calculateBudget503020 } from '../domain/budget503020';
import { calculateHouseholdSettlement } from '../domain/debtSimplification';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  ChevronRight,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  PiggyBank,
  Info,
} from 'lucide-react';

interface DashboardHomeProps {
  household: Household;
  members: HouseholdMember[];
  currentMember: HouseholdMember;
  activePerspective: 'house' | 'personal';
  transactions: Transaction[];
  bills: Bill[];
  categories: Category[];
  goals: FinancialGoal[];
  onNavigateToTab: (tab: 'transactions' | 'planning' | 'house') => void;
  onOpenQuickAction: () => void;
}

export function DashboardHome({
  household,
  members,
  currentMember,
  activePerspective,
  transactions,
  bills,
  categories,
  goals,
  onNavigateToTab,
  onOpenQuickAction,
}: DashboardHomeProps) {
  // Aggregate house numbers
  const totalHouseIncome = useMemo(
    () => members.reduce((sum, m) => sum + m.netIncome, 0),
    [members]
  );

  // Dynamic current month based on latest transaction or real current date
  const currentMonth = useMemo(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(t => t.date.slice(0, 7)).sort();
      return dates[dates.length - 1];
    }
    return new Date().toISOString().slice(0, 7);
  }, [transactions]);

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  // House Shared Budget 50/30/20
  const houseBudget = useMemo(() => {
    // Only house expenses
    const sharedExpenses = monthTransactions.filter(t => t.scope !== 'personal');
    return calculateBudget503020(
      sharedExpenses,
      categories,
      totalHouseIncome,
      household.budgetPercentages
    );
  }, [monthTransactions, categories, totalHouseIncome, household.budgetPercentages]);

  // Personal Budget 50/30/20 for current member
  const personalBudget = useMemo(() => {
    // Member's personal expenses + their assigned splits from shared expenses
    const personalTxs = monthTransactions.filter(
      t =>
        (t.scope === 'personal' && t.paidByMemberId === currentMember.id) ||
        (t.scope !== 'personal' && t.splits.some(s => s.memberId === currentMember.id))
    );
    return calculateBudget503020(
      personalTxs,
      categories,
      currentMember.netIncome,
      household.budgetPercentages
    );
  }, [monthTransactions, categories, currentMember, household.budgetPercentages]);

  // House settlements
  const settlement = useMemo(() => {
    return calculateHouseholdSettlement(monthTransactions, members, currentMonth);
  }, [monthTransactions, members]);

  const currentMemberBalance = useMemo(() => {
    return settlement.memberBalances.find(m => m.memberId === currentMember.id) || {
      paidAmount: 0,
      owedAmount: 0,
      netBalance: 0,
    };
  }, [settlement, currentMember]);

  // Pending Bills
  const upcomingBills = useMemo(() => {
    return bills
      .filter(b => b.status === 'pending' || b.status === 'projected')
      .slice(0, 3);
  }, [bills]);

  return (
    <div className="space-y-4 pb-6">
      {/* ---------------- PERSPECTIVE 1: NOSSA CASA ---------------- */}
      {activePerspective === 'house' && (
        <>
          {/* Main Financial Hero Card */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Orçamento da Casa • Setembro 2026
              </span>
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
                {members.length} moradores
              </span>
            </div>

            {/* Total Balance / Remaining Spend */}
            <div className="mt-2">
              <span className="text-xs text-slate-400 block">Disponível para gastar até o fim do mês:</span>
              <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {formatBRL(houseBudget.availableToSpendThisMonth)}
              </div>
            </div>

            {/* Daily available spending badge */}
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Média diária disponível: <strong>{formatBRL(houseBudget.dailyAvailableSpend)}/dia</strong></span>
              <span className="text-slate-400 text-[10px]">({houseBudget.daysRemainingInMonth} dias restam)</span>
            </div>

            {/* 4 Macro Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Receitas Coletivas</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {formatBRL(totalHouseIncome)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Despesas Compartilhadas</span>
                <span className="text-sm font-bold text-rose-400 flex items-center gap-0.5 mt-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {formatBRL(houseBudget.totalSpent)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Reservas / Metas</span>
                <span className="text-sm font-bold text-cyan-400 flex items-center gap-0.5 mt-0.5">
                  <PiggyBank className="w-3.5 h-3.5" />
                  {formatBRL(houseBudget.savings.spentAmount)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Saldo Projetado</span>
                <span className="text-sm font-bold text-teal-300 flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {formatBRL(totalHouseIncome - houseBudget.totalSpent)}
                </span>
              </div>
            </div>
          </div>

          {/* 50/30/20 Method Progress Section */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Planejamento 50/30/20 da Casa</h2>
                <p className="text-[11px] text-slate-400">Diretriz financeira colaborativa</p>
              </div>
              <button
                onClick={() => onNavigateToTab('planning')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
              >
                Detalhes <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Combined Progress Bar */}
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(houseBudget.needs.actualPercent, 100)}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`Necessidades: ${houseBudget.needs.actualPercent}%`}
              />
              <div
                style={{ width: `${Math.min(houseBudget.wants.actualPercent, 100)}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Estilo de Vida: ${houseBudget.wants.actualPercent}%`}
              />
              <div
                style={{ width: `${Math.min(houseBudget.savings.actualPercent, 100)}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Prioridades: ${houseBudget.savings.actualPercent}%`}
              />
            </div>

            {/* 3 Pillars Summary */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              {/* Necessidades */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="flex items-center gap-1 text-[11px] text-blue-400 font-semibold mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Necessidades
                </div>
                <div className="font-bold text-white text-sm">
                  {formatPercent(houseBudget.needs.actualPercent)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Meta {houseBudget.needs.targetPercent}% • {formatBRL(houseBudget.needs.spentAmount)}
                </div>
              </div>

              {/* Estilo de Vida */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Estilo de Vida
                </div>
                <div className="font-bold text-white text-sm">
                  {formatPercent(houseBudget.wants.actualPercent)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Meta {houseBudget.wants.targetPercent}% • {formatBRL(houseBudget.wants.spentAmount)}
                </div>
              </div>

              {/* Prioridades */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Prioridades
                </div>
                <div className="font-bold text-white text-sm">
                  {formatPercent(houseBudget.savings.actualPercent)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Meta {houseBudget.savings.targetPercent}% • {formatBRL(houseBudget.savings.spentAmount)}
                </div>
              </div>
            </div>

            {/* Smart Pacing Feedback */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {houseBudget.wants.spentAmount < houseBudget.wants.targetAmount ? (
                  <span>
                    Estilo de Vida está em <strong>{formatPercent(houseBudget.wants.actualPercent)}</strong> da renda mensal.
                    Sua meta é {houseBudget.wants.targetPercent}%. Restam{' '}
                    <strong className="text-emerald-300">{formatBRL(houseBudget.wants.remainingAmount)}</strong> antes de atingir o orçamento planejado.
                  </span>
                ) : (
                  <span>
                    Estilo de Vida atingiu {formatPercent(houseBudget.wants.actualPercent)} da renda (excedeu{' '}
                    {formatBRL(Math.abs(houseBudget.wants.remainingAmount))}). O sistema orienta equilibrar os próximos dias.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Acerto da Casa Quick Widget */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Compensação Entre Moradores</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-medium">
                    Debt Simplification
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Saldos líquidos das contas compartilhadas</p>
              </div>
              <button
                onClick={() => onNavigateToTab('house')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
              >
                Ver Acerto <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {settlement.memberBalances.map(mb => {
                const member = members.find(m => m.id === mb.memberId);
                const isCreditor = mb.netBalance > 0;
                const isSettled = mb.netBalance === 0;

                return (
                  <div
                    key={mb.memberId}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                        style={{ backgroundColor: member?.color }}
                      >
                        {member?.avatar}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200 block">{member?.displayName}</span>
                        <span className="text-[10px] text-slate-400">
                          Pagou {formatBRL(mb.paidAmount)} • Cota {formatBRL(mb.owedAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isSettled ? (
                        <span className="text-slate-400 font-semibold">Quitado</span>
                      ) : isCreditor ? (
                        <div>
                          <span className="text-[10px] text-emerald-400 block font-medium">Tem a receber</span>
                          <span className="font-bold text-emerald-400 text-sm">+{formatBRL(mb.netBalance)}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-rose-400 block font-medium">Deve pagar</span>
                          <span className="font-bold text-rose-400 text-sm">{formatBRL(mb.netBalance)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simplification transfers alert */}
            {settlement.transfersToSettle.length > 0 && (
              <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-200 flex items-center justify-between">
                <span>
                  💡 <strong>{settlement.transfersToSettle.length} transferência(s)</strong> recomendadas para zerar todas as dívidas.
                </span>
                <button
                  onClick={() => onNavigateToTab('house')}
                  className="text-xs text-indigo-400 font-bold hover:underline"
                >
                  Quitar via Pix
                </button>
              </div>
            )}
          </div>

          {/* Próximos Boletos e Vencimentos */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Próximos Boletos da Casa
                </h2>
                <p className="text-[11px] text-slate-400">Contas a vencer nos próximos dias</p>
              </div>
              <button
                onClick={() => onNavigateToTab('house')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Ver Todas
              </button>
            </div>

            <div className="space-y-2">
              {upcomingBills.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-400">
                  Nenhum boleto ou conta pendente neste momento.
                </div>
              ) : (
                upcomingBills.map(bill => {
                const assigned = members.find(m => m.id === bill.assignedToMemberId);
                return (
                  <div
                    key={bill.id}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">{bill.description}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          Vence: {bill.dueDate}
                        </span>
                        {assigned && (
                          <span className="text-slate-300 font-medium">
                            • Responsável: {assigned.displayName.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-sm block">{formatBRL(bill.amount)}</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {bill.status}
                      </span>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </>
      )}

      {/* ---------------- PERSPECTIVE 2: MINHA CARTEIRA ---------------- */}
      {activePerspective === 'personal' && (
        <>
          {/* Personal Financial Summary Card */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/60 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: currentMember.color }}
                />
                Minha Carteira • {currentMember.displayName}
              </span>
              <span className="text-[11px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700/50">
                {currentMember.role === 'owner' ? 'Administrador' : currentMember.role}
              </span>
            </div>

            {/* Income & Participation */}
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Minha Renda Líquida Mensal:</span>
                <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  {formatBRL(currentMember.netIncome)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Minha cota da casa:</span>
                <span className="text-lg font-bold text-indigo-300">
                  {formatPercent((currentMember.netIncome / totalHouseIncome) * 100)}
                </span>
              </div>
            </div>

            {/* Debt status with the house */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-900/80 border border-indigo-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block font-medium">Posição no Acerto da Casa:</span>
                  <span className="text-[11px] text-slate-400">
                    Você pagou {formatBRL(currentMemberBalance.paidAmount)} • Sua parte: {formatBRL(currentMemberBalance.owedAmount)}
                  </span>
                </div>
                <div className="text-right">
                  {currentMemberBalance.netBalance > 0 ? (
                    <div>
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">Você tem a receber</span>
                      <div className="text-base font-extrabold text-emerald-400">
                        +{formatBRL(currentMemberBalance.netBalance)}
                      </div>
                    </div>
                  ) : currentMemberBalance.netBalance < 0 ? (
                    <div>
                      <span className="text-[10px] text-rose-400 font-semibold uppercase">Você deve pagar</span>
                      <div className="text-base font-extrabold text-rose-400">
                        {formatBRL(currentMemberBalance.netBalance)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Contas em dia</span>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Metric counters */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Gastos Pessoais</span>
                <span className="text-xs font-bold text-slate-200 block mt-0.5">
                  {formatBRL(
                    monthTransactions
                      .filter(t => t.scope === 'personal' && t.paidByMemberId === currentMember.id)
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Cota Coletiva</span>
                <span className="text-xs font-bold text-indigo-300 block mt-0.5">
                  {formatBRL(currentMemberBalance.owedAmount)}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Disponível Pessoal</span>
                <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                  {formatBRL(
                    currentMember.netIncome -
                      currentMemberBalance.owedAmount -
                      monthTransactions
                        .filter(t => t.scope === 'personal' && t.paidByMemberId === currentMember.id)
                        .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Personal 50/30/20 Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-white">Meu Equilíbrio Financeiro (50/30/20)</h2>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Necessidades ({personalBudget.needs.targetPercent}%)</span>
                  <span>{formatBRL(personalBudget.needs.spentAmount)} / {formatBRL(personalBudget.needs.targetAmount)}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(personalBudget.needs.actualPercent, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Estilo de Vida ({personalBudget.wants.targetPercent}%)</span>
                  <span>{formatBRL(personalBudget.wants.spentAmount)} / {formatBRL(personalBudget.wants.targetAmount)}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(personalBudget.wants.actualPercent, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Prioridades Financeiras ({personalBudget.savings.targetPercent}%)</span>
                  <span>{formatBRL(personalBudget.savings.spentAmount)} / {formatBRL(personalBudget.savings.targetAmount)}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.min(personalBudget.savings.actualPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Goals */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Minhas Metas</h2>
              <button
                onClick={() => onNavigateToTab('planning')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Ver Todas
              </button>
            </div>
            <div className="space-y-2">
              {goals.map(goal => (
                <div key={goal.id} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>{goal.title}</span>
                    <span className="text-emerald-400 font-bold">{formatBRL(goal.currentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Meta: {formatBRL(goal.targetAmount)}</span>
                    <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Floating Fast Action Prompt */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">Lançamento em Segundos</span>
            <span className="text-[11px] text-slate-400">Texto rápido, áudio ou leitura de boleto</span>
          </div>
        </div>
        <button
          onClick={onOpenQuickAction}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
        >
          Lançar Agora
        </button>
      </div>
    </div>
  );
}
