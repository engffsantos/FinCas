import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  Household,
  HouseholdMember,
  Transaction,
  Bill,
  FinancialGoal,
  User,
} from '../types';

/**
 * Creates or updates user record in Firestore upon authentication
 */
export async function syncUserProfileToFirestore(user: User): Promise<void> {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const existingSnap = await getDoc(userRef);
    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        name: user.name || auth.currentUser.displayName || 'Usuário',
        email: auth.currentUser.email || user.email,
        pixKey: user.pixKey || auth.currentUser.email || '',
        avatarUrl: user.avatarUrl || auth.currentUser.photoURL || '',
        households: [uid],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(userRef, {
        name: user.name || auth.currentUser.displayName || 'Usuário',
        pixKey: user.pixKey || auth.currentUser.email || '',
        avatarUrl: user.avatarUrl || auth.currentUser.photoURL || '',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Ensure a Household document and its owner member exist in Firestore
 */
export async function ensureHouseholdInFirestore(
  household: Household,
  ownerUser: User,
  ownerMember?: HouseholdMember
): Promise<void> {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const housePath = `households/${household.id}`;

  try {
    const houseRef = doc(db, 'households', household.id);
    const snap = await getDoc(houseRef);

    if (!snap.exists()) {
      await setDoc(houseRef, {
        name: household.name,
        currency: 'BRL',
        ownerId: uid,
        defaultSplitMethod: household.defaultSplitMethod || 'proportional_income',
        budgetPercentages: household.budgetPercentages || { needs: 50, wants: 30, savings: 20 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add owner as first member in members subcollection
      const memberRef = doc(db, `households/${household.id}/members`, uid);
      await setDoc(memberRef, {
        householdId: household.id,
        userId: uid,
        displayName: ownerMember?.displayName || ownerUser.name || auth.currentUser.displayName || 'Morador',
        role: 'owner',
        netIncome: ownerMember?.netIncome || 500000,
        color: ownerMember?.color || '#10b981',
        avatar: ownerMember?.avatar || 'ME',
        joinedAt: new Date().toISOString().split('T')[0],
        permissions: ownerMember?.permissions || {
          canInvite: true,
          canEditRules: true,
          canAddSharedIncome: true,
          canEditExpenses: true,
          canDeleteExpenses: true,
          canCloseMonth: true,
          canViewOtherIncomes: true,
          canViewAssets: true,
          canViewPrivateDetails: true,
        },
      });

      // Update user households array
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentHouseholds = userSnap.data().households || [];
        if (!currentHouseholds.includes(household.id)) {
          await updateDoc(userRef, {
            households: [...currentHouseholds, household.id],
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, housePath);
  }
}

/**
 * Create a new real Household in Firestore
 */
export async function createRealHouseholdInFirestore(
  household: Household,
  ownerUser: User,
  ownerMember: HouseholdMember
): Promise<void> {
  await ensureHouseholdInFirestore(household, ownerUser, ownerMember);
}

/**
 * Save Transaction to Firestore
 */
export async function saveTransactionToFirestore(householdId: string, tx: Transaction): Promise<void> {
  if (!auth.currentUser) return;
  const path = `households/${householdId}/transactions/${tx.id}`;
  try {
    const txRef = doc(db, `households/${householdId}/transactions`, tx.id);
    await setDoc(txRef, {
      ...tx,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete Transaction from Firestore
 */
export async function deleteTransactionFromFirestore(householdId: string, txId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `households/${householdId}/transactions/${txId}`;
  try {
    const txRef = doc(db, `households/${householdId}/transactions`, txId);
    await deleteDoc(txRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save or update Bill in Firestore
 */
export async function saveBillToFirestore(householdId: string, bill: Bill): Promise<void> {
  if (!auth.currentUser) return;
  const path = `households/${householdId}/bills/${bill.id}`;
  try {
    const billRef = doc(db, `households/${householdId}/bills`, bill.id);
    await setDoc(billRef, {
      ...bill,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save Member to Firestore
 */
export async function saveMemberToFirestore(householdId: string, member: HouseholdMember): Promise<void> {
  if (!auth.currentUser) return;
  const path = `households/${householdId}/members/${member.id}`;
  try {
    const memberRef = doc(db, `households/${householdId}/members`, member.id);
    await setDoc(memberRef, member);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save Goal to Firestore
 */
export async function saveGoalToFirestore(householdId: string, goal: FinancialGoal): Promise<void> {
  if (!auth.currentUser) return;
  const path = `households/${householdId}/goals/${goal.id}`;
  try {
    const goalRef = doc(db, `households/${householdId}/goals`, goal.id);
    await setDoc(goalRef, goal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Real-time subscription to a household's subcollections.
 * CRITICAL CONSTRAINT (Firebase Skill):
 * "Only attach onSnapshot listeners if auth is ready and user is authenticated."
 */
export function subscribeToHouseholdData(
  householdId: string,
  callbacks: {
    onMembers: (members: HouseholdMember[]) => void;
    onTransactions: (transactions: Transaction[]) => void;
    onBills: (bills: Bill[]) => void;
    onGoals: (goals: FinancialGoal[]) => void;
  }
): () => void {
  // Never attach listeners if user is not authenticated
  if (!auth.currentUser) {
    return () => {};
  }

  const membersPath = `households/${householdId}/members`;
  const txsPath = `households/${householdId}/transactions`;
  const billsPath = `households/${householdId}/bills`;
  const goalsPath = `households/${householdId}/goals`;

  const unsubMembers = onSnapshot(
    collection(db, membersPath),
    snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HouseholdMember));
      if (list.length > 0) callbacks.onMembers(list);
    },
    error => handleFirestoreError(error, OperationType.LIST, membersPath)
  );

  const unsubTxs = onSnapshot(
    collection(db, txsPath),
    snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      callbacks.onTransactions(list);
    },
    error => handleFirestoreError(error, OperationType.LIST, txsPath)
  );

  const unsubBills = onSnapshot(
    collection(db, billsPath),
    snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bill));
      callbacks.onBills(list);
    },
    error => handleFirestoreError(error, OperationType.LIST, billsPath)
  );

  const unsubGoals = onSnapshot(
    collection(db, goalsPath),
    snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FinancialGoal));
      callbacks.onGoals(list);
    },
    error => handleFirestoreError(error, OperationType.LIST, goalsPath)
  );

  return () => {
    unsubMembers();
    unsubTxs();
    unsubBills();
    unsubGoals();
  };
}

/**
 * Delete a Household document from Firestore
 */
export async function deleteHouseholdFromFirestore(householdId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `households/${householdId}`;
  try {
    const houseRef = doc(db, 'households', householdId);
    await deleteDoc(houseRef);

    // Update user's households array if present
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentHouseholds: string[] = userSnap.data().households || [];
      if (currentHouseholds.includes(householdId)) {
        await updateDoc(userRef, {
          households: currentHouseholds.filter(id => id !== householdId),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
