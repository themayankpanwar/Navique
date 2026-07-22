import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Wallet,
  Users,
  Train,
  Building2,
  Heart,
  Sparkles,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  ACCOMMODATION_OPTIONS,
  BUDGET_OPTIONS,
  INTEREST_OPTIONS,
  TRANSPORT_OPTIONS,
  TRAVEL_TYPE_OPTIONS,
  type TripInput,
} from '../lib/types';

const budgetIcons: Record<string, string> = { Budget: '$', Standard: '$$', Luxury: '$$$' };
const transportIcons = { Flight: '✈', Train: '🚆', Car: '🚗' };
const travelTypeIcons = { Solo: '🧳', Couple: '💑', Family: '👨‍👩‍👧', Friends: '👬' };
const accommodationIcons = { Hotel: '🏨', Hostel: '🛏', Resort: '🏝', Airbnb: '🏠' };

const defaultInput: TripInput = {
  destination: '',
  startingLocation: '',
  budget: 'Standard',
  travelType: 'Couple',
  transportation: 'Flight',
  accommodation: 'Hotel',
  interests: [],
  specialRequests: '',
};

interface Props {
  onSubmit: (input: TripInput) => void;
  loading: boolean;
}

export default function PlannerForm({ onSubmit, loading }: Props) {
  const [input, setInput] = useState<TripInput>(defaultInput);

  const update = <K extends keyof TripInput>(key: K, value: TripInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const toggleInterest = (interest: string) =>
    setInput((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));

  const canSubmit = input.destination.trim().length > 1 && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(input);
  };

  const reset = () => setInput(defaultInput);

  const OptionRow = <K extends keyof TripInput>({
    label,
    icon: Icon,
    options,
    value,
    onSelect,
    renderIcon,
  }: {
    label: string;
    icon: typeof MapPin;
    options: readonly string[];
    value: string;
    onSelect: (v: TripInput[K]) => void;
    renderIcon?: (opt: string) => string;
  }) => (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
        <Icon className="w-4 h-4 text-brand-500" /> {label}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt as TripInput[K])}
            className={`chip justify-center !px-2 !py-2.5 text-sm ${value === opt ? 'chip-active' : 'chip-idle'}`}
          >
            {renderIcon && <span className="text-base">{renderIcon(opt)}</span>}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Destination + Starting location */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-500" /> Where are you going?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Destination <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={input.destination}
                onChange={(e) => update('destination', e.target.value)}
                placeholder="e.g. Tokyo, Japan"
                className="input-field pl-11"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Starting location
            </label>
            <div className="relative">
              <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={input.startingLocation}
                onChange={(e) => update('startingLocation', e.target.value)}
                placeholder="e.g. New York, USA"
                className="input-field pl-11"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Preferences grid */}
      <div className="glass-card p-6 space-y-6">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-500" /> Your preferences
        </h3>

        <OptionRow label="Budget" icon={Wallet} options={BUDGET_OPTIONS} value={input.budget} onSelect={(v) => update('budget', v as TripInput['budget'])} renderIcon={(o) => budgetIcons[o]} />
        <OptionRow label="Travel type" icon={Users} options={TRAVEL_TYPE_OPTIONS} value={input.travelType} onSelect={(v) => update('travelType', v as TripInput['travelType'])} renderIcon={(o) => travelTypeIcons[o as keyof typeof travelTypeIcons]} />
        <OptionRow label="Transportation" icon={Train} options={TRANSPORT_OPTIONS} value={input.transportation} onSelect={(v) => update('transportation', v as TripInput['transportation'])} renderIcon={(o) => transportIcons[o as keyof typeof transportIcons]} />
        <OptionRow label="Accommodation" icon={Building2} options={ACCOMMODATION_OPTIONS} value={input.accommodation} onSelect={(v) => update('accommodation', v as TripInput['accommodation'])} renderIcon={(o) => accommodationIcons[o as keyof typeof accommodationIcons]} />

        {/* Interests multi-select */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
            <Heart className="w-4 h-4 text-brand-500" /> Interests <span className="text-slate-500 dark:text-slate-400 font-normal">(pick any)</span>
          </label>
          <div className="flex flex-wrap gap-2.5">
            {INTEREST_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleInterest(opt)}
                className={`chip ${input.interests.includes(opt) ? 'chip-active' : 'chip-idle'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Special requests */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Special requests
          </label>
          <textarea
            value={input.specialRequests}
            onChange={(e) => update('specialRequests', e.target.value)}
            placeholder="e.g. vegetarian meals, wheelchair access, avoid crowded places, kid-friendly..."
            rows={3}
            className="input-field resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <button type="button" onClick={reset} className="btn-outline w-full sm:w-auto" disabled={loading}>
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
        <button type="submit" disabled={!canSubmit} className="btn-primary w-full sm:w-auto !px-8 !py-4 text-base">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Generate my itinerary
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-slate-600 dark:text-slate-300"
          >
            AI is crafting your day-by-day plan — streaming live below...
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
