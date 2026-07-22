import { Link } from 'react-router-dom';
import { Compass, Github, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center shadow-glow">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block font-display font-bold text-slate-900 dark:text-white text-lg">AI Travel Planner</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 font-semibold -mt-0.5">Personalized · Powered by AI</span>
            </div>
          </Link>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
            Generate beautiful, personalized travel itineraries in seconds. Tell us where you want to go, and let AI craft the perfect day-by-day plan — with hotels, food, hidden gems and more.
          </p>
          <div className="flex gap-3 mt-5">
            {[Github, Twitter, Instagram, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                aria-label="Social link"
              >
                <Icon className="w-4.5 h-4.5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Explore</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300">Home</Link></li>
            <li><Link to="/planner" className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300">Plan a Trip</Link></li>
            <li><Link to="/history" className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300">My Trips</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Resources</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#faq" className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300">FAQ</a></li>
            <li><a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300">Features</a></li>
            <li><a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300">How it works</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <p>© {new Date().getFullYear()} AI Travel Planner. Crafted for wanderers.</p>
          <p>Built with React, FastAPI & OpenAI.</p>
        </div>
      </div>
    </footer>
  );
}
