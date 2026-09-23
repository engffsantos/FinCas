import { useState, useMemo } from 'react';
import { Transaction, HouseholdMember, Category } from '../types';
import { formatBRL } from '../domain/money';
import {
  Search,
  Filter,
  CreditCard,
  QrCode,
  Calendar,
  Lock,
  EyeOff,
  Users,
  User,
  ChevronDown,
  Trash2,
  Tag,
  Store,
} from 'lucide-react';

interface TransactionsListProps {
  transactions: Transaction[];
  members: HouseholdMember[];
  categories: Category[];
  currentMember: HouseholdMember;
  onDeleteTransaction: (id: string) => void;
  onOpenQuickAdd: () => void;
}

export function TransactionsList({
  transactions,
  members,
  categories,
  currentMember,
  onDeleteTransaction,
  onOpenQuickAdd,
}: TransactionsListProps) {
  const [filterScope, setFilterScope] = useState<'all' | 'house' | 'personal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  const memberMap = useMemo(() => {
    return new Map(members.map(m => [m.id, m]));
  }, [members]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Privacy filter
      if (tx.privacy === 'private' && tx.paidByMemberId !== currentMember.id) {
        return false;
      }

      // Scope filter
      if (filterScope === 'house' && tx.scope === 'personal') return false;
      if (filterScope === 'personal' && tx.scope !== 'personal') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(q);
        const estMatch = tx.establishment?.toLowerCase().includes(q);
        const cat = categoryMap.get(tx.categoryId);
        const catMatch = cat?.name.toLowerCase().includes(q);
        return descMatch || estMatch || catMatch;
      }

      return true;
    });
  }, [transactions, filterScope, searchQuery, currentMember, categoryMap]);

  return (
    <div className="space-y-4 pb-8">
      {/* Top search & filter bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por descrição, estabelecimento ou categoria..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Scope tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterScope('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterScope === 'all'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({transactions.length})
          </button>
          <button
            onClick={() => setFilterScope('house')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterScope === 'house'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Casa ({transactions.filter(t => t.scope !== 'personal').length})
          </button>
          <button
            onClick={() => setFilterScope('personal')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterScope === 'personal'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Pessoais ({transactions.filter(t => t.scope === 'personal').length})
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <p className="text-slate-400 text-xs">Nenhum lançamento encontrado para estes filtros.</p>
            <button
              onClick={onOpenQuickAdd}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md hover:bg-emerald-400 transition"
            >
              Criar Novo Lançamento
            </button>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const cat = categoryMap.get(tx.categoryId);
            const payer = memberMap.get(tx.paidByMemberId);
            const isExpanded = expandedTxId === tx.id;
            const isSharedSummary = tx.privacy === 'shared_summary' && tx.paidByMemberId !== currentMember.id;

            return (
              <div
                key={tx.id}
                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm transition hover:border-slate-700"
              >
                {/* Main Item Row */}
                <div
                  onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Category / Scope badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${cat?.color || '#10b981'}22` }}
                    >
                      <Tag className="w-4 h-4" style={{ color: cat?.color || '#10b981' }} />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200 text-xs">
                          {isSharedSummary ? 'Gasto Pessoal Confidencial' : tx.description}
                        </span>
                        {tx.scope === 'house' ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            Casa
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                            Pessoal
                          </span>
                        )}
                        {tx.privacy === 'private' && (
                          <span title="Privado">
                            <Lock className="w-3 h-3 text-slate-500" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{tx.date}</span>
                        {tx.establishment && !isSharedSummary && (
                          <span className="flex items-center gap-0.5 text-slate-400">
                            • <Store className="w-2.5 h-2.5" /> {tx.establishment}
                          </span>
                        )}
                        <span>• Pago por: <strong>{payer?.displayName.split(' ')[0]}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold block ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : ''}
                      {formatBRL(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {tx.paymentMethod === 'credit_card' ? 'Cartão' : tx.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Progressive Disclosure: Expanded Details */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-slate-950/70 border-t border-slate-800/80 text-xs space-y-3 animate-in fade-in">
                    {/* Splits Table */}
                    {tx.scope !== 'personal' && tx.splits.length > 0 && (
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                          Divisão entre os moradores ({tx.splitMethod === 'proportional_income' ? 'Proporcional à Renda' : 'Partes Iguais'}):
                        </span>
                        <div className="space-y-1">
                          {tx.splits.map(split => {
                            const member = memberMap.get(split.memberId);
                            return (
                              <div
                                key={split.id}
                                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800/60 text-xs"
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                    style={{ backgroundColor: member?.color }}
                                  >
                                    {member?.avatar}
                                  </div>
                                  <span className="text-slate-300 font-medium">
                                    {member?.displayName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">({split.percentage}%)</span>
                                </div>
                                <span className="font-semibold text-slate-200">
                                  {formatBRL(split.amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Metadata & Actions */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <div>
                        <span>Grupo 50/30/20: </span>
                        <strong className="text-slate-300">
                          {cat?.budgetGroup === 'needs'
                            ? '50% Necessidades'
                            : cat?.budgetGroup === 'wants'
                            ? '30% Estilo de Vida'
                            : '20% Prioridades'}
                        </strong>
                      </div>

                      {/* Delete button (Owner or Payer) */}
                      {(currentMember.role === 'owner' || tx.paidByMemberId === currentMember.id) && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (confirm('Deseja excluir esta transação?')) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
