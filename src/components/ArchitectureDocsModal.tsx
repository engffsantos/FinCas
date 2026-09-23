import { useState } from 'react';
import { runAllFinancialUnitTests, TestResult } from '../domain/tests';
import {
  X,
  BookOpen,
  CheckCircle2,
  XCircle,
  Play,
  Database,
  Shield,
  Layers,
  Code2,
  FileText,
  Workflow,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureDocsModal({ isOpen, onClose }: ArchitectureDocsModalProps) {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState<'tests' | 'architecture' | 'database_sql' | 'firebase_rls' | 'algorithms' | 'roadmap'>('tests');
  const [testResults, setTestResults] = useState<TestResult[]>(() => runAllFinancialUnitTests());

  const handleRerunTests = () => {
    setTestResults(runAllFinancialUnitTests());
  };

  const allPassed = testResults.every(t => t.passed);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Topbar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>FinCas • Documento de Arquitetura & Testes Unitários</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  v1.0 MVP
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Blueprint completo de engenharia financeira e validação de regras de negócio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveSection('tests')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSection === 'tests'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Testes Unitários ({testResults.filter(t => t.passed).length}/{testResults.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('architecture')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSection === 'architecture'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Arquitetura & Personas</span>
          </button>
          <button
            onClick={() => setActiveSection('database_sql')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSection === 'database_sql'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Modelagem & DDL SQL</span>
          </button>
          <button
            onClick={() => setActiveSection('algorithms')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSection === 'algorithms'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Algoritmos Financeiros</span>
          </button>
          <button
            onClick={() => setActiveSection('roadmap')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSection === 'roadmap'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Roadmap & MVP</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1 leading-relaxed">
          {/* ================= SECTION 1: UNIT TESTS ================= */}
          {activeSection === 'tests' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    {allPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>Bateria de Testes Financeiros Automatizados</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Garante precisão monetária em centavos inteiros, split proporcional, simplificação de dívidas e 50/30/20.
                  </p>
                </div>
                <button
                  onClick={handleRerunTests}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reexecutar</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {t.passed ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                        )}
                        <span className="font-bold text-slate-200">{t.name}</span>
                      </div>
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                          t.passed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {t.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 pl-4.5 text-slate-400">
                      <div>
                        <span className="block text-slate-400">Esperado:</span>
                        <code className="text-slate-300 font-mono">{t.expected}</code>
                      </div>
                      <div>
                        <span className="block text-slate-400">Obtido:</span>
                        <code className="text-emerald-300 font-mono">{t.actual}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= SECTION 2: ARQUITETURA & PERSONAS ================= */}
          {activeSection === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">1. Resumo do Produto (FinCas)</h3>
                <p>
                  O <strong>FinCas</strong> é um sistema mobile-first de governança e gestão financeira colaborativa para moradores da mesma residência.
                  Ele resolve a fricção de finanças compartilhadas oferecendo simultaneamente as perspectivas <em>Nossa Casa</em> e <em>Minha Carteira</em>,
                  aplicando a metodologia 50/30/20 flexível, divisão proporcional à renda líquida com snapshots mensais imutáveis,
                  e compensação inteligente de dívidas (Debt Simplification) para liquidação sem atritos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">2. Principais Personas</h3>
                <ul className="space-y-2 list-disc pl-4 text-slate-300">
                  <li>
                    <strong>Carlos (O Gestor da Casa - Owner):</strong> Renda R$ 6.500. Concentra o pagamento do aluguel e despesas maiores. Precisa saber exatamente quanto os outros moradores devem reembolsar sem ter que cobrar manualmente em conversas desconfortáveis.
                  </li>
                  <li>
                    <strong>Mariana (A Moradora Cuidadosa - Adulto):</strong> Renda R$ 4.500. Paga contas pontuais (condomínio, internet) e quer manter seus gastos pessoais privados, mas garantir que sua participação no orçamento coletivo seja justa e proporcional.
                  </li>
                  <li>
                    <strong>Bruno (O Morador Iniciante - Membro):</strong> Renda R$ 3.000. Tem orçamento mais apertado; valoriza a transparência da divisão proporcional para não pagar mais do que sua capacidade financeira permite.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">6. Arquitetura do Sistema</h3>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] space-y-1 text-slate-300">
                  <p>┌─────────────────────────────────────────────────────────────┐</p>
                  <p>│               CLIENT LAYER (Mobile First UI)               │</p>
                  <p>│ React + TypeScript + Tailwind CSS + Motion + Lucide Icons   │</p>
                  <p>├─────────────────────────────────────────────────────────────┤</p>
                  <p>│                       DOMAIN ENGINE                         │</p>
                  <p>│ • Money (Integer cents precision & remainder distribution) │</p>
                  <p>│ • Proportional Split Engine (Snapshots & Custom Rules)     │</p>
                  <p>│ • Debt Simplification Netting (Greedy Min-Transfers)       │</p>
                  <p>│ • 50/30/20 Budget Pacing Engine (Needs, Wants, Savings)    │</p>
                  <p>│ • Cash Flow Projections (7d, 15d, 30d, 60d, 90d)          │</p>
                  <p>├─────────────────────────────────────────────────────────────┤</p>
                  <p>│                PERSISTENCE & SECURITY LAYER                 │</p>
                  <p>│ PostgreSQL + Supabase RLS Policies + Audit Logs            │</p>
                  <p>└─────────────────────────────────────────────────────────────┘</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 3: DATABASE & DDL ================= */}
          {activeSection === 'database_sql' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">9. SQL Inicial das Tabelas (PostgreSQL / Supabase)</h3>
                <pre className="p-3 bg-slate-900 rounded-xl font-mono text-[10px] text-emerald-300 overflow-x-auto max-h-80 leading-relaxed">
{`-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CASAS (HOUSEHOLDS)
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  default_split_method VARCHAR(30) DEFAULT 'proportional_income',
  budget_needs_pct NUMERIC(5,2) DEFAULT 50.00,
  budget_wants_pct NUMERIC(5,2) DEFAULT 30.00,
  budget_savings_pct NUMERIC(5,2) DEFAULT 20.00,
  emergency_fund_months INT DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MORADORES (HOUSEHOLD_MEMBERS)
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'adult', -- owner, adult, member, viewer
  net_income_cents BIGINT NOT NULL DEFAULT 0,
  color VARCHAR(20) DEFAULT '#10b981',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_positive_income CHECK (net_income_cents >= 0)
);

-- 3. SNAPSHOT MENSAL DE RENDA (HOUSEHOLD_INCOME_SNAPSHOTS)
-- Garante que mudanças futuras de renda NÃO recalculem despesas do passado!
CREATE TABLE household_income_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL, -- YYYY-MM
  member_id UUID REFERENCES household_members(id) ON DELETE CASCADE,
  net_income_cents BIGINT NOT NULL,
  share_percentage NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (household_id, year_month, member_id)
);

-- 4. TRANSAÇÕES E DESPESAS (TRANSACTIONS)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- expense, income, transfer
  amount_cents BIGINT NOT NULL,
  description VARCHAR(255) NOT NULL,
  establishment VARCHAR(150),
  category_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  paid_by_member_id UUID REFERENCES household_members(id),
  scope VARCHAR(20) NOT NULL, -- personal, house, selected
  privacy VARCHAR(20) DEFAULT 'house', -- private, shared_summary, house
  payment_method VARCHAR(30) NOT NULL,
  split_method VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DIVISÃO DAS TRANSAÇÕES (TRANSACTION_SPLITS)
CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  member_id UUID REFERENCES household_members(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  is_settled BOOLEAN DEFAULT FALSE
);

-- 6. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  member_id UUID REFERENCES household_members(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);`}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">11. Políticas de Row Level Security (RLS)</h3>
                <pre className="p-3 bg-slate-900 rounded-xl font-mono text-[10px] text-cyan-300 overflow-x-auto leading-relaxed">
{`-- Ativar RLS em todas as tabelas
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só acessa transações da sua Casa
CREATE POLICY house_transactions_access ON transactions
FOR ALL USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

-- Política: Gastos estritamente privados só o autor pode ler os detalhes
CREATE POLICY private_transactions_isolation ON transactions
FOR SELECT USING (
  privacy != 'private' 
  OR paid_by_member_id IN (
    SELECT id FROM household_members WHERE user_id = auth.uid()
  )
);`}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-amber-400">12. Firebase Security Rules (firestore.rules)</h3>
                <p className="text-slate-400 text-[11px]">
                  Regras declarativas do Cloud Firestore que garantem isolamento multi-tenant por residência via <code>request.auth.uid</code>:
                </p>
                <pre className="p-3 bg-slate-900 rounded-xl font-mono text-[10px] text-amber-300 overflow-x-auto leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isMemberOf(householdId) {
      return isAuthenticated() && (
        exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid)) ||
        request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.households
      );
    }
    match /households/{householdId} {
      allow read, write: if isMemberOf(householdId);
      match /{subcollection}/{docId} {
        allow read, write: if isMemberOf(householdId);
      }
    }
    match /invites/{inviteId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {/* ================= SECTION 4: ALGORITHMS ================= */}
          {activeSection === 'algorithms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">13. Algoritmo de Divisão Proporcional à Renda</h3>
                <p className="text-slate-300">
                  Calcula a participação ponderada de cada morador dividindo o valor total em centavos inteiros.
                  Aplica o <em>Largest Remainder Method</em> (Método de Hamilton) para distribuir os centavos residuais,
                  assegurando matematicamente que:
                </p>
                <code className="p-2 rounded bg-slate-900 block font-mono text-emerald-300 text-[11px]">
                  ∑ (split[i].amount_cents) === total_amount_cents
                </code>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">14. Algoritmo de Compensação de Dívidas (Debt Simplification)</h3>
                <p className="text-slate-300">
                  Calcula o saldo líquido de cada morador (<code>net_balance = total_pago - total_devido</code>).
                  Separa credores (saldo positivo) e devedores (saldo negativo). Ordena de forma decrescente por magnitude
                  e casa o maior devedor com o maior credor iterativamente, transferindo <code>min(|debtor|, |creditor|)</code>.
                  Reduz uma teia de N*(N-1) transferências potenciais para no máximo N-1 transferências diretas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">16. Tratamento de Cartão de Crédito e Parcelamento</h3>
                <p className="text-slate-300">
                  <strong>Regime de Consumo vs Regime de Caixa:</strong> A compra no cartão de crédito é a despesa de consumo
                  reconhecida na data da transação e dividida imediatamente entre os moradores.
                  Compras parceladas em 10x geram um compromisso mestre e 10 parcelas mensais futuras nas faturas.
                  O pagamento da fatura bancária é estritamente uma liquidação de passivo circulante,
                  <strong>jamais duplicado como despesa de consumo no orçamento 50/30/20</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ================= SECTION 5: ROADMAP ================= */}
          {activeSection === 'roadmap' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-400">MVP 1 (Implementado & Operacional)</span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-300 space-y-1">
                    <li>Entidade Casa, Moradores e Permissões</li>
                    <li>Perspectiva dupla: Minha Carteira vs Nossa Casa</li>
                    <li>Orçamento 50/30/20 com pacing diário e alertas</li>
                    <li>Divisão proporcional à renda com snapshots mensais</li>
                    <li>Compensação inteligente de dívidas e Pix Copia e Cola</li>
                    <li>Lançamento ultrarrápido (&lt; 3s), Linguagem natural e Boleto OCR</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-400">MVP 2</span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-300 space-y-1">
                    <li>Importação e conciliação via extratos OFX / CSV</li>
                    <li>Push Notifications de vencimento e alertas de ritmo</li>
                    <li>Exportação de relatórios em PDF, Excel e CSV</li>
                    <li>Regras automáticas avançadas de recorrência</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-amber-400">MVP 3</span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-300 space-y-1">
                    <li>Bot de WhatsApp / Telegram para inclusão conversacional</li>
                    <li>OCR de notas fiscais via câmera com extração de itens</li>
                    <li>Machine learning de categorização e hábitos da casa</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-cyan-400">MVP 4</span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-300 space-y-1">
                    <li>Open Finance Brasil com deduplicação de transações</li>
                    <li>Iniciação de pagamentos Pix direta via API do BACEN</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
