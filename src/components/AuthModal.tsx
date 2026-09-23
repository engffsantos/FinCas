import { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  LogOut,
  Sparkles,
  QrCode,
  Check,
  X,
  AlertCircle,
  Database,
  Trash2,
  LogIn,
} from 'lucide-react';
import { User } from '../types';
import { loginWithGoogle, logoutUser, auth } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onClearMockData?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onClearMockData,
}: AuthModalProps) {
  const [pixKey, setPixKey] = useState(currentUser.pixKey || 'engffsantos@gmail.com');
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'database'>('profile');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name: displayName,
      pixKey,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const fbUser = await loginWithGoogle();
      if (fbUser) {
        onUpdateUser({
          id: fbUser.uid,
          name: fbUser.displayName || currentUser.name,
          email: fbUser.email || currentUser.email,
          avatarUrl: fbUser.photoURL || currentUser.avatarUrl,
          pixKey: currentUser.pixKey || fbUser.email || '',
        });
      }
    } catch (err) {
      console.error('Google login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      onClose();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-400">
                <UserIcon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Meu Perfil & Autenticação
              </h2>
              <p className="text-xs text-slate-400">
                Firebase Firestore & Chave Pix Oficial
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

        {/* Tab Buttons */}
        <div className="px-5 pt-3 flex gap-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dados da Conta
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === 'database'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dados Reais / Nuvem
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Segurança & RLS
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-100 truncate">{currentUser.name}</div>
                  <div className="text-xs text-slate-400 font-mono truncate">{currentUser.email}</div>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Conta Conectada
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-slate-800/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sua Chave Pix para Receber Acertos da Casa
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  placeholder="Ex: seu email, CPF ou telefone"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Utilizada para gerar o payload oficial Pix (BACEN/EMVCo) nas compensações mensais.
                </p>
              </div>

              {/* Google Sign In action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>{isLoggingIn ? 'Autenticando...' : 'Conectar / Alternar com Conta Google'}</span>
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvo!</span>
                    </>
                  ) : (
                    <span>Salvar Dados</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <Database className="w-4 h-4" />
                  <span>Banco de Dados Real Ativo (Firestore)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  O FinCas está provisionado e conectado ao <strong>Google Cloud Firestore</strong>. Seus lançamentos, despesas e faturas são persistidos com isolamento de dados real por residência.
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-xs font-semibold text-slate-200">Limpar Dados de Simulação</div>
                <p className="text-[11px] text-slate-400">
                  Deseja remover as transações de demonstração (Pão de Açúcar fictício, aluguel teste, etc.) e começar com um histórico contábil 100% limpo com seus dados reais?
                </p>
                {showClearConfirm ? (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs text-rose-400 font-semibold">
                      Confirmar limpeza de dados de teste?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onClearMockData) onClearMockData();
                          setShowClearConfirm(false);
                          onClose();
                        }}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
                      >
                        Sim, Limpar e Usar Real
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 text-rose-400 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Demonstração & Iniciar com Dados Reais</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Isolamento por Residência & RLS Ativo</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  As regras de segurança do Firebase (Firestore Rules) garantem que apenas usuários autenticados pertencentes à residência tenham permissão de leitura e gravação nas transações e orçamentos daquela residência.
                </p>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1.5">
                <div className="font-semibold text-slate-200">UID do Usuário</div>
                <div className="font-mono text-[11px] text-slate-400">{currentUser.id}</div>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1.5">
                <div className="font-semibold text-slate-200">Provedor</div>
                <div className="text-[11px] text-slate-400">Firebase Authentication (Google)</div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition mt-2"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
