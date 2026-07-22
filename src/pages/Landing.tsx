import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Map,
  CloudSun,
  ShieldCheck,
  Plane,
  Compass,
  Wand2,
  Download,
  Bookmark,
  Star,
  ChevronDown,
  Globe,
  Clock,
  Heart,
  Camera,
} from 'lucide-react';
import { useState } from 'react';

const heroImage =
  'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1920';

const features = [
  { icon: Wand2, title: 'AI-Powered Itineraries', desc: 'Personalized day-by-day plans crafted by AI from your unique travel preferences.' },
  { icon: CloudSun, title: 'Live Weather', desc: 'Real-time conditions, humidity, and wind speed for your destination, plus the best time to visit.' },
  { icon: Map, title: 'Maps & Attractions', desc: 'See your destination on the map with nearby attractions and points of interest.' },
  { icon: Bookmark, title: 'Save & Revisit', desc: 'Save trips to your history, revisit them anytime, or download them as PDF.' },
  { icon: Download, title: 'Export & Share', desc: 'Copy, print, or share your itinerary with travel companions in one click.' },
  { icon: ShieldCheck, title: 'Safety & Tips', desc: 'Every plan includes safety tips, emergency contacts, and local travel advice.' },
];

const steps = [
  { icon: Compass, title: 'Tell us your trip', desc: 'Pick a destination, budget, dates, travel type, transportation, accommodation, and interests.' },
  { icon: Sparkles, title: 'AI builds your plan', desc: 'Our AI streams a complete itinerary — activities, hotels, restaurants, hidden gems and more.' },
  { icon: Plane, title: 'Pack & go', desc: 'Get a packing checklist, weather forecast, map, and budget breakdown. Save, share, and travel.' },
];

const testimonials = [
  { name: 'Aisha K.', role: 'Solo traveler, Bali', text: 'The day-by-day plan was spot on. The hidden gems section led me to a waterfall I would never have found otherwise.', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { name: 'Marco R.', role: 'Family trip, Japan', text: 'Planned a 10-day Japan trip with kids in minutes. The budget breakdown was remarkably accurate.', avatar: 'https://images.pexels.com/photos/220457/pexels-photo-220457.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { name: 'Sofia L.', role: 'Couple, Iceland', text: 'Beautiful UI and the streaming response felt magical. We downloaded the PDF and used it the whole trip.', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200' },
];

const faqs = [
  { q: 'How does the AI generate my itinerary?', a: 'We send your destination, budget, travel type, interests, and special requests to OpenAI. It returns a detailed, day-by-day markdown itinerary with activities, hotels, restaurants, and tips — streamed live to your screen.' },
  { q: 'Is my travel data saved?', a: 'Only when you choose to save a trip. Saved trips are stored securely in the cloud and appear in your My Trips page. You can delete them at any time.' },
  { q: 'Can I edit the itinerary?', a: 'The AI-generated plan is a starting point. You can copy it to your notes, download it as a PDF, or share it with your group to refine together.' },
  { q: 'Does it work for any destination?', a: 'Yes. The planner works for cities, regions, and countries worldwide. The more specific your inputs, the better the result.' },
  { q: 'Do I need to create an account?', a: 'No account required. You can plan a trip instantly and optionally save it for later.' },
  { q: 'Can I use it on mobile?', a: 'Absolutely. The interface is fully responsive and optimized for phones, tablets, and desktops.' },
];

const stats = [
  { icon: Globe, value: '180+', label: 'Destinations' },
  { icon: Sparkles, value: '50k+', label: 'Trips planned' },
  { icon: Star, value: '4.9/5', label: 'User rating' },
  { icon: Clock, value: '< 30s', label: 'Avg. plan time' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <span className="font-semibold text-slate-900 dark:text-white">{q}</span>
        <ChevronDown className={`w-5 h-5 text-brand-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-slate-600 dark:text-slate-300 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 -mt-20 pt-20">
        <div className="absolute inset-0 -z-10">
          <img src={heroImage} alt="Travel destination" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center text-white max-w-4xl mx-auto pt-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" /> Powered by AI · Streamed in real time
          </motion.span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-display leading-[1.05] mb-6">
            Plan your perfect
            <span className="block bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              trip in seconds
            </span>
          </h1>

          <p className="text-lg md:text-xl text-blue-50 max-w-2xl mx-auto mb-8 leading-relaxed">
            Tell us where you want to go and what you love. Our AI crafts a beautiful,
            day-by-day itinerary — with hotels, restaurants, hidden gems, weather, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/planner" className="btn-primary !px-8 !py-4 text-base">
              <Plane className="w-5 h-5" /> Start Planning — Free
            </Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white bg-white/15 backdrop-blur-md border border-white/25 hover:bg-white/25 transition-all">
              See how it works
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-3xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass-card p-4 !bg-white/10 !border-white/15">
                <s.icon className="w-5 h-5 mx-auto mb-2 text-blue-100" />
                <div className="text-2xl font-bold font-display">{s.value}</div>
                <div className="text-xs text-blue-100 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-brand-600 dark:text-brand-400 font-semibold text-sm uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-4 text-slate-900 dark:text-white">Everything you need to travel smart</h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg">From AI itineraries to live weather and maps — your whole trip, beautifully organized.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 group hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-brand-600 dark:text-brand-400 font-semibold text-sm uppercase tracking-wider">How it works</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-4 text-slate-900 dark:text-white">Three steps to your next adventure</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-brand-300 via-accent-300 to-brand-300 dark:from-brand-700 dark:via-accent-700 dark:to-brand-700" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card p-6 text-center relative"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center text-white shadow-glow mb-4 relative z-10">
                <s.icon className="w-10 h-10" />
              </div>
              <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">Step {i + 1}</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Showcase band */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-card p-8 md:p-12 bg-gradient-to-br from-brand-600 to-accent-600 !border-0 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
          <Heart className="w-10 h-10 mx-auto mb-4 text-white/90" />
          <h2 className="text-2xl md:text-4xl font-bold mb-3">Loved by explorers worldwide</h2>
          <p className="text-blue-50 max-w-xl mx-auto mb-8">Join thousands of travelers who plan smarter with AI — and spend less time stressing, more time exploring.</p>
          <Link to="/planner" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-white text-brand-700 hover:bg-blue-50 transition-colors">
            <Plane className="w-5 h-5" /> Plan my trip now
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-brand-600 dark:text-brand-400 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-4 text-slate-900 dark:text-white">Travelers love it</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" loading="lazy" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">{t.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-12">
          <span className="text-brand-600 dark:text-brand-400 font-semibold text-sm uppercase tracking-wider">FAQ</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-4 text-slate-900 dark:text-white">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <FAQItem key={f.q} {...f} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="glass-card p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh -z-10" />
          <Camera className="w-10 h-10 mx-auto mb-4 text-brand-600 dark:text-brand-400" />
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Your next adventure awaits</h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-8 text-lg">Stop dreaming. Start planning. Generate your personalized itinerary in under 30 seconds.</p>
          <Link to="/planner" className="btn-primary !px-8 !py-4 text-base">
            <Sparkles className="w-5 h-5" /> Start Planning — Free
          </Link>
        </div>
      </section>
    </div>
  );
}
