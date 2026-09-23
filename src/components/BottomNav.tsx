import { LayoutDashboard, ReceiptText, Plus, PieChart, Home } from 'lucide-react';

export type TabType = 'home' | 'transactions' | 'planning' | 'house';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenQuickAction: () => void;
}

export function BottomNav({ activeTab, onTabChange, onOpenQuickAction }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Início */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition ${
            activeTab === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1">Início</span>
        </button>

        {/* Transações */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition ${
            activeTab === 'transactions' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] mt-1">Extrato</span>
        </button>

        {/* Central Plus Button (+) */}
        <div className="relative -top-5">
          <button
            onClick={onOpenQuickAction}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition border-4 border-slate-950"
            aria-label="Adicionar lançamento rápido"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Planejamento (50/30/20, Metas, Fluxo) */}
        <button
          onClick={() => onTabChange('planning')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition ${
            activeTab === 'planning' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] mt-1">Planejar</span>
        </button>

        {/* Casa (Acertos, Moradores, Cartões) */}
        <button
          onClick={() => onTabChange('house')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition ${
            activeTab === 'house' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">Casa</span>
        </button>
      </div>
    </nav>
  );
}
