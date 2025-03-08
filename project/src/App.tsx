import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Beer } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import PlannerDashboard from './pages/PlannerDashboard';
import { PubDataProvider } from './context/PubDataContext';

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    });
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleThrottledMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleThrottledMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleThrottledMouseMove);
  }, [handleMouseMove]);

  return (
    <PubDataProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800 relative">
          <div 
            className="fixed inset-0 pointer-events-none will-change-transform"
            style={{
              background: `radial-gradient(circle 800px at ${mousePosition.x}% ${mousePosition.y}%, rgba(157, 0, 255, 0.25), transparent 40%)`,
              transform: 'translate3d(0,0,0)',
              backfaceVisibility: 'hidden'
            }}
          />
          <div className="fixed inset-0 bg-gradient-radial from-neon-purple/5 via-transparent to-transparent pointer-events-none" />
          
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8 relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/planner" element={<PlannerDashboard />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>

          <footer className="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm text-dark-100 py-8 border-t-2 border-neon-blue shadow-[0_-2px_4px_-1px_rgba(0,255,255,0.3)] relative mt-auto">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <Beer className="h-10 w-10 mr-3 text-neon-blue animate-pulse" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
                    Israel's Journey Planner
                  </span>
                </div>
                <div className="text-sm">
                  <p className="text-eggplant-100">&copy; {new Date().getFullYear()} Israel S.G.N.R. Carnahan | Created for Field Sales Representatives</p>
                  <p className="text-eggplant-300 text-xs mt-1">
                    Original algorithm and business logic by Israel Carnahan
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </PubDataProvider>
  );
}

export default App;