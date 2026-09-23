import { useState } from 'react';
import { Household, HouseholdMember, SmartAlert, User } from '../types';
import { formatBRL } from '../domain/money';
import {
  Users,
  User as UserIcon,
  Bell,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Info,
  Home,
  ChevronDown,
  Receipt,
  CalendarCheck2,
} from 'lucide-react';

interface HeaderProps {
  household: Household;
  members: HouseholdMember[];
  currentMember: HouseholdMember;
  currentUser: User;
  activePerspective: 'house' | 'personal';
  onPerspectiveChange: (p: 'house' | 'personal') => void;
  onMemberChange: (memberId: string) => void;
  alerts: SmartAlert[];
  onOpenDocs: () => void;
  onOpenHouseholds: () => void;
  onOpenReceiptScanner: () => void;
  onOpenMonthlyClosing: () => void;
  onOpenAuth: () => void;
}

export function Header({
  household,
  members,
  currentMember,
  currentUser,
  activePerspective,
  onPerspectiveChange,
  onMemberChange,
  alerts,
  onOpenDocs,
  onOpenHouseholds,
  onOpenReceiptScanner,
  onOpenMonthlyClosing,
  onOpenAuth,
}: HeaderProps) {
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showMemberSelect, setShowMemberSelect] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top bar: House Selector, Quick Actions, Profile */}
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* House Switcher Trigger */}
        <button
          onClick={onOpenHouseholds}
          className="flex items-center gap-2.5 text-left group hover:opacity-95 transition"
          title="Clique para alternar de residência"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <Home className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-emerald-300 transition">
                {household.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition" />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Renda coletiva:</span>
              <span className="font-semibold text-slate-300">
                {formatBRL(members.reduce((acc, m) => acc + m.netIncome, 0))}
              </span>
            </div>
          </div>
        </button>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Receipt Scanner */}
          <button
            onClick={onOpenReceiptScanner}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            title="Escanear Cupom Fiscal / NFC-e"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Quick Monthly Closing */}
          <button
            onClick={onOpenMonthlyClosing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            title="Fechamento Inteligente do Mês & Pix"
          >
            <CalendarCheck2 className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Documentation & Tests Modal Button */}
          <button
            onClick={onOpenDocs}
            className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition shadow-sm"
            title="Ver Documentação Arquitetural e Testes"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Docs</span>
          </button>

          {/* Notifications / Smart Alerts */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsMenu(!showAlertsMenu)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
              aria-label="Alertas inteligentes"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Alerts dropdown */}
            {showAlertsMenu && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-bold text-slate-200">Alertas e Insights Inteligentes</span>
                  <span className="text-[10px] text-slate-400">{alerts.length} alertas</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {alerts.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">Tudo equilibrado no momento!</div>
                  ) : (
                    alerts.map(a => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 flex gap-2.5 text-xs"
                      >
                        {a.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : a.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-200 text-xs">{a.title}</p>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{a.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Auth Profile Trigger */}
          <button
            onClick={onOpenAuth}
            className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            title="Minha Conta & Autenticação"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Perspective Toggle: Minha Carteira vs Nossa Casa */}
      <div className="max-w-4xl mx-auto px-4 pb-2">
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => onPerspectiveChange('house')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activePerspective === 'house'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Nossa Casa ({household.name.split(' ')[0]})</span>
          </button>
          <button
            onClick={() => onPerspectiveChange('personal')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activePerspective === 'personal'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Minha Carteira ({currentMember.displayName.split(' ')[0]})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
