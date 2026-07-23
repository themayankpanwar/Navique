import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Plane,
  Search,
  Compass,
  Loader2,
} from 'lucide-react';
import { deleteTrip, listTrips } from '../lib/api';
import type { SavedTrip } from '../lib/types';
import { TripListSkeleton } from '../components/Skeletons';
import { useToast } from '../components/Toast';
import ItineraryDisplay from '../components/ItineraryDisplay';
import type { TripInput } from '../lib/types';

export default function History() {
  const toast = useToast();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<SavedTrip | null>(null);

  const load = () => {
    setLoading(true);
    listTrips()
      .then(setTrips)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load trips', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [toast]);

  const handleDelete = async (id: string, destination: string) => {
    setDeleting(id);
    try {
      await deleteTrip(id);
      setTrips((t) => t.filter((x) => x.id !== id));
      if (active?.id === id) setActive(null);
      toast(`Trip to ${destination} deleted`, 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete trip', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = trips.filter((t) =>
    t.destination.toLowerCase().includes(query.toLowerCase()),
  );

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const interestChips = (s: string | null) => (s ? s.split(', ').filter(Boolean) : []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-300 text-sm font-medium mb-3">
            <Compass className="w-4 h-4" /> My Trips
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900 dark:text-white">Trip history</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">{trips.length} saved {trips.length === 1 ? 'trip' : 'trips'}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search destination..."
              className="input-field pl-11"
            />
          </div>
          <Link to="/planner" className="btn-primary whitespace-nowrap">
            <Plane className="w-4 h-4" /> New trip
          </Link>
        </div>
      </motion.div>

      {loading ? (
        <TripListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white mb-4 animate-float">
            <Plane className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {trips.length === 0 ? 'No trips yet' : 'No matches'}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-5 max-w-sm mx-auto">
            {trips.length === 0
              ? 'Plan your first trip and save it here for later.'
              : 'Try a different search term.'}
          </p>
          <Link to="/planner" className="btn-primary">
            <Plane className="w-4 h-4" /> Plan a trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
              className="glass-card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-500" /> {t.destination}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5" /> {fmtDate(t.created_at)}
                  </p>
                </div>
              </div>

              {t.budget && (
                <span className="inline-flex w-fit text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-300 font-medium mb-3">
                  {t.budget}
                </span>
              )}

              <div className="flex flex-wrap gap-1.5 mb-3">
                {interestChips(t.interests).slice(0, 3).map((c) => (
                  <span key={c} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {c}
                  </span>
                ))}
                {interestChips(t.interests).length > 3 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    +{interestChips(t.interests).length - 3}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 flex-1">
                {t.itinerary.replace(/[#*`>]/g, '').slice(0, 140)}...
              </p>

              <div className="flex gap-2">
                <button onClick={() => setActive(t)} className="btn-outline flex-1 !py-2 text-sm">
                  <Eye className="w-4 h-4" /> View
                </button>
                <button
                  onClick={() => handleDelete(t.id, t.destination)}
                  disabled={deleting === t.id}
                  className="btn-outline !py-2 !px-3 !text-rose-500 !border-rose-200 dark:!border-rose-900/50 hover:!bg-rose-50 dark:hover:!bg-rose-950/30"
                  aria-label="Delete trip"
                >
                  {deleting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4 sticky -top-6 -mx-6 px-6 pt-6 pb-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-500" /> {active.destination}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {fmtDate(active.created_at)}{active.budget ? ` · ${active.budget}` : ''}
                  </p>
                </div>
                <button onClick={() => setActive(null)} className="btn-ghost !px-3 !py-2 text-sm">Close</button>
              </div>
              <SavedTripDetail trip={active} onDeleted={() => { setActive(null); load(); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Renders a saved trip with full toolbar (copy, PDF, print, share, delete).

function SavedTripDetail({ trip, onDeleted }: { trip: SavedTrip; onDeleted: () => void }) {
  const toast = useToast();
  const handleDelete = async () => {
    await deleteTrip(trip.id);
    toast(`Trip to ${trip.destination} deleted`, 'success');
    onDeleted();
  };

  const input: TripInput = {
    destination: trip.destination,
    startingLocation: trip.starting_location ?? '',
    budget: (trip.budget as TripInput['budget']) ?? 'Standard',
    travelType: (trip.travel_type as TripInput['travelType']) ?? 'Couple',
    transportation: (trip.transportation as TripInput['transportation']) ?? 'Flight',
    accommodation: (trip.accommodation as TripInput['accommodation']) ?? 'Hotel',
    interests: trip.interests ? trip.interests.split(', ') : [],
    specialRequests: trip.special_requests ?? '',
  };

  return (
    <ItineraryDisplay
      markdown={trip.itinerary}
      streaming={false}
      input={input}
      saved
      onDelete={handleDelete}
    />
  );
}
