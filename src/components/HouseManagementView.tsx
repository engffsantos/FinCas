import { useState, useMemo } from 'react';
import {
  Household,
  HouseholdMember,
  HouseholdIncomeSnapshot,
  Transaction,
  CreditCard,
  Bill,
  AuditLog,
} from '../types';
import { formatBRL, formatPercent, toCents } from '../domain/money';
import { calculateHouseholdSettlement, generatePixCopiaECola } from '../domain/debtSimplification';
import {
  Handshake,
  Users,
  CreditCard as CardIcon,
  FileText,
  Copy,
  Check,
  Calendar,
  Lock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Archive,
  Settings,
  Trash2,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HouseManagementViewProps {
  household: Household;
  members: HouseholdMember[];
  currentMember: HouseholdMember;
  snapshots: HouseholdIncomeSnapshot[];
  transactions: Transaction[];
  creditCards: CreditCard[];
  bills: Bill[];
  onUpdateMemberIncome: (memberId: string, newIncome: number) => void;
  onCloseMonth: (yearMonth: string) => void;
  onMarkBillPaid: (billId: string) => void;
  onOpenHouseholdsModal?: () => void;
  onDeleteHousehold?: (householdId: string) => void;
}

export function HouseManagementView({
  household,
  members,
  currentMember,
  snapshots,
  transactions,
  creditCards,
  bills,
  onUpdateMemberIncome,
  onCloseMonth,
  onMarkBillPaid,
  onOpenHouseholdsModal,
  onDeleteHousehold,
}: HouseManagementViewProps) {
  const initialPeriod = useMemo(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(t => t.date.slice(0, 7)).sort();
      return dates[dates.length - 1];
    }
    return new Date().toISOString().slice(0, 7);
  }, [transactions]);

  const [activeSubtab, setActiveSubtab] = useState<'settlement' | 'members' | 'cards' | 'bills' | 'settings'>('settlement');
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [copiedPixIdx, setCopiedPixIdx] = useState<number | null>(null);
  const [editingMemberIncomeId, setEditingMemberIncomeId] = useState<string | null>(null);
  const [tempIncomeStr, setTempIncomeStr] = useState('');
  const [monthClosedSuccess, setMonthClosedSuccess] = useState(false);
  const [confirmDeleteCurrent, setConfirmDeleteCurrent] = useState(false);

  // Settlement for the chosen period
  const settlement = useMemo(() => {
    const periodTxs = transactions.filter(t => t.date.startsWith(selectedPeriod));
    return calculateHouseholdSettlement(periodTxs, members, selectedPeriod);
  }, [transactions, members, selectedPeriod]);

  // Copy Pix Code to clipboard
  const handleCopyPix = (pixPayload: string, index: number) => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPixIdx(index);
    setTimeout(() => setCopiedPixIdx(null), 2500);
  };

  // Close Month trigger
  const handleCloseMonthAction = () => {
    if (confirm(`Deseja realizar o Fechamento Mensal de ${selectedPeriod}? Os percentuais e saldos atuais serão congelados no histórico.`)) {
      onCloseMonth(selectedPeriod);
      setMonthClosedSuccess(true);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setMonthClosedSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Subtabs Bar */}
      <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubtab('settlement')}
          className={`flex-1 min-w-[90px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubtab === 'settlement'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>Acerto</span>
        </button>
        <button
          onClick={() => setActiveSubtab('members')}
          className={`flex-1 min-w-[90px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubtab === 'members'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Moradores</span>
        </button>
        <button
          onClick={() => setActiveSubtab('cards')}
          className={`flex-1 min-w-[90px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubtab === 'cards'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CardIcon className="w-3.5 h-3.5" />
          <span>Cartões</span>
        </button>
        <button
          onClick={() => setActiveSubtab('bills')}
          className={`flex-1 min-w-[90px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubtab === 'bills'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Boletos</span>
        </button>
        <button
          onClick={() => setActiveSubtab('settings')}
          className={`flex-1 min-w-[90px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubtab === 'settings'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Residência</span>
        </button>
      </div>

      {/* ================= SUBTAB 1: ACERTO DA CASA (DEBT SIMPLIFICATION) ================= */}
      {activeSubtab === 'settlement' && (
        <div className="space-y-4">
          {/* Header & Period Switcher */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Handshake className="w-4 h-4 text-emerald-400" />
                Acerto Financeiro da Casa
              </h2>
              <p className="text-[11px] text-slate-400">Compensação automática e quitação simplificada</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <input
                type="month"
                value={selectedPeriod}
                onChange={e => e.target.value && setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Balances Summary Table */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Posição de Cada Morador
            </h3>
            <div className="space-y-2">
              {settlement.memberBalances.map(mb => {
                const member = members.find(m => m.id === mb.memberId);
                const isCreditor = mb.netBalance > 0;
                const isSettled = mb.netBalance === 0;

                return (
                  <div
                    key={mb.memberId}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
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
                          Pagou: {formatBRL(mb.paidAmount)} | Cota: {formatBRL(mb.owedAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isSettled ? (
                        <span className="text-slate-400 font-semibold text-xs">Zerado</span>
                      ) : isCreditor ? (
                        <div>
                          <span className="text-[10px] text-emerald-400 font-semibold uppercase">Tem a receber</span>
                          <span className="text-sm font-extrabold text-emerald-400 block">
                            +{formatBRL(mb.netBalance)}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-rose-400 font-semibold uppercase">Deve pagar</span>
                          <span className="text-sm font-extrabold text-rose-400 block">
                            {formatBRL(mb.netBalance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minimal Transfers Set (Debt Simplification) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Menor Conjunto de Pagamentos para Zerar
                </h3>
                <p className="text-[11px] text-slate-400">
                  Algoritmo que elimina repasses cruzados entre pessoas
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded-lg">
                {settlement.transfersToSettle.length} transferência(s)
              </span>
            </div>

            {settlement.transfersToSettle.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Todas as obrigações deste período já estão perfeitamente balanceadas!
              </div>
            ) : (
              <div className="space-y-2.5">
                {settlement.transfersToSettle.map((t, idx) => {
                  const fromM = members.find(m => m.id === t.fromMemberId);
                  const toM = members.find(m => m.id === t.toMemberId);
                  const pixPayload = generatePixCopiaECola(
                    t.suggestedPixKey || 'pix@fincas.app',
                    toM?.displayName || 'Casa',
                    t.amount,
                    'Acerto FinCas'
                  );

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{fromM?.displayName.split(' ')[0]}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-emerald-400">{toM?.displayName.split(' ')[0]}</span>
                        </div>
                        <span className="text-base font-extrabold text-white">
                          {formatBRL(t.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>Chave Pix: <strong>{t.suggestedPixKey}</strong></span>
                        <button
                          onClick={() => handleCopyPix(pixPayload, idx)}
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg transition"
                        >
                          {copiedPixIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Pix</span>
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

          {/* Fechar Mês Button */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-emerald-400" />
                  Fechamento do Mês
                </h4>
                <p className="text-[11px] text-slate-400">
                  Registra o snapshot definitivo da renda e despesas sem recalcular despesas históricas.
                </p>
              </div>
              <button
                onClick={handleCloseMonthAction}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition"
              >
                Fechar Mês
              </button>
            </div>
            {monthClosedSuccess && (
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-semibold animate-in fade-in">
                ✓ Mês de {selectedPeriod} fechado com sucesso! Dados e percentuais preservados no snapshot.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUBTAB 2: MORADORES & SNAPSHOTS DE RENDA ================= */}
      {activeSubtab === 'members' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Moradores da Casa</h3>
                <p className="text-[11px] text-slate-400">Renda líquida e participação nas despesas</p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenHouseholdsModal && (
                  <button
                    onClick={onOpenHouseholdsModal}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>+ Convidar</span>
                  </button>
                )}
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Renda total: <strong className="text-white">{formatBRL(members.reduce((s, m) => s + m.netIncome, 0))}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {members.map(m => {
                const totalIncome = members.reduce((s, x) => s + x.netIncome, 0);
                const sharePct = ((m.netIncome / totalIncome) * 100).toFixed(1);

                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.avatar}
                        </div>
                        <div>
                          <span className="font-bold text-slate-200">{m.displayName}</span>
                          <span className="text-[10px] text-slate-400 block capitalize">
                            Função: {m.role === 'owner' ? 'Administrador' : m.role}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400 block">
                          {formatBRL(m.netIncome)}
                        </span>
                        <span className="text-[10px] text-slate-400">Cota atual: {sharePct}%</span>
                      </div>
                    </div>

                    {/* Quick Income Edit */}
                    <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                      {editingMemberIncomeId === m.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">R$</span>
                          <input
                            type="text"
                            value={tempIncomeStr}
                            onChange={e => setTempIncomeStr(e.target.value)}
                            placeholder="0,00"
                            className="bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-xs text-white font-bold w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const parsed = parseFloat(tempIncomeStr.replace(',', '.'));
                              if (!isNaN(parsed) && parsed > 0) {
                                onUpdateMemberIncome(m.id, toCents(parsed));
                              }
                              setEditingMemberIncomeId(null);
                            }}
                            className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 transition"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingMemberIncomeId(null)}
                            className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Privacidade padrão: Casa</span>
                          <button
                            onClick={() => {
                              setEditingMemberIncomeId(m.id);
                              setTempIncomeStr((m.netIncome / 100).toFixed(2));
                            }}
                            className="text-emerald-400 hover:underline font-semibold"
                          >
                            Ajustar Renda
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Snapshots Table (Demonstrates that historical income changes are strictly preserved!) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <h4 className="text-xs font-bold text-white">Histórico de Snapshots de Renda (Inalteráveis)</h4>
            <p className="text-[11px] text-slate-400">
              Registros mensais gravados para garantir que despesas antigas nunca sejam recalculadas
              quando a renda de um morador mudar.
            </p>
            <div className="space-y-1.5 pt-1">
              {snapshots.map(s => {
                const member = members.find(m => m.id === s.memberId);
                return (
                  <div
                    key={s.id}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{s.yearMonth}</span>
                      <span className="font-semibold text-slate-300">{member?.displayName}</span>
                    </div>
                    <div>
                      <span className="text-slate-300 font-bold">{formatBRL(s.netIncome)}</span>
                      <span className="text-slate-400 ml-2">({s.sharePercentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUBTAB 3: CARTÕES DE CRÉDITO ================= */}
      {activeSubtab === 'cards' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Cartões Cadastrados</h3>
                <p className="text-[11px] text-slate-400">
                  Regime de consumo imediato vs liquidação financeira da fatura
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {creditCards.map(card => {
                const owner = members.find(m => m.id === card.ownerMemberId);
                const used = card.creditLimit - card.availableLimit;
                const usedPct = Math.round((used / card.creditLimit) * 100);

                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl border border-slate-800 relative overflow-hidden shadow-lg space-y-3"
                    style={{ background: card.colorGradient }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-white block">{card.name}</span>
                        <span className="text-[10px] text-slate-300">{card.institution} • {owner?.displayName}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">
                        {usedPct}% usado
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-300 block">Limite Total</span>
                        <span className="font-bold text-white">{formatBRL(card.creditLimit)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-300 block">Limite Disponível</span>
                        <span className="font-bold text-emerald-300">{formatBRL(card.availableLimit)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-300 pt-2 border-t border-white/10">
                      <span>Fechamento: dia {card.closingDay}</span>
                      <span>Vencimento: dia {card.dueDay}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="font-semibold text-emerald-400 block mb-0.5">
                Regra Financeira Fundamental:
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                A compra no cartão é contabilizada como despesa de consumo imediato (e dividida na data da compra).
                O posterior pagamento da fatura representa quitação de passivo e não é duplicado no orçamento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUBTAB 4: BOLETOS & CONTAS ================= */}
      {activeSubtab === 'bills' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Boletos e Contas Recorrentes</h3>
                <p className="text-[11px] text-slate-400">Contas fixas de moradia e utilidades</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {bills.map(bill => {
                const assigned = members.find(m => m.id === bill.assignedToMemberId);
                const isPaid = bill.status === 'paid';

                return (
                  <div
                    key={bill.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-200 block">{bill.description}</span>
                        <span className="text-[10px] text-slate-400">{bill.beneficiary}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white block">{formatBRL(bill.amount)}</span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span>Vencimento: <strong>{bill.dueDate}</strong></span>
                      {!isPaid ? (
                        <button
                          onClick={() => onMarkBillPaid(bill.id)}
                          className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/30 transition"
                        >
                          Marcar como Pago
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Liquidado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUBTAB 5: RESIDÊNCIA & ZONA DE PERIGO ================= */}
      {activeSubtab === 'settings' && (
        <div className="space-y-4">
          {/* Household Info Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{household.name}</h3>
                  <p className="text-[11px] text-slate-400">Identificador: {household.id}</p>
                </div>
              </div>
              {onOpenHouseholdsModal && (
                <button
                  onClick={onOpenHouseholdsModal}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Trocar Casa</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Método Padrão de Divisão</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {household.defaultSplitMethod === 'proportional_income'
                    ? 'Proporcional à Renda dos Moradores'
                    : 'Divisão Igualitária (50/50)'}
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Regra Orçamentária</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {household.budgetPercentages.needs}% Essencial / {household.budgetPercentages.wants}% Desejos / {household.budgetPercentages.savings}% Metas
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Reserva de Emergência Alvo</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {household.emergencyFundMonthsTarget || 6} meses de despesas essenciais
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total de Moradores Ativos</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {members.length} {members.length === 1 ? 'morador' : 'moradores'}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Zona de Perigo</span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-100">Excluir esta Residência</h4>
              <p className="text-xs text-slate-400">
                Ao excluir <strong>"{household.name}"</strong>, todos os registros associados (despesas, boletos, contas a pagar, histórico de acertos e metas da casa) serão apagados permanentemente.
              </p>
            </div>

            {confirmDeleteCurrent ? (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl space-y-3 animate-in fade-in">
                <p className="text-xs text-rose-200 font-medium">
                  Tem certeza absoluta que deseja excluir a residência <strong>"{household.name}"</strong>? Esta ação não pode ser desfeita.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onDeleteHousehold) {
                        onDeleteHousehold(household.id);
                      }
                      setConfirmDeleteCurrent(false);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sim, Excluir Definitivamente</span>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteCurrent(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteCurrent(true)}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Residência</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
