import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Copy,
  Download,
  Printer,
  Share2,
  Trash2,
  Loader2,
  Sparkles,
  Calendar,
  Check,
} from 'lucide-react';
import { renderMarkdown } from '../lib/markdown';
import type { TripInput } from '../lib/types';
import { useToast } from './Toast';

interface Props {
  markdown: string;
  streaming: boolean;
  input: TripInput | null;
  tripId?: string;
  saved?: boolean;
  onSave?: () => void;
  onDelete?: () => void;
}

// Split the streaming markdown into per-day cards for an animated reveal.
function splitByDays(md: string): { title: string; body: string }[] {
  const parts: { title: string; body: string }[] = [];
  const dayRegex = /(^|\n)###\s+Day\s+\d+/g;
  const matches = [...md.matchAll(dayRegex)];
  if (matches.length === 0) return [{ title: '', body: md }];

  // Heading before the first day (Trip Overview etc.)
  const firstIdx = matches[0].index ?? 0;
  if (firstIdx > 0) {
    const head = md.slice(0, firstIdx).trim();
    if (head) parts.push({ title: 'Trip Overview', body: head });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? matches[i + 1].index : md.length;
    const section = md.slice(start, end).trim();
    const titleMatch = section.match(/###\s+(Day\s+\d+)/);
    parts.push({ title: titleMatch ? titleMatch[1] : `Section ${i + 1}`, body: section });
  }
  return parts;
}

// Everything after the day-by-day section (hotels, restaurants, tips, etc.)
function splitAppendix(md: string): { title: string; body: string }[] {
  const appRegex = /(^|\n)##\s+(Recommended Hotels|Recommended Restaurants|Local Transportation|Estimated Budget Breakdown|Packing Checklist|Safety Tips|Best Local Foods|Hidden Gems|Emergency Contacts|Travel Tips)/g;
  const matches = [...md.matchAll(appRegex)];
  if (matches.length === 0) return [];

  const sections: { title: string; body: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? matches[i + 1].index : md.length;
    const section = md.slice(start, end).trim();
    const titleMatch = section.match(/##\s+(.+)/);
    sections.push({ title: titleMatch ? titleMatch[1] : `Section`, body: section });
  }
  return sections;
}

const sectionIcons: Record<string, typeof Bookmark> = {
  'Recommended Hotels': Calendar,
  'Recommended Restaurants': Calendar,
  'Local Transportation': Calendar,
  'Estimated Budget Breakdown': Calendar,
  'Packing Checklist': Check,
  'Safety Tips': Calendar,
  'Best Local Foods': Calendar,
  'Hidden Gems': Calendar,
  'Emergency Contacts': Calendar,
  'Travel Tips': Calendar,
};

export default function ItineraryDisplay({ markdown, streaming, input, saved, onSave, onDelete }: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => splitByDays(markdown), [markdown]);
  const appendix = useMemo(() => splitAppendix(markdown), [markdown]);
  const overview = days.find((d) => d.title === 'Trip Overview');
  const dayCards = days.filter((d) => d.title !== 'Trip Overview');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast('Itinerary copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 48;
      const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(`AI Travel Planner — ${input?.destination ?? 'Trip'}`, margin, y);
      y += 24;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const meta = [
        `Budget: ${input?.budget ?? '-'}`,
        `Travel type: ${input?.travelType ?? '-'}`,
        `Interests: ${input?.interests.join(', ') || '-'}`,
      ].join('   |   ');
      const metaLines = doc.splitTextToSize(meta, maxWidth);
      doc.text(metaLines, margin, y);
      y += metaLines.length * 14 + 8;

      // Strip markdown markers for a cleaner PDF, keep readable structure.
      const plain = markdown
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

      doc.setFontSize(11);
      const lines = doc.splitTextToSize(plain, maxWidth);
      for (const line of lines) {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 15;
      }

      doc.save(`trip-${input?.destination?.toLowerCase().replace(/\s+/g, '-') ?? 'plan'}.pdf`);
      toast('PDF downloaded', 'success');
    } catch {
      toast('Failed to generate PDF', 'error');
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) {
      toast('Pop-up blocked — allow pop-ups to print', 'error');
      return;
    }
    win.document.write(`<html><head><title>Trip — ${input?.destination ?? 'Plan'}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:48px;line-height:1.6;color:#111;max-width:760px;margin:auto;}
        h1,h2,h3{color:#1f47f5;} table{border-collapse:collapse;width:100%;margin:12px 0;}
        th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#eef4ff;}
        ul,ol{margin:8px 0;padding-left:24px;} blockquote{border-left:4px solid #3366ff;padding-left:12px;color:#555;font-style:italic;}
        code{background:#f1f5f9;padding:2px 6px;border-radius:4px;}
      </style></head><body>${renderMarkdown(markdown)}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleShare = async () => {
    const shareData = {
      title: `My AI trip to ${input?.destination ?? 'a destination'}`,
      text: `Check out my AI-generated itinerary for ${input?.destination}!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast('Shared', 'success');
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast('Share link copied to clipboard', 'success');
      }
    } catch {
      toast('Share cancelled', 'info');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const Toolbar = () => (
    <div className="flex flex-wrap gap-2">
      <button onClick={handleCopy} className="btn-outline !py-2 !px-3.5 text-sm">
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />} Copy
      </button>
      <button onClick={handleDownloadPDF} className="btn-outline !py-2 !px-3.5 text-sm">
        <Download className="w-4 h-4" /> PDF
      </button>
      <button onClick={handlePrint} className="btn-outline !py-2 !px-3.5 text-sm">
        <Printer className="w-4 h-4" /> Print
      </button>
      <button onClick={handleShare} className="btn-outline !py-2 !px-3.5 text-sm">
        <Share2 className="w-4 h-4" /> Share
      </button>
      {onSave && (
        <button onClick={handleSave} disabled={saving || saved} className="btn-primary !py-2 !px-3.5 text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save'}
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="btn-outline !py-2 !px-3.5 text-sm !text-rose-500 !border-rose-200 dark:!border-rose-900/50 hover:!bg-rose-50 dark:hover:!bg-rose-950/30">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
            {input?.destination ? `Your ${input.destination} trip` : 'Your itinerary'}
          </h2>
          {streaming && (
            <span className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium animate-pulse-soft">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> streaming
            </span>
          )}
        </div>
        <Toolbar />
      </div>

      {/* Overview */}
      {overview && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-gradient-to-br from-brand-50/70 to-accent-50/50 dark:from-slate-800/70 dark:to-slate-900/50">
          <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(overview.body) }} />
        </motion.div>
      )}

      {/* Day cards */}
      <div className="grid grid-cols-1 gap-5">
        <AnimatePresence>
          {dayCards.map((day, i) => (
            <motion.div
              key={day.title + i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.4) }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center text-white font-bold font-display shrink-0">
                  {i + 1}
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">{day.title}</h3>
              </div>
              <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(day.body) }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Appendix sections (hotels, food, tips, etc.) */}
      {appendix.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {appendix.map((sec, i) => {
            const Icon = sectionIcons[sec.title] ?? Calendar;
            return (
              <motion.div
                key={sec.title + i}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.06, 0.4) }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">{sec.title}</h3>
                </div>
                <div className="markdown text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(sec.body) }} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Streaming cursor */}
      {streaming && (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">AI is still writing...</span>
        </div>
      )}
    </div>
  );
}
