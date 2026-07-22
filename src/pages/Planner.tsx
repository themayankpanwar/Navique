import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, AlertCircle, Sparkles, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import PlannerForm from '../components/PlannerForm';
import ItineraryDisplay from '../components/ItineraryDisplay';
import WeatherCard from '../components/WeatherCard';
import MapsCard from '../components/MapsCard';
import { ItinerarySkeleton } from '../components/Skeletons';
import { generateTripStream, saveTrip } from '../lib/api';
import { useToast } from '../components/Toast';
import type { TripInput } from '../lib/types';

type Phase = 'idle' | 'streaming' | 'done' | 'error';

function getGenerationHint(message: string): string {
  if (/PGRST125|Invalid path specified in request URL/i.test(message)) {
    return 'Your Supabase URL is misconfigured. Set VITE_SUPABASE_URL to https://<project-ref>.supabase.co (without /rest/v1).';
  }
  return 'This usually means the Gemini API key has no available model or its quota is exhausted. Check your Google AI Studio key and try again.';
}

export default function Planner() {
  const toast = useToast();
  const [input, setInput] = useState<TripInput | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (formInput: TripInput) => {
    setInput(formInput);
    setMarkdown('');
    setSaved(false);
    setError('');
    setPhase('streaming');

    const controller = new AbortController();
    abortRef.current = controller;

    // Smooth scroll to results once they start.
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

    try {
      await generateTripStream(
        formInput,
        (chunk) => setMarkdown((prev) => prev + chunk),
        controller.signal,
      );
      setPhase('done');
      toast('Itinerary ready!', 'success');
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      setPhase('error');
      toast(msg, 'error');
    }
  };

  const handleSave = async () => {
    if (!input || !markdown) return;
    try {
      await saveTrip(input, markdown);
      setSaved(true);
      toast('Trip saved to your history', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save trip', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-300 text-sm font-medium mb-4">
          <Compass className="w-4 h-4" /> Trip Planner
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-display text-slate-900 dark:text-white mb-3">
          Build your <span className="gradient-text">dream itinerary</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Fill in your preferences and watch AI craft a complete, day-by-day travel plan — streamed live.
        </p>
      </motion.div>

      {/* Form */}
      <PlannerForm onSubmit={handleGenerate} loading={phase === 'streaming'} />

      {/* Results */}
      <div ref={resultRef} className="mt-12 scroll-mt-24">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white mb-4 animate-float">
                <Plane className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your itinerary will appear here</h3>
              <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Fill in the form above and hit <span className="font-semibold text-brand-600 dark:text-brand-400">Generate</span> to see your personalized plan stream in real time, complete with weather and a map.
              </p>
            </motion.div>
          )}

          {phase === 'streaming' && markdown.length === 0 && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ItinerarySkeleton />
            </motion.div>
          )}

          {(phase === 'streaming' || phase === 'done') && markdown.length > 0 && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Weather + Maps row */}
              {input?.destination && phase === 'done' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <WeatherCard city={input.destination} />
                  <MapsCard destination={input.destination} />
                </div>
              )}
              <ItineraryDisplay
                markdown={markdown}
                streaming={phase === 'streaming'}
                input={input}
                saved={saved}
                onSave={handleSave}
              />
              {phase === 'done' && (
                <div className="text-center mt-8">
                  <Link to="/history" className="btn-ghost">
                    <Sparkles className="w-4 h-4" /> View all my saved trips
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 text-center border-rose-200 dark:border-rose-900/50"
            >
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-rose-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Couldn't generate your itinerary</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 max-w-md mx-auto">{error}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                {getGenerationHint(error)}
              </p>
              <button onClick={() => input && handleGenerate(input)} className="btn-primary">
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
