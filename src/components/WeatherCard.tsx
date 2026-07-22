import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CloudSun, Droplets, Wind, Thermometer, Clock, Loader2, AlertCircle } from 'lucide-react';
import { getWeather } from '../lib/api';
import type { WeatherData } from '../lib/types';
import { WeatherSkeleton } from './Skeletons';

const iconMap: Record<string, string> = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

export default function WeatherCard({ city }: { city: string }) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    getWeather(city)
      .then((w) => {
        if (active) {
          setData(w);
          setStatus('ok');
        }
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [city]);

  if (status === 'loading') return <WeatherSkeleton />;
  if (status === 'error' || !data) {
    return (
      <div className="glass-card p-6 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        <p className="text-sm text-slate-700 dark:text-slate-200">Weather data unavailable for "{city}".</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The OpenWeather API key may not be configured on the server.</p>
      </div>
    );
  }

  const stats = [
    { icon: Thermometer, label: 'Feels like', value: `${data.feelsLike}°C` },
    { icon: Droplets, label: 'Humidity', value: `${data.humidity}%` },
    { icon: Wind, label: 'Wind', value: `${data.windSpeed} km/h` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 bg-gradient-to-br from-brand-50/80 to-accent-50/60 dark:from-slate-800/80 dark:to-slate-900/60"
    >
      <div className="flex items-center gap-2 mb-4">
        <CloudSun className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Current weather</h3>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="text-5xl">{iconMap[data.icon] ?? '🌤️'}</div>
        <div>
          <div className="text-3xl font-bold font-display text-slate-900 dark:text-white">{data.temperature}°C</div>
          <div className="text-sm capitalize text-slate-700 dark:text-slate-200">{data.description}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{data.city}{data.country ? `, ${data.country}` : ''}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="text-center p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50">
            <s.icon className="w-4 h-4 mx-auto mb-1 text-brand-500" />
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-2xl bg-brand-50/60 dark:bg-slate-800/40">
        <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
        <div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Best time to visit</div>
          <div className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{data.bestTime}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Tiny loading marker exported for the planner when fetching weather.
export function WeatherLoading() {
  return (
    <div className="glass-card p-6 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading weather...
    </div>
  );
}
