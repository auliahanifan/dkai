import { Check, CheckCheck, Copy, RotateCcw, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { generateTelegramSummary, type TelegramFormat } from '../lib/telegramSummary';
import type { DashboardMetrics, SalesFilters } from '../lib/salesAnalytics';

interface TelegramSummaryCardProps {
  metrics: DashboardMetrics;
  filters: SalesFilters;
}

function renderTelegramPreviewText(text: string, format: TelegramFormat) {
  if (format !== 'markdown') {
    return text;
  }
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(1, -1)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function TelegramSummaryCard({ metrics, filters }: TelegramSummaryCardProps) {
  const [format, setFormat] = useState<TelegramFormat>('markdown');
  const autoText = generateTelegramSummary(metrics, filters, format);
  const [draft, setDraft] = useState<string>(autoText);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync draft automatically when data/filters/format change unless user manually edited
  useEffect(() => {
    setDraft(autoText);
    setIsEdited(false);
  }, [autoText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = draft;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const nowTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section
      id="telegram-summary"
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-xs">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Ringkasan 1 Paragraf untuk Telegram
            </h2>
            <p className="text-xs text-slate-500">
              Disusun otomatis dari data terfilter (100% akurat, siap tempel ke grup Sales Manager).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormat('plain')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                format === 'plain'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teks Polos
            </button>
            <button
              type="button"
              onClick={() => setFormat('markdown')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                format === 'markdown'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Markdown Telegram
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all ${
              copied ? 'bg-emerald-600' : 'bg-[#229ED9] hover:bg-[#1B8CC2]'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin untuk Telegram</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-12">
        {/* Editable Textarea */}
        <div className="flex flex-col lg:col-span-7">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Editor Ringkasan{' '}
              {isEdited && (
                <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  Diedit manual
                </span>
              )}
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 tabular-nums">
              <span>{draft.length} karakter</span>
              {isEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(autoText);
                    setIsEdited(false);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-[#C81E2B] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset otomatis
                </button>
              )}
            </div>
          </div>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setIsEdited(e.target.value !== autoText);
            }}
            rows={6}
            aria-label="Ringkasan satu paragraf untuk Telegram"
            className="w-full flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-[#229ED9] focus:bg-white focus:ring-2 focus:ring-[#229ED9]/20"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            Tips: Anda dapat mengedit catatan tambahan secara manual sebelum menekan tombol{' '}
            <strong className="font-semibold text-slate-700">Salin untuk Telegram</strong>.
          </p>
        </div>

        {/* Mobile Telegram Chat Preview */}
        <div className="lg:col-span-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Pratinjau Tampilan Telegram</span>
            <span className="text-[11px] text-slate-400">Simulasi layar HP</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-[#E6EEF4] shadow-inner">
            {/* Fake Telegram Top Bar */}
            <div className="flex items-center gap-2.5 bg-[#229ED9] px-3.5 py-2.5 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">
                DK
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold leading-tight">
                  Sales Manager · Dua Kelinci
                </div>
                <div className="text-[10px] text-sky-100">online</div>
              </div>
            </div>

            {/* Chat Bubble Area */}
            <div className="p-3.5">
              <div className="ml-auto max-w-[96%] rounded-2xl rounded-br-sm bg-[#EFFDDE] px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-800 shadow-xs ring-1 ring-emerald-900/5">
                <p className="break-words">{renderTelegramPreviewText(draft, format)}</p>
                <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-emerald-700/80 tabular-nums">
                  <span>{nowTime}</span>
                  <CheckCheck className="h-3.5 w-3.5 text-[#229ED9]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
