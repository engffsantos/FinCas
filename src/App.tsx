import { useState, useEffect } from 'react';
import {
  getInitialState,
  saveState,
  addTransaction,
  deleteTransaction,
  addBill,
  updateBill,
  updateMemberIncome,
  saveIncomeSnapshot,
  updateBudgetPercentages,
  addGoal,
  switchHousehold,
  createHousehold,
  joinHouseholdByCode,
  createInvite,
  addReceipt,
  updateCurrentUser,
  clearMockData,
} from './services/storage';
import { AppState, Transaction, Bill, FinancialGoal, Receipt, User } from './types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import {
  syncUserProfileToFirestore,
  ensureHouseholdInFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  saveBillToFirestore,
  saveMemberToFirestore,
  saveGoalToFirestore,
  subscribeToHouseholdData,
} from './services/firestoreSync';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardHome } from './components/DashboardHome';
import { TransactionsList } from './components/TransactionsList';
import { PlanningView } from './components/PlanningView';
import { HouseManagementView } from './components/HouseManagementView';
import { QuickActionModal } from './components/QuickActionModal';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';
import { HouseholdSelectorModal } from './components/HouseholdSelectorModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { MonthlyClosingModal } from './components/MonthlyClosingModal';
import { AuthModal } from './components/AuthModal';
import { Sparkles, Database, CheckCircle2, Shield } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>(() => getInitialState());
  const [activePerspective, setActivePerspective] = useState<'house' | 'personal'>('house');
  const [currentMemberId, setCurrentMemberId] = useState<string>('mem_carlos');
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Modal dialog states
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isHouseholdsOpen, setIsHouseholdsOpen] = useState(false);
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  const [isMonthlyClosingOpen, setIsMonthlyClosingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Sync state to local persistence
  useEffect(() => {
    saveState(state);
  }, [state]);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      setIsAuthReady(true);
      if (fbUser) {
        setAuthUserId(fbUser.uid);
        const userObj: User = {
          id: fbUser.uid,
          name: fbUser.displayName || state.currentUser.name || 'Usuário',
          email: fbUser.email || state.currentUser.email,
          avatarUrl: fbUser.photoURL || state.currentUser.avatarUrl,
          pixKey: state.currentUser.pixKey || fbUser.email || '',
        };
        setState(prev => updateCurrentUser(prev, userObj));
        syncUserProfileToFirestore(userObj).catch(err => {
          console.warn('Firestore user sync notice:', err);
        });
      } else {
        setAuthUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for the active household
  // CRITICAL (Firebase Skill): Only attach onSnapshot listeners if auth is ready and user is authenticated
  useEffect(() => {
    if (!isAuthReady || !authUserId || !state.household?.id) return;

    let isCancelled = false;
    let unsub: (() => void) | null = null;

    ensureHouseholdInFirestore(state.household, state.currentUser, currentMember)
      .then(() => {
        if (isCancelled) return;
        unsub = subscribeToHouseholdData(state.household.id, {
          onMembers: members => {
            if (members && members.length > 0) {
              setState(prev => ({ ...prev, members }));
            }
          },
          onTransactions: transactions => {
            setState(prev => ({ ...prev, transactions }));
          },
          onBills: bills => {
            setState(prev => ({ ...prev, bills }));
          },
          onGoals: goals => {
            setState(prev => ({ ...prev, goals }));
          },
        });
      })
      .catch(err => {
        console.warn('Could not ensure household before subscription:', err);
      });

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  }, [isAuthReady, authUserId, state.household?.id]);

  const currentMember =
    state.members.find(m => m.id === currentMemberId) || state.members[0];

  // Check if mock transactions are currently present
  const isMockDataActive = state.transactions.some(
    t => t.id === 'tx_aluguel_set' || t.id === 'tx_mercado_1'
  );

  const handleClearMockData = () => {
    setState(prev => clearMockData(prev));
  };

  // HOUSEHOLD & MULTI-RESIDENCE ACTIONS
  const handleSwitchHousehold = (houseId: string) => {
    setState(prev => {
      const nextState = switchHousehold(prev, houseId);
      if (auth.currentUser) {
        ensureHouseholdInFirestore(nextState.household, nextState.currentUser, currentMember).catch(e =>
          console.warn('Ensure switched house notice:', e)
        );
      }
      return nextState;
    });
  };

  const handleCreateHousehold = (name: string, defaultSplitMethod: any, budgetPercentages: any) => {
    setState(prev => {
      const nextState = createHousehold(prev, name, defaultSplitMethod, budgetPercentages);
      if (auth.currentUser) {
        ensureHouseholdInFirestore(nextState.household, nextState.currentUser, currentMember).catch(e =>
          console.warn('Ensure created house notice:', e)
        );
      }
      return nextState;
    });
  };

  const handleJoinByCode = (code: string) => {
    const result = joinHouseholdByCode(state, code);
    if (result.success) {
      setState(result.newState);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const handleCreateInvite = (houseId: string) => {
    setState(prev => createInvite(prev, houseId));
  };

  // RECEIPT SCANNER & RECONCILIATION
  const handleSaveReceipt = (receipt: Receipt, tx: Transaction) => {
    setState(prev => {
      const withReceipt = addReceipt(prev, receipt);
      return addTransaction(withReceipt, tx);
    });
    saveTransactionToFirestore(state.household.id, tx).catch(err =>
      console.warn('Firestore tx save notice:', err)
    );
  };

  // USER PROFILE
  const handleUpdateCurrentUser = (user: User) => {
    setState(prev => updateCurrentUser(prev, user));
    syncUserProfileToFirestore(user).catch(err =>
      console.warn('Firestore user update notice:', err)
    );
  };

  // TRANSACTION ACTIONS
  const handleSaveTransaction = (newTx: Transaction) => {
    setState(prev => addTransaction(prev, newTx));
    saveTransactionToFirestore(state.household.id, newTx).catch(err =>
      console.warn('Firestore tx save notice:', err)
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setState(prev => deleteTransaction(prev, id, currentMember.id));
    deleteTransactionFromFirestore(state.household.id, id).catch(err =>
      console.warn('Firestore tx delete notice:', err)
    );
  };

  // BILL ACTIONS
  const handleSaveBill = (newBill: Bill) => {
    setState(prev => addBill(prev, newBill));
    saveBillToFirestore(state.household.id, newBill).catch(err =>
      console.warn('Firestore bill save notice:', err)
    );
  };

  const handleMarkBillPaid = (billId: string) => {
    const bill = state.bills.find(b => b.id === billId);
    if (!bill) return;

    const updatedBill: Bill = { ...bill, status: 'paid' };
    setState(prev => updateBill(prev, updatedBill));
    saveBillToFirestore(state.household.id, updatedBill).catch(err =>
      console.warn('Firestore bill update notice:', err)
    );

    const newTx: Transaction = {
      id: `tx_bill_${Date.now()}`,
      householdId: state.household.id,
      type: 'expense',
      amount: bill.amount,
      description: `Pagamento: ${bill.description}`,
      establishment: bill.beneficiary,
      categoryId: bill.categoryId,
      date: new Date().toISOString().split('T')[0],
      paidByMemberId: bill.assignedToMemberId || currentMember.id,
      scope: bill.scope,
      privacy: 'house',
      paymentMethod: 'boleto',
      splitMethod: bill.splitMethod,
      splits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => addTransaction(prev, newTx));
    saveTransactionToFirestore(state.household.id, newTx).catch(err =>
      console.warn('Firestore tx save notice:', err)
    );
  };

  // MEMBER INCOME ADJUSTMENT
  const handleUpdateMemberIncome = (memberId: string, newIncomeCents: number) => {
    setState(prev => {
      const updated = updateMemberIncome(prev, memberId, newIncomeCents, currentMember.id);
      const member = updated.members.find(m => m.id === memberId);
      if (member) {
        saveMemberToFirestore(state.household.id, member).catch(err =>
          console.warn('Firestore member update notice:', err)
        );
      }
      return updated;
    });
  };

  // CLOSE MONTH & TAKE HISTORICAL SNAPSHOT
  const handleCloseMonth = (yearMonth: string) => {
    setState(prev => saveIncomeSnapshot(prev, yearMonth));
  };

  // 50/30/20 PERCENTAGES UPDATE
  const handleUpdateBudgetPercentages = (percentages: { needs: number; wants: number; savings: number }) => {
    setState(prev => updateBudgetPercentages(prev, percentages, currentMember.id));
  };

  // GOALS ACTION
  const handleAddGoal = (goal: FinancialGoal) => {
    setState(prev => addGoal(prev, goal));
    if (state.household?.id) {
      saveGoalToFirestore(state.household.id, goal).catch(err =>
        console.warn('Firestore goal save notice:', err)
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        household={state.household}
        members={state.members}
        currentMember={currentMember}
        currentUser={state.currentUser}
        activePerspective={activePerspective}
        onPerspectiveChange={setActivePerspective}
        onMemberChange={setCurrentMemberId}
        alerts={state.alerts}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenHouseholds={() => setIsHouseholdsOpen(true)}
        onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
        onOpenMonthlyClosing={() => setIsMonthlyClosingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Body - Centered Mobile-First Layout */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-3 pb-24">
        {/* Real Data Notification / Mock Data Alert Banner */}
        {isMockDataActive ? (
          <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs text-slate-200 truncate">
                <span className="font-bold text-amber-300">Modo Simulação:</span> Carregado com dados fictícios.
              </div>
            </div>
            <button
              onClick={handleClearMockData}
              className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Usar Dados Reais</span>
            </button>
          </div>
        ) : (
          <div className="mb-3.5 px-3 py-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <strong>Modo Dados Reais:</strong> Conectado ao Cloud Firestore.
            </span>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="underline text-emerald-300 hover:text-emerald-200 font-medium"
            >
              Gerenciar Nuvem
            </button>
          </div>
        )}

        {activeTab === 'home' && (
          <DashboardHome
            household={state.household}
            members={state.members}
            currentMember={currentMember}
            activePerspective={activePerspective}
            transactions={state.transactions}
            bills={state.bills}
            categories={state.categories}
            goals={state.goals}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsList
            transactions={state.transactions}
            members={state.members}
            categories={state.categories}
            currentMember={currentMember}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenQuickAdd={() => setIsQuickActionOpen(true)}
          />
        )}

        {activeTab === 'planning' && (
          <PlanningView
            household={state.household}
            members={state.members}
            transactions={state.transactions}
            categories={state.categories}
            goals={state.goals}
            bills={state.bills}
            accounts={state.accounts}
            creditCards={state.creditCards}
            onUpdateBudgetPercentages={handleUpdateBudgetPercentages}
            onAddGoal={handleAddGoal}
          />
        )}

        {activeTab === 'house' && (
          <HouseManagementView
            household={state.household}
            members={state.members}
            currentMember={currentMember}
            snapshots={state.snapshots}
            transactions={state.transactions}
            creditCards={state.creditCards}
            bills={state.bills}
            onUpdateMemberIncome={handleUpdateMemberIncome}
            onCloseMonth={handleCloseMonth}
            onMarkBillPaid={handleMarkBillPaid}
            onOpenHouseholdsModal={() => setIsHouseholdsOpen(true)}
          />
        )}
      </main>

      {/* Bottom Floating Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
      />

      {/* Quick Action Modal (Fast / NLP Voice / Boleto OCR / Receipt trigger) */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        householdId={state.household.id}
        categories={state.categories}
        members={state.members}
        currentMember={currentMember}
        creditCards={state.creditCards}
        onSaveTransaction={handleSaveTransaction}
        onSaveBill={handleSaveBill}
        onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
      />

      {/* Multi-Households & Residences Switcher Modal */}
      <HouseholdSelectorModal
        isOpen={isHouseholdsOpen}
        onClose={() => setIsHouseholdsOpen(false)}
        currentUser={state.currentUser}
        households={state.households}
        activeHousehold={state.household}
        members={state.members}
        invites={state.invites}
        onSwitchHousehold={handleSwitchHousehold}
        onCreateHousehold={handleCreateHousehold}
        onJoinByCode={handleJoinByCode}
        onCreateInvite={handleCreateInvite}
      />

      {/* Receipt Scanner & Semantic Fiscal Normalization Modal */}
      <ReceiptScannerModal
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        householdId={state.household.id}
        categories={state.categories}
        members={state.members}
        currentMember={currentMember}
        onSaveReceipt={handleSaveReceipt}
      />

      {/* Smart Monthly Closing & Pix Copia e Cola Modal */}
      <MonthlyClosingModal
        isOpen={isMonthlyClosingOpen}
        onClose={() => setIsMonthlyClosingOpen(false)}
        household={state.household}
        members={state.members}
        currentMember={currentMember}
        transactions={state.transactions}
        categories={state.categories}
        snapshots={state.snapshots}
        onCloseMonth={handleCloseMonth}
      />

      {/* User Identity & Firebase Auth Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={state.currentUser}
        onUpdateUser={handleUpdateCurrentUser}
        onClearMockData={handleClearMockData}
      />

      {/* Architecture Docs & Unit Test Runner Modal */}
      <ArchitectureDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
