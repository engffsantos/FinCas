import { useState } from 'react';
import {
  Category,
  HouseholdMember,
  PaymentMethod,
  ExpenseScope,
  SplitMethod,
  Transaction,
  Bill,
  CreditCard,
} from '../types';
import { toCents, formatBRL } from '../domain/money';
import { calculateTransactionSplits } from '../domain/proportionalSplit';
import { parseNaturalLanguageInput } from '../domain/quickParser';
import {
  X,
  Zap,
  Bot,
  FileText,
  Mic,
  MicOff,
  Check,
  ChevronDown,
  CreditCard as CardIcon,
  QrCode,
  Calendar,
  Layers,
  Upload,
  Receipt,
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  categories: Category[];
  members: HouseholdMember[];
  currentMember: HouseholdMember;
  creditCards: CreditCard[];
  onSaveTransaction: (tx: Transaction) => void;
  onSaveBill: (bill: Bill) => void;
  onOpenReceiptScanner?: () => void;
}

export function QuickActionModal({
  isOpen,
  onClose,
  householdId,
  categories,
  members,
  currentMember,
  creditCards,
  onSaveTransaction,
  onSaveBill,
  onOpenReceiptScanner,
}: QuickActionModalProps) {
  if (!isOpen) return null;

  const [activeMode, setActiveMode] = useState<'fast' | 'nlp' | 'boleto'>('fast');

  // FAST ENTRY STATE
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[1]?.id || categories[0]?.id);
  const [scope, setScope] = useState<ExpenseScope>('house');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0]?.id || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [paidByMemberId, setPaidByMemberId] = useState(currentMember.id);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('proportional_income');
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // NLP / VOICE STATE
  const [naturalText, setNaturalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ReturnType<typeof parseNaturalLanguageInput> | null>(null);

  // BOLETO OCR STATE
  const [boletoCode, setBoletoCode] = useState('');
  const [extractedBoleto, setExtractedBoleto] = useState<{
    beneficiary: string;
    amountCents: number;
    dueDate: string;
    code: string;
  } | null>(null);

  // HANDLE FAST SUBMISSION
  const handleFastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(rawVal) || rawVal <= 0) return;

    const amountCents = toCents(rawVal);
    const txId = `tx_${Date.now()}`;
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    // Calculate splits
    const splits = scope === 'personal'
      ? [
          {
            id: `sp_${txId}_${paidByMemberId}`,
            transactionId: txId,
            memberId: paidByMemberId,
            amount: amountCents,
            percentage: 100,
            isSettled: true,
          },
        ]
      : calculateTransactionSplits({
          transactionId: txId,
          totalAmountCents: amountCents,
          splitMethod,
          members,
        });

    const newTx: Transaction = {
      id: txId,
      householdId,
      type: 'expense',
      amount: amountCents,
      description: description || selectedCategory?.name || 'Despesa Rápida',
      categoryId: selectedCategoryId,
      date,
      paidByMemberId,
      scope,
      privacy: scope === 'personal' ? 'private' : 'house',
      paymentMethod,
      creditCardId: paymentMethod === 'credit_card' ? selectedCardId : undefined,
      splitMethod: scope === 'personal' ? 'selected_members' : splitMethod,
      splits,
      installmentTotal: installmentsCount > 1 ? installmentsCount : undefined,
      installmentNumber: installmentsCount > 1 ? 1 : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveTransaction(newTx);
    onClose();
  };

  // HANDLE NLP PARSE & CONFIRM
  const handleNLPAnalyze = () => {
    if (!naturalText.trim()) return;
    const parsed = parseNaturalLanguageInput(naturalText, categories);
    setParsedPreview(parsed);
  };

  const handleSimulateAudio = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const simulatedAudios = [
        'Gastei 42 reais no mercado no débito',
        'Paguei 180 de internet para a casa',
        'Enel conta de energia 210 no pix da casa',
        'Comprei remédio na farmácia 85 no crédito pessoal',
      ];
      const randomText = simulatedAudios[Math.floor(Math.random() * simulatedAudios.length)];
      setNaturalText(randomText);
      const parsed = parseNaturalLanguageInput(randomText, categories);
      setParsedPreview(parsed);
    }, 1500);
  };

  const handleConfirmNLP = () => {
    if (!parsedPreview || parsedPreview.amount <= 0) return;

    const txId = `tx_${Date.now()}`;
    const splits = parsedPreview.scope === 'personal'
      ? [
          {
            id: `sp_${txId}_${currentMember.id}`,
            transactionId: txId,
            memberId: currentMember.id,
            amount: parsedPreview.amount,
            percentage: 100,
            isSettled: true,
          },
        ]
      : calculateTransactionSplits({
          transactionId: txId,
          totalAmountCents: parsedPreview.amount,
          splitMethod: parsedPreview.splitMethod,
          members,
        });

    const newTx: Transaction = {
      id: txId,
      householdId,
      type: 'expense',
      amount: parsedPreview.amount,
      description: parsedPreview.description,
      establishment: parsedPreview.establishment,
      categoryId: parsedPreview.categoryId,
      date: new Date().toISOString().split('T')[0],
      paidByMemberId: currentMember.id,
      scope: parsedPreview.scope,
      privacy: parsedPreview.scope === 'personal' ? 'private' : 'house',
      paymentMethod: parsedPreview.paymentMethod,
      splitMethod: parsedPreview.splitMethod,
      splits,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveTransaction(newTx);
    onClose();
  };

  // HANDLE BOLETO OCR SIMULATION
  const handleSimulateBoletoScan = (type: 'enel' | 'aluguel' | 'vivo') => {
    if (type === 'enel') {
      setExtractedBoleto({
        beneficiary: 'Enel Distribuição São Paulo',
        amountCents: toCents(245.80),
        dueDate: '2026-09-28',
        code: '83660000002-4 45800138000-7 95810023405-3 81900000000-1',
      });
    } else if (type === 'aluguel') {
      setExtractedBoleto({
        beneficiary: 'Imobiliária Vila Nova Gestão',
        amountCents: toCents(3400.00),
        dueDate: '2026-10-10',
        code: '34191.79001 01043.510047 91020.150008 8 8910000340000',
      });
    } else {
      setExtractedBoleto({
        beneficiary: 'Vivo Fibra Telecomunicações',
        amountCents: toCents(169.90),
        dueDate: '2026-09-30',
        code: '84600000001-6 69900138000-4 95810023405-7 81900000000-0',
      });
    }
  };

  const handleConfirmBoleto = () => {
    if (!extractedBoleto) return;
    const newBill: Bill = {
      id: `bill_${Date.now()}`,
      householdId,
      description: `Boleto: ${extractedBoleto.beneficiary}`,
      beneficiary: extractedBoleto.beneficiary,
      amount: extractedBoleto.amountCents,
      dueDate: extractedBoleto.dueDate,
      categoryId: categories.find(c => c.budgetGroup === 'needs')?.id || 'cat_utilities',
      status: 'pending',
      barcode: extractedBoleto.code.replace(/[-. ]/g, ''),
      digitableLine: extractedBoleto.code,
      isRecurring: true,
      assignedToMemberId: currentMember.id,
      scope: 'house',
      splitMethod: 'proportional_income',
    };

    onSaveBill(newBill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Mode Tabs */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMode('fast')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeMode === 'fast'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ultrarrápido</span>
            </button>
            <button
              onClick={() => setActiveMode('nlp')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeMode === 'nlp'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Linguagem / Voz</span>
            </button>
            <button
              onClick={() => setActiveMode('boleto')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeMode === 'boleto'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Boleto OCR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenReceiptScanner) onOpenReceiptScanner();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30"
              title="Ler Nota Fiscal / NFC-e com IA"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nota Fiscal</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* ================= MODE 1: ULTRARRÁPIDO (< 3 SEGUNDOS) ================= */}
          {activeMode === 'fast' && (
            <form onSubmit={handleFastSubmit} className="space-y-4">
              {/* Big amount input */}
              <div className="text-center py-1">
                <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Valor da Despesa
                </label>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-2xl font-bold text-slate-400">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className="w-48 text-center text-4xl font-extrabold text-white bg-transparent border-b-2 border-emerald-500 focus:outline-none focus:border-emerald-400 tracking-tight"
                    autoFocus
                  />
                </div>
              </div>

              {/* Description / Establishment */}
              <div>
                <input
                  type="text"
                  placeholder="Descrição ou local (ex: Pão de Açúcar, Farmácia...)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category selector chips */}
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-2">
                  Categoria
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {categories.slice(0, 8).map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedCategoryId(c.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        selectedCategoryId === c.id
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pessoal vs Casa Toggle */}
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">
                  Destino do Gasto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope('house')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      scope === 'house'
                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/60 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>🏠 Compartilhado (Casa)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('personal')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      scope === 'personal'
                        ? 'bg-indigo-500/20 border-2 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>👤 Pessoal ({currentMember.displayName.split(' ')[0]})</span>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: 'pix', label: 'Pix', icon: '⚡' },
                    { id: 'debit_card', label: 'Débito', icon: '💳' },
                    { id: 'credit_card', label: 'Crédito', icon: '💎' },
                    { id: 'boleto', label: 'Boleto', icon: '📄' },
                  ].map(m => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5 transition ${
                        paymentMethod === m.id
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800/40'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit card selector if credit card is chosen */}
              {paymentMethod === 'credit_card' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Selecione o Cartão:</span>
                    <select
                      value={selectedCardId}
                      onChange={e => setSelectedCardId(e.target.value)}
                      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                    >
                      {creditCards.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.institution})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Parcelamento:</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={installmentsCount}
                        onChange={e => setInstallmentsCount(parseInt(e.target.value))}
                        className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                      >
                        <option value="1">À vista (1x)</option>
                        <option value="2">2x sem juros</option>
                        <option value="3">3x sem juros</option>
                        <option value="6">6x sem juros</option>
                        <option value="10">10x sem juros</option>
                        <option value="12">12x sem juros</option>
                      </select>
                    </div>
                  </div>
                  {installmentsCount > 1 && (
                    <div className="text-[11px] text-amber-400/90 font-medium">
                      💡 Gera uma compra de consumo imediato e {installmentsCount} parcelas futuras nas faturas.
                    </div>
                  )}
                </div>
              )}

              {/* Progressive Disclosure: Opções Avançadas */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-semibold"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  <span>Opções Avançadas (Quem pagou, Regra de divisão, Data)</span>
                </button>

                {showAdvanced && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    {/* Quem pagou */}
                    <div>
                      <span className="text-slate-400 block mb-1 font-semibold">Quem pagou a conta:</span>
                      <div className="flex gap-2">
                        {members.map(m => (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setPaidByMemberId(m.id)}
                            className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                              paidByMemberId === m.id
                                ? 'bg-slate-800 border-emerald-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                            <span>{m.displayName.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Regra de Divisão */}
                    {scope === 'house' && (
                      <div>
                        <span className="text-slate-400 block mb-1 font-semibold">Regra de Divisão Coletiva:</span>
                        <select
                          value={splitMethod}
                          onChange={e => setSplitMethod(e.target.value as SplitMethod)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                        >
                          <option value="proportional_income">Proporcional à Renda Líquida (Padrão)</option>
                          <option value="equal">Partes Iguais (50/50, 33/33/33)</option>
                          <option value="custom_percentage">Percentuais Personalizados</option>
                        </select>
                      </div>
                    )}

                    {/* Data do Gasto */}
                    <div>
                      <span className="text-slate-400 block mb-1 font-semibold">Data da Transação:</span>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Despesa</span>
              </button>
            </form>
          )}

          {/* ================= MODE 2: LINGUAGEM NATURAL & ÁUDIO ================= */}
          {activeMode === 'nlp' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  Assistente Financeiro Inteligente
                </p>
                <p className="text-[11px] text-slate-400">
                  Escreva ou fale livremente. O bot interpretará valor, categoria, grupo 50/30/20 e quem participa,
                  apresentando uma prévia para confirmação.
                </p>
              </div>

              {/* Text Input & Mic */}
              <div className="relative">
                <textarea
                  rows={3}
                  value={naturalText}
                  onChange={e => setNaturalText(e.target.value)}
                  placeholder='Ex: "Gastei 42 reais no mercado no débito" ou "Paguei 180 de internet para a casa"'
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 pr-12"
                />
                <button
                  type="button"
                  onClick={handleSimulateAudio}
                  disabled={isRecording}
                  className={`absolute right-3 bottom-3.5 p-2 rounded-full transition ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                  }`}
                  title="Falar ou simular áudio"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Analyze Button */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleNLPAnalyze}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
                >
                  Interpretar Texto
                </button>
                <button
                  type="button"
                  onClick={handleSimulateAudio}
                  className="px-4 py-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/50 text-indigo-300 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Simular Áudio</span>
                </button>
              </div>

              {/* Parsed Preview Card (Strict confirmation required) */}
              {parsedPreview && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Prévia Extraída com Sucesso
                    </span>
                    <span className="text-[10px] text-slate-400">Confirme antes de salvar</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Valor</span>
                      <span className="text-base font-extrabold text-white">
                        {formatBRL(parsedPreview.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Descrição / Local</span>
                      <span className="font-semibold text-slate-200">{parsedPreview.description}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Grupo 50/30/20</span>
                      <span className="font-semibold text-blue-300 uppercase text-[11px]">
                        {parsedPreview.budgetGroup === 'needs'
                          ? '50% Necessidades'
                          : parsedPreview.budgetGroup === 'wants'
                          ? '30% Estilo de Vida'
                          : '20% Prioridades'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Destino</span>
                      <span className="font-semibold text-slate-200">
                        {parsedPreview.scope === 'house' ? '🏠 Compartilhado (Casa)' : '👤 Pessoal'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Forma de Pagamento</span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {parsedPreview.paymentMethod}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Regra de Divisão</span>
                      <span className="font-semibold text-slate-200">
                        {parsedPreview.scope === 'house' ? 'Proporcional à Renda' : 'Individual'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmNLP}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
                  >
                    Confirmar e Gravar Transação
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= MODE 3: BOLETO OCR & LEITURA ================= */}
          {activeMode === 'boleto' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <p className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Leitor de Boletos & Contas
                </p>
                <p className="text-[11px] text-slate-400">
                  Carregue PDF, tire foto ou digite a linha digitável. O sistema extrai automaticamente
                  o beneficiário, valor, vencimento e código de barras para confirmação.
                </p>
              </div>

              {/* Upload or Mock Scan Buttons */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold block">
                  Simular Leitura OCR Automática:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateBoletoScan('enel')}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-200 text-xs text-center transition"
                  >
                    <span className="block text-base mb-0.5">⚡</span>
                    <span className="font-bold text-[11px] block">Conta de Luz</span>
                    <span className="text-[10px] text-slate-400">Enel (R$ 245,80)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateBoletoScan('aluguel')}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-200 text-xs text-center transition"
                  >
                    <span className="block text-base mb-0.5">🏠</span>
                    <span className="font-bold text-[11px] block">Aluguel</span>
                    <span className="text-[10px] text-slate-400">Imobiliária</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateBoletoScan('vivo')}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-200 text-xs text-center transition"
                  >
                    <span className="block text-base mb-0.5">🌐</span>
                    <span className="font-bold text-[11px] block">Internet Fibra</span>
                    <span className="text-[10px] text-slate-400">Vivo 600MB</span>
                  </button>
                </div>
              </div>

              {/* Manual Digitable line input */}
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Ou cole a Linha Digitável / Código de Barras:
                </label>
                <input
                  type="text"
                  placeholder="34191.79001 01043.510047 91020.150008..."
                  value={boletoCode}
                  onChange={e => setBoletoCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                />
              </div>

              {/* Extracted Confirmation Card */}
              {extractedBoleto && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Dados Extraídos do Boleto
                    </span>
                    <span className="text-[10px] text-slate-400">Confirmação obrigatória</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Beneficiário:</span>
                      <span className="font-semibold text-white">{extractedBoleto.beneficiary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valor do Boleto:</span>
                      <span className="font-bold text-amber-300 text-sm">
                        {formatBRL(extractedBoleto.amountCents)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Data de Vencimento:</span>
                      <span className="font-semibold text-slate-200">{extractedBoleto.dueDate}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Linha Digitável:</span>
                      <code className="text-[10px] font-mono text-slate-300 bg-slate-900 p-1.5 rounded block break-all">
                        {extractedBoleto.code}
                      </code>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmBoleto}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                  >
                    Confirmar e Agendar Conta na Casa
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
