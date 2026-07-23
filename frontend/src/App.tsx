import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Landing from './pages/Landing';
import Planner from './pages/Planner';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 relative">
          {/* Ambient gradient mesh */}
          <div className="fixed inset-0 -z-20 bg-mesh pointer-events-none" />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
