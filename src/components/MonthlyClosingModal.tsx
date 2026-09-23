import { useState } from 'react';
import {
  CalendarCheck2,
  TrendingUp,
  PieChart,
  ArrowRight,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Users,
  Wallet,
  X,
  Lock,
} from 'lucide-react';
import { Household, HouseholdMember, Transaction, Category, HouseholdIncomeSnapshot } from '../types';
import { calculateBudget503020 } from '../domain/budget503020';
import { calculateHouseholdSettlement } from '../domain/debtSimplification';
import { generatePixPayload } from '../domain/pix';
import { formatBRL, toCents } from '../domain/money';

interface MonthlyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: Household;
  members: HouseholdMember[];
  currentMember: HouseholdMember;
  transactions: Transaction[];
  categories: Category[];
  snapshots: HouseholdIncomeSnapshot[];
  onCloseMonth: (yearMonth: string) => void;
}

export function MonthlyClosingModal({
  isOpen,
  onClose,
  household,
  members,
  currentMember,
  transactions,
  categories,
  snapshots,
  onCloseMonth,
}: MonthlyClosingModalProps) {
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [isClosed, setIsClosed] = useState(false);

  if (!isOpen) return null;

  // Filter transactions for the selected month and household
  const monthTransactions = transactions.filter(
    t => t.householdId === household.id && t.date.startsWith(selectedMonth)
  );

  const totalHouseIncome = members.reduce((sum, m) => sum + m.netIncome, 0);
  const budget = calculateBudget503020(monthTransactions, categories, totalHouseIncome, household.budgetPercentages);
  const settlement = calculateHouseholdSettlement(monthTransactions, members, selectedMonth);

  // Calculate historical monthly averages (mock simulation over 6 months)
  const averageNeeds6Months = Math.round(budget.needs.spentAmount * 0.96);
  const averageWants6Months = Math.round(budget.wants.spentAmount * 1.04);
  const savingsRate = totalHouseIncome > 0
    ? Math.max(0, Math.round(((totalHouseIncome - budget.totalSpent) / totalHouseIncome) * 100))
    : 0;

  const handleCopyPix = (transfer: typeof settlement.transfersToSettle[0], keyIndex: number) => {
    const toMember = members.find(m => m.id === transfer.toMemberId);
    const pixKey = toMember?.userId === 'usr_carlos' ? 'engffsantos@gmail.com' : `${toMember?.displayName.toLowerCase().replace(' ', '')}@pix.com.br`;

    const pixPayload = generatePixPayload({
      pixKey,
      merchantName: toMember?.displayName || 'FinCas',
      merchantCity: 'Sao Paulo',
      amountCents: transfer.amount,
      txId: `FINCAS${selectedMonth.replace('-', '')}`,
      description: `Acerto FinCas ${selectedMonth}`,
    });

    navigator.clipboard.writeText(pixPayload);
    setCopiedPixId(`pix_${keyIndex}`);
    setTimeout(() => setCopiedPixId(null), 3000);
  };

  const handleFreezeMonth = () => {
    onCloseMonth(selectedMonth);
    setIsClosed(true);
    setTimeout(() => {
      setIsClosed(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-400">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Fechamento Inteligente do Mês
              </h2>
              <p className="text-xs text-slate-400">
                Conciliação 50/30/20, compensação de dívidas e Pix Copia e Cola
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Month Selector Header */}
          <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-2xl">
            <div className="text-xs text-slate-300 font-medium">Mês de Referência</div>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-100 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="2026-09">Setembro de 2026</option>
              <option value="2026-08">Agosto de 2026</option>
              <option value="2026-07">Julho de 2026</option>
            </select>
          </div>

          {/* 50/30/20 Summary Dashboard */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">Metodologia 50/30/20 da Casa</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-100">
                Receita: {formatBRL(totalHouseIncome)}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Needs */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Necessidades (Aluguel, Mercado, Contas)</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatBRL(budget.needs.spentAmount)} / {formatBRL(budget.needs.targetAmount)} ({budget.needs.actualPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, budget.needs.actualPercent * 2)}%` }}
                  />
                </div>
              </div>

              {/* Wants */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Estilo de Vida (Restaurantes, Lazer)</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {formatBRL(budget.wants.spentAmount)} / {formatBRL(budget.wants.targetAmount)} ({budget.wants.actualPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (budget.wants.actualPercent / 30) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Savings */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Prioridades Financeiras & Reserva</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {formatBRL(budget.savings.spentAmount)} / {formatBRL(budget.savings.targetAmount)} ({budget.savings.actualPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (budget.savings.actualPercent / 20) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Averages & Comparison */}
            <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                Custo Essencial Médio (6m): <strong className="text-slate-200">{formatBRL(averageNeeds6Months)}</strong>
              </div>
              <div className="text-right">
                Taxa de Poupança da Casa: <strong className="text-emerald-400">{savingsRate}%</strong>
              </div>
            </div>
          </div>

          {/* Debt Settlement Matrix with Pix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Compensação Inteligente & Acertos Pix
              </span>
              <span className="text-[11px] text-slate-500">
                {settlement.transfersToSettle.length} transferência(s) necessária(s)
              </span>
            </div>

            {settlement.transfersToSettle.length === 0 ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-emerald-300">Tudo equilibrado!</p>
                <p className="text-[11px] text-emerald-400/80">
                  Nenhum morador possui saldo devedor pendente para este mês.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {settlement.transfersToSettle.map((t, idx) => {
                  const fromM = members.find(m => m.id === t.fromMemberId);
                  const toM = members.find(m => m.id === t.toMemberId);
                  const isCopied = copiedPixId === `pix_${idx}`;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-rose-400">{fromM?.displayName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-semibold text-emerald-400">{toM?.displayName}</span>
                        </div>
                        <span className="text-sm font-bold font-mono text-slate-100">
                          {formatBRL(t.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px]">
                        <span className="text-slate-400">
                          Chave Pix: <strong className="text-slate-300">{toM?.userId === 'usr_carlos' ? 'engffsantos@gmail.com' : 'cpf/email'}</strong>
                        </span>
                        <button
                          onClick={() => handleCopyPix(t, idx)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg flex items-center gap-1.5 transition text-xs shadow-sm"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Pix Copiado!</span>
                            </>
                          ) : (
                            <>
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Pix Copia e Cola</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Closing Confirmation Action */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <button
              disabled={isClosed}
              onClick={handleFreezeMonth}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-2xl text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isClosed ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Fechamento Congelado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Congelar Fechamento de {selectedMonth}</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Ao congelar, o FinCas gera um snapshot imutável de renda e percentuais para fins de auditoria contábil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
