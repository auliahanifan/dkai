import { Check, CheckCheck, Copy, ExternalLink, RotateCcw, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  generateTelegramSummary,
  type TelegramFormat,
  type TelegramTone,
} from '../lib/telegramSummary';
import type { DashboardMetrics, SalesFilters } from '../lib/salesAnalytics';

interface TelegramSummaryCardProps {
  metrics: DashboardMetrics;
  filters: SalesFilters;
}

function renderTelegramPreviewText(text: string, format: TelegramFormat) {
  if (format !== 'markdown') {
    return text;
  }
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function TelegramSummaryCard({ metrics, filters }: TelegramSummaryCardProps) {
  const [format, setFormat] = useState<TelegramFormat>('markdown');
  const [tone, setTone] = useState<TelegramTone>('executive');
  const autoText = generateTelegramSummary(metrics, filters, format, tone);
  const [draft, setDraft] = useState<string>(autoText);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

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

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(draft)}`;

  const nowTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const charCount = draft.length;
  const lineCount = draft.split('\n').filter((l) => l.trim().length > 0).length;

  return (
    <section
      id="telegram-summary"
      className="scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-xs">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              Ringkasan Siap Kirim untuk Telegram
            </h2>
            <p className="text-xs text-slate-500">
              Format terstruktur ramah layar HP (atau mode 1 paragraf) · otomatis sinkron filter
              aktif.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tone / Layout preset */}
          <div
            className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-[11px] font-semibold"
            role="group"
            aria-label="Gaya ringkasan"
          >
            <button
              type="button"
              onClick={() => setTone('executive')}
              className={`rounded-[10px] px-2.5 py-1.5 transition-colors ${
                tone === 'executive'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ringkas
            </button>
            <button
              type="button"
              onClick={() => setTone('operational')}
              className={`rounded-[10px] px-2.5 py-1.5 transition-colors ${
                tone === 'operational'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Operasional
            </button>
            <button
              type="button"
              onClick={() => setTone('paragraph')}
              className={`rounded-[10px] px-2.5 py-1.5 transition-colors ${
                tone === 'paragraph'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1 Paragraf
            </button>
          </div>

          {/* Format toggle */}
          <div
            className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-[11px] font-semibold"
            role="group"
            aria-label="Format teks Telegram"
          >
            <button
              type="button"
              onClick={() => setFormat('markdown')}
              className={`rounded-[10px] px-2.5 py-1.5 transition-colors ${
                format === 'markdown'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              **Bold**
            </button>
            <button
              type="button"
              onClick={() => setFormat('plain')}
              className={`rounded-[10px] px-2.5 py-1.5 transition-colors ${
                format === 'plain'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Polos
            </button>
          </div>

          <a
            href={telegramShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#229ED9]" />
            <span>Buka Telegram</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all ${
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
                <span>Salin Pesan</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-12">
        {/* Editable Textarea */}
        <div className="flex flex-col lg:col-span-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Editor Draft</span>
              {isEdited && (
                <span className="text-[11px] font-semibold text-amber-700">· Diedit manual</span>
              )}
            </div>
            <div className="flex items-center gap-2.5 text-[11px] tabular-nums">
              <span className="font-medium text-slate-500">
                {lineCount} baris · {charCount} kar
              </span>
              {isEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(autoText);
                    setIsEdited(false);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-[#C81E2B]"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
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
            rows={12}
            aria-label="Ringkasan untuk Telegram"
            className="w-full flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 font-mono text-[12px] leading-relaxed text-slate-800 outline-none transition focus:border-[#229ED9] focus:bg-white focus:ring-2 focus:ring-[#229ED9]/20"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            Tips: <strong className="font-semibold text-slate-700">Ringkas</strong> paling nyaman
            dibaca cepat di Telegram, <strong className="font-semibold text-slate-700">Operasional</strong>{' '}
            menambahkan salesman &amp; radar churn, atau pilih{' '}
            <strong className="font-semibold text-slate-700">1 Paragraf</strong> untuk format padat.
          </p>
        </div>

        {/* Mobile Telegram Chat Preview */}
        <div className="lg:col-span-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Pratinjau Klien Telegram</span>
            <span className="text-[11px] text-slate-400">Simulasi layar mobile</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-[#DDE8F0] shadow-inner">
            {/* Telegram Top Bar */}
            <div className="flex items-center gap-2.5 bg-[#229ED9] px-3.5 py-2.5 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">
                DK
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold leading-tight">
                  Sales Manager · Dua Kelinci
                </div>
                <div className="text-[10px] text-sky-100">online · grup regional</div>
              </div>
            </div>

            {/* Chat Bubble Area */}
            <div className="p-3.5">
              <div className="ml-auto max-w-[97%] rounded-2xl rounded-br-sm bg-[#EFFDDE] px-4 py-3 text-[12.5px] leading-[1.6] text-slate-800 shadow-xs ring-1 ring-emerald-900/5">
                <p className="whitespace-pre-line break-words">
                  {renderTelegramPreviewText(draft, format)}
                </p>
                <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-emerald-700/80 tabular-nums">
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
