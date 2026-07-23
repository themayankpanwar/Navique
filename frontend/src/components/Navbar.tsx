import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/planner', label: 'Plan a Trip' },
  { to: '/history', label: 'My Trips' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto glass rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between"
      >
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="block font-display font-bold text-slate-900 dark:text-white text-lg">Navique</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 font-semibold -mt-0.5">Planner</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                  active
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {l.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-brand-50 dark:bg-slate-800 rounded-xl -z-10"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/planner" className="hidden sm:inline-flex btn-primary !px-5 !py-2.5 text-sm">
            Start Planning
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden max-w-7xl mx-auto mt-2 glass rounded-2xl p-2 flex flex-col"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                pathname === l.to
                  ? 'text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </motion.div>
      )}
    </header>
  );
}
