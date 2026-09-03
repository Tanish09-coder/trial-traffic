import { useState, useEffect, useRef } from 'react';
import { MoreVertical, ChevronRight } from 'lucide-react';

const MainLayout = ({ children, currentPage = 'dashboard', onNavigate }) => {
  const [timeString, setTimeString] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'System Overview & Analytics' },
    { id: 'live-intersection', label: 'Live Intersection', icon: '🚦', desc: 'Real-time Simulation & Overrides' },
    { id: 'traffic-intelligence', label: 'Traffic Intelligence', icon: '📹', desc: 'Video Vehicle Detection & Tracking' },
    { id: 'analytics', label: 'Analytics', icon: '📈', desc: 'Efficiency & Sustainability Metrics' },
    { id: 'about', label: 'About', icon: 'ℹ️', desc: 'Architecture & Features' }
  ];


  const activeItem = navItems.find(item => item.id === currentPage) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header & Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/95">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Section: 3-Dot Navigation Menu + Brand / Logo + Active Page */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* 3-Dot Menu Button on Far Left Corner */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                    isMenuOpen 
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm ring-2 ring-blue-100' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
                  }`}
                  aria-label="Navigation Menu"
                  title="Navigation Menu"
                >
                  <MoreVertical size={20} className="stroke-[2.5]" />
                </button>

                {/* Floating Dropdown Menu (Left Aligned) */}
                {isMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Navigation Menu</p>
                    </div>
                    <div className="p-1.5 space-y-1">
                      {navItems.map((item) => {
                        const isActive = currentPage === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onNavigate && onNavigate(item.id);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${
                              isActive
                                ? 'bg-blue-50/90 text-blue-700 font-semibold border border-blue-200/80 shadow-sm'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{item.icon}</span>
                              <div>
                                <div className="text-sm font-medium text-slate-900 leading-tight flex items-center space-x-1.5">
                                  <span>{item.label}</span>
                                  {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">{item.desc}</div>
                              </div>
                            </div>
                            <ChevronRight size={14} className={`transition-transform text-slate-400 group-hover:translate-x-0.5 ${isActive ? 'text-blue-600' : ''}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Logo / Brand */}
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate && onNavigate('dashboard')}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 text-xl font-bold">
                  🚦
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-slate-900 tracking-tight">Mumbai STMS</span>

                  </div>
                  <p className="text-xs text-slate-500 hidden md:block">Smart Traffic Management System • BKC Junction</p>
                </div>
              </div>

              {/* Current Active Page Pill */}
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs font-semibold text-blue-700 shadow-sm">
                <span>{activeItem.icon}</span>
                <span>{activeItem.label}</span>
              </div>
            </div>

            {/* Live System Status & Clock */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs font-mono font-medium text-slate-600">{timeString || 'LIVE'}</div>
                <div className="text-[10px] text-slate-400">IST (Mumbai)</div>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-emerald-700 tracking-wide">SYSTEM ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>🚦 Smart Traffic Management System (SIH Edition)</span>
            <span>•</span>
            <span>AI Adaptive Signal Control</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Bandra-Kurla Complex (Junction 12A)</span>
            <span>•</span>
            <span className="text-emerald-600 font-medium">99.9% Sensor Uptime</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;