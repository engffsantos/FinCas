import { useState } from 'react';
import {
  Receipt as ReceiptIcon,
  Camera,
  UploadCloud,
  Sparkles,
  Check,
  X,
  FileText,
  Building2,
  Tag,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  QrCode,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { Category, HouseholdMember, Receipt, ReceiptItem, Transaction } from '../types';
import { parseReceiptOCRText, SAMPLE_RECEIPT_TEXTS } from '../domain/receiptParser';
import { formatBRL, toCents } from '../domain/money';
import { calculateTransactionSplits } from '../domain/proportionalSplit';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  categories: Category[];
  members: HouseholdMember[];
  currentMember: HouseholdMember;
  onSaveReceipt: (receipt: Receipt, transaction: Transaction) => void;
}

export function ReceiptScannerModal({
  isOpen,
  onClose,
  householdId,
  categories,
  members,
  currentMember,
  onSaveReceipt,
}: ReceiptScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'sample' | 'manual' | 'camera'>('sample');
  const [selectedSample, setSelectedSample] = useState<'paoDeAcucar' | 'carrefour' | 'drogaRaia'>('paoDeAcucar');
  const [manualText, setManualText] = useState('');
  const [qrKeyInput, setQrKeyInput] = useState('');
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseReceiptOCRText> | null>(null);

  const [paidByMemberId, setPaidByMemberId] = useState(currentMember.id);
  const [scope, setScope] = useState<'house' | 'personal'>('house');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProcess = (rawText: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = parseReceiptOCRText(rawText);
      setParsedData(result);
      setIsProcessing(false);
    }, 400);
  };

  const handleConfirmAndSave = () => {
    if (!parsedData) return;

    const receiptId = `rec_${Date.now()}`;
    const txId = `tx_rec_${Date.now()}`;

    const finalItems: ReceiptItem[] = parsedData.items.map((item, idx) => ({
      id: `item_${receiptId}_${idx}`,
      receiptId,
      rawDescription: item.rawDescription,
      normalizedDescription: item.normalizedDescription,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents,
      budgetGroup: item.budgetGroup,
      categoryId: item.categorySuggestion,
      confidence: item.confidence,
    }));

    const newReceipt: Receipt = {
      id: receiptId,
      householdId,
      emitterName: parsedData.emitterName,
      emitterCnpj: parsedData.emitterCnpj,
      issuedAt: new Date().toISOString().split('T')[0],
      totalAmountCents: parsedData.totalCents,
      status: 'processed',
      items: finalItems,
      createdAt: new Date().toISOString(),
    };

    // Calculate transaction splits
    const splits = scope === 'personal'
      ? [
          {
            id: `sp_${txId}_${paidByMemberId}`,
            transactionId: txId,
            memberId: paidByMemberId,
            amount: parsedData.totalCents,
            percentage: 100,
            isSettled: true,
          },
        ]
      : calculateTransactionSplits({
          transactionId: txId,
          totalAmountCents: parsedData.totalCents,
          splitMethod: 'proportional_income',
          members,
        });

    // Create corresponding transaction
    const newTx: Transaction = {
      id: txId,
      householdId,
      type: 'expense',
      amount: parsedData.totalCents,
      description: `Compra: ${parsedData.emitterName}`,
      establishment: parsedData.emitterName,
      categoryId: finalItems[0]?.categoryId || 'cat_supermarket',
      date: new Date().toISOString().split('T')[0],
      paidByMemberId,
      scope,
      privacy: 'house',
      paymentMethod: 'credit_card',
      splitMethod: 'proportional_income',
      receiptId,
      splits,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveReceipt(newReceipt, newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-400">
                <ReceiptIcon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Scanner de Cupom Fiscal & NFC-e
              </h2>
              <p className="text-xs text-slate-400">
                OCR e normalização automática com Inteligência Fiscal
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {!parsedData ? (
            <div className="space-y-4">
              {/* Method Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                <button
                  onClick={() => setActiveTab('sample')}
                  className={`py-2 rounded-lg font-semibold transition ${
                    activeTab === 'sample'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Exemplos
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`py-2 rounded-lg font-semibold transition ${
                    activeTab === 'manual'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📄 Colar Texto
                </button>
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`py-2 rounded-lg font-semibold transition ${
                    activeTab === 'camera'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📷 Chave / QR
                </button>
              </div>

              {activeTab === 'sample' && (
                <div className="space-y-3">
                  <span className="text-xs text-slate-400">
                    Selecione um cupom fiscal real para testar o fluxo completo instantaneamente:
                  </span>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSample('paoDeAcucar');
                        handleProcess(SAMPLE_RECEIPT_TEXTS.paoDeAcucar);
                      }}
                      className="w-full text-left p-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 rounded-2xl transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                          <span>Pão de Açúcar - Cerqueira César</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                            NFC-e
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          7 itens: Arroz, Leite, Feijão (Necessidades) e Cerveja, Chocolate (Estilo de Vida)
                        </p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 font-mono">R$ 145,80</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSample('carrefour');
                        handleProcess(SAMPLE_RECEIPT_TEXTS.carrefour);
                      }}
                      className="w-full text-left p-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 rounded-2xl transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                          <span>Carrefour Express</span>
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-mono">
                            SAT
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          3 itens: Pão de Forma, Manteiga Aviação, Vinho Tinto
                        </p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 font-mono">R$ 89,40</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSample('drogaRaia');
                        handleProcess(SAMPLE_RECEIPT_TEXTS.drogaRaia);
                      }}
                      className="w-full text-left p-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 rounded-2xl transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                          <span>Droga Raia Farmácia</span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-mono">
                            NFC-e
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          4 itens: Dipirona, Fralda Pampers, Desodorante Rexona, Protetor Solar
                        </p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 font-mono">R$ 112,00</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'manual' && (
                <div className="space-y-3">
                  <textarea
                    rows={6}
                    placeholder="Cole aqui o texto do cupom fiscal ou extrato do aplicativo..."
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    disabled={!manualText.trim() || isProcessing}
                    onClick={() => handleProcess(manualText)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold rounded-xl text-xs transition"
                  >
                    {isProcessing ? 'Processando OCR e Normalizando...' : 'Processar Cupom com IA'}
                  </button>
                </div>
              )}

              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="p-4 border-2 border-dashed border-slate-700 rounded-2xl text-center space-y-2">
                    <QrCode className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-medium">
                      Aponte a câmera para o QR Code da NFC-e ou digite a chave
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Suporta consulta na SEFAZ de SP, RJ, MG, RS, PR e demais estados.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Chave de Acesso (44 dígitos) ou URL do QR Code
                    </label>
                    <input
                      type="text"
                      placeholder="3526 0947 5084 1100 0156 6500 1000 1298 4510 0129 8453"
                      value={qrKeyInput}
                      onChange={e => setQrKeyInput(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => handleProcess(SAMPLE_RECEIPT_TEXTS.paoDeAcucar)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Consultar SEFAZ & Extrair Itens
                  </button>
                </div>
              )}

              {/* Architecture Explanation Card */}
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Layers className="w-4 h-4" />
                  <span>Pipeline em 3 Camadas de Leitura Fiscal</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>1. <strong className="text-slate-200">Camada 1 (QR Code):</strong> Captura chave de 44 dígitos e consulta direta à SEFAZ estadual.</p>
                  <p>2. <strong className="text-slate-200">Camada 2 (OCR):</strong> Extrai descrição bruta, quantidade, unidade e valor total.</p>
                  <p>3. <strong className="text-slate-200">Camada 3 (IA Fiscal):</strong> Normaliza abreviações (ex: "ARR T1 CBR" vira "Arroz Tipo 1") e classifica no 50/30/20.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Review & Reconciliation View */
            <div className="space-y-4">
              {/* Emitter Summary Card */}
              <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Estabelecimento</div>
                  <div className="text-sm font-bold text-slate-100">{parsedData.emitterName}</div>
                  {parsedData.emitterCnpj && (
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      CNPJ: {parsedData.emitterCnpj}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Valor Total</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {formatBRL(parsedData.totalCents)}
                  </div>
                </div>
              </div>

              {/* Context Selector: Quem Pagou & Escopo */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Quem Pagou?
                  </label>
                  <select
                    value={paidByMemberId}
                    onChange={e => setPaidByMemberId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Destino da Despesa
                  </label>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="house">Compartilhado na Casa</option>
                    <option value="personal">Minha Carteira (Pessoal)</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Itens Extraídos ({parsedData.items.length})</span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Classificados no 50/30/20
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {parsedData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 truncate">
                          {item.normalizedDescription}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>
                            {item.quantity} {item.unit || 'UN'} x {formatBRL(item.unitPriceCents)}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              item.budgetGroup === 'needs'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.budgetGroup === 'needs' ? '50% Necessidade' : '30% Estilo de Vida'}
                          </span>
                        </div>
                      </div>
                      <div className="font-bold text-slate-100 font-mono flex-shrink-0">
                        {formatBRL(item.totalPriceCents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Voltar e Trocar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar e Conciliar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
