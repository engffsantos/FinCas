import { useState } from 'react';
import {
  Home,
  Plus,
  KeyRound,
  Check,
  Copy,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Share2,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Household, HouseholdInvite, HouseholdMember, User } from '../types';

interface HouseholdSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  households: Household[];
  activeHousehold: Household;
  members: HouseholdMember[];
  invites: HouseholdInvite[];
  onSwitchHousehold: (houseId: string) => void;
  onCreateHousehold: (name: string, defaultSplitMethod: any, budgetPercentages: any) => void;
  onJoinByCode: (code: string) => { success: boolean; error?: string };
  onCreateInvite: (householdId: string) => void;
  onDeleteHousehold: (householdId: string) => void;
}

export function HouseholdSelectorModal({
  isOpen,
  onClose,
  currentUser,
  households,
  activeHousehold,
  members,
  invites,
  onSwitchHousehold,
  onCreateHousehold,
  onJoinByCode,
  onCreateInvite,
  onDeleteHousehold,
}: HouseholdSelectorModalProps) {
  const [view, setView] = useState<'list' | 'create' | 'join' | 'invite'>('list');
  const [newHouseName, setNewHouseName] = useState('');
  const [splitMethod, setSplitMethod] = useState<'proportional_income' | 'equal'>('proportional_income');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmDeleteHouseId, setConfirmDeleteHouseId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentHouseInvites = invites.filter(
    i => i.householdId === activeHousehold.id && i.status === 'active'
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseName.trim()) {
      setErrorMessage('Por favor, informe o nome da residência.');
      return;
    }
    onCreateHousehold(newHouseName.trim(), splitMethod, { needs: 50, wants: 30, savings: 20 });
    setNewHouseName('');
    setView('list');
    onClose();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) {
      setErrorMessage('Informe o código de convite.');
      return;
    }
    const result = onJoinByCode(inviteCodeInput.trim());
    if (result.success) {
      setInviteCodeInput('');
      setErrorMessage('');
      setView('list');
      onClose();
    } else {
      setErrorMessage(result.error || 'Código inválido.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {view === 'list' && 'Minhas Residências'}
                {view === 'create' && 'Nova Residência'}
                {view === 'join' && 'Entrar com Código'}
                {view === 'invite' && 'Convidar Moradores'}
              </h2>
              <p className="text-xs text-slate-400">
                {view === 'list' && 'Alterne entre suas casas e carteiras'}
                {view === 'create' && 'Cadastre um novo financeiro colaborativo'}
                {view === 'join' && 'Digite o código recebido do anfitrião'}
                {view === 'invite' && `Convites para ${activeHousehold.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (view !== 'list') setView('list');
              else onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {view === 'list' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Casas Ativas ({households.length})
                </span>
                <div className="space-y-2">
                  {households.map(house => {
                    const isSelected = house.id === activeHousehold.id;
                    const houseMembers = members.filter(m => m.householdId === house.id);
                    const isConfirmingDelete = confirmDeleteHouseId === house.id;

                    if (isConfirmingDelete) {
                      return (
                        <div
                          key={house.id}
                          className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-2.5 animate-in fade-in"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-rose-200">
                                Excluir "{house.name}"?
                              </h4>
                              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                                Esta ação é permanente e removerá todas as despesas, contas fixas e divisões desta residência.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-500/20">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteHouseId(null)}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteHousehold(house.id);
                                setConfirmDeleteHouseId(null);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition flex items-center gap-1.5 shadow-md shadow-rose-900/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Sim, Excluir</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={house.id}
                        className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between group ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
                        }`}
                      >
                        <div
                          onClick={() => {
                            onSwitchHousehold(house.id);
                            onClose();
                          }}
                          className="flex items-center gap-3 cursor-pointer flex-1 mr-2"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Home className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100 text-sm">{house.name}</span>
                              {isSelected && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
                                  Atual
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              <span>{houseMembers.length || 3} moradores</span>
                              <span>•</span>
                              <span>
                                {house.defaultSplitMethod === 'proportional_income'
                                  ? 'Divisão Proporcional'
                                  : 'Divisão Igualitária'}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                          <button
                            type="button"
                            title={`Excluir residência ${house.name}`}
                            onClick={e => {
                              e.stopPropagation();
                              setConfirmDeleteHouseId(house.id);
                            }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setView('create');
                    setErrorMessage('');
                  }}
                  className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition text-slate-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Criar Casa</span>
                </button>

                <button
                  onClick={() => {
                    setView('join');
                    setErrorMessage('');
                  }}
                  className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition text-slate-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Entrar com Código</span>
                </button>
              </div>

              {/* Active House Invites Shortcut */}
              <button
                onClick={() => setView('invite')}
                className="w-full p-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl flex items-center justify-between text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium">Convidar amigos para {activeHousehold.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {view === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome da Residência ou República
                </label>
                <input
                  type="text"
                  placeholder="Ex: Apartamento 42, Casa de Praia..."
                  value={newHouseName}
                  onChange={e => setNewHouseName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Regra Padrão de Divisão das Contas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitMethod('proportional_income')}
                    className={`p-3 rounded-xl border text-left transition ${
                      splitMethod === 'proportional_income'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">Proporcional à Renda</div>
                    <p className="text-[11px] leading-tight text-slate-400">
                      Quem ganha mais paga proporcionalmente mais (mais justo).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMethod('equal')}
                    className={`p-3 rounded-xl border text-left transition ${
                      splitMethod === 'equal'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">Igualitária (50/50)</div>
                    <p className="text-[11px] leading-tight text-slate-400">
                      Divide todas as despesas em partes iguais entre os moradores.
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  Criar e Acessar
                </button>
              </div>
            </form>
          )}

          {view === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Código de Convite (ex: FINCAS-8KJF2A)
                </label>
                <input
                  type="text"
                  placeholder="FINCAS-XXXXXX"
                  value={inviteCodeInput}
                  onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-center tracking-widest font-mono text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                  Dica de teste: utilize o código <span className="text-cyan-400 font-mono">REPUBLICA-SP26</span> ou <span className="text-emerald-400 font-mono">FINCAS-8KJF2A</span>.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
                >
                  Validar e Entrar
                </button>
              </div>
            </form>
          )}

          {view === 'invite' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Convites Ativos para {activeHousehold.name}
                  </span>
                  <button
                    onClick={() => onCreateInvite(activeHousehold.id)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo Código
                  </button>
                </div>

                {currentHouseInvites.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400">Nenhum convite ativo no momento.</p>
                    <button
                      onClick={() => onCreateInvite(activeHousehold.id)}
                      className="mt-2 text-xs bg-emerald-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Gerar Primeiro Código
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentHouseInvites.map(inv => (
                      <div
                        key={inv.code}
                        className="p-3 bg-slate-900 border border-slate-700/70 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                            {inv.code}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Usos: {inv.currentUses}/{inv.maxUses} • Válido até {new Date(inv.expiresAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(inv.code)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 flex items-center gap-1.5 transition border border-slate-700"
                        >
                          {copiedCode === inv.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setView('list')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Voltar à Lista
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
