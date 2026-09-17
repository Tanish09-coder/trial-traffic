import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize, Sun, CloudRain, CloudFog, Video, BarChart2, ChevronDown, ChevronUp, Sliders, RotateCcw, AlertTriangle, Siren, Car as CarIcon, Clock, BarChart3, PersonStanding, TrafficCone, TrendingUp, TrendingDown, Globe, MapPin } from 'lucide-react';
import { useTrafficData } from '../utils/useTrafficData';
import { useLanguage } from '../context/LanguageContext';
import Car from '../components/car';
import TrafficLight from '../components/TrafficLight';
import PedestrianLight from '../components/PedestrianLight';
import ParkEnvironment from '../components/ParkEnvironment';
import AIDecisionPanel from '../components/AIDecisionPanel';
import StatCard from '../components/StatCard';
import ChartPanel from '../components/ChartPanel';
import WeatherEffects from '../components/WeatherEffects';
import Loader from '../components/Loader';
import { calculateEnvironmentalImpact } from '../utils/environmentalImpact';

const Dashboard = ({ onNavigate }) => {
  const { lang } = useLanguage();
  const {
    state,
    metrics,
    loading,
    error,
    useMock,
    simulationSpeed,
    weatherMode,
    generatedDemand,
    stagedDemand,
    demandPendingReset,
    setGeneratedDemandMultiplier,
    switchToMock,
    switchToBackend,
    setSpeed,
    setWeather,
    resetSimulation,
    triggerEmergencyVehicle
  } = useTrafficData();

  // Control panel collapse/expand state
  const [showControls, setShowControls] = useState(true);

  // Live timestamp formatted like screenshot
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      setCurrentTimeFormatted(d.toLocaleString('en-US', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen state
  const intersectionRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!intersectionRef.current) return;
    if (!document.fullscreenElement) {
      intersectionRef.current.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Sustainability & Economic Savings calculation
  const [savingsStats, setSavingsStats] = useState({
    fuelSavedLiters: 0,
    timeSavedMinutes: 0,
    co2ReducedKg: 0,
    totalSavingsRupees: 0
  });

  useEffect(() => {
    if (state || metrics) {
      const carsPassed = state?.cars_passed ?? metrics?.total_cars ?? 0;
      const currentAvgWait = (typeof state?.avg_wait_time === 'number')
        ? state.avg_wait_time
        : (metrics?.current_avg_wait_time ?? 0);

      if (carsPassed === 0) {
        setSavingsStats({
          fuelSavedLiters: 0,
          timeSavedMinutes: 0,
          co2ReducedKg: 0,
          totalSavingsRupees: 0
        });
        return;
      }

      const impact = calculateEnvironmentalImpact(carsPassed, currentAvgWait, 45.0);

      setSavingsStats({
        fuelSavedLiters: impact.fuelSavedLiters,
        timeSavedMinutes: Number((impact.commuterTimeSaved / 60).toFixed(1)),
        co2ReducedKg: impact.co2ReducedKg,
        totalSavingsRupees: impact.economicSavingsRupees
      });
    }
  }, [state, metrics]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader message={lang === 'HI' ? 'यातायात प्रणाली प्रारंभ हो रही है...' : 'Initializing Traffic System...'} />
      </div>
    );
  }

  const activeRoadsCount = state?.roads_with_traffic?.length || 4;
  const currentSignalDir = state?.signal || 'E';
  const dirNames = {
    N: lang === 'HI' ? 'उत्तर दिशा' : 'North Bound',
    S: lang === 'HI' ? 'दक्षिण दिशा' : 'South Bound',
    E: lang === 'HI' ? 'पूर्व दिशा' : 'East Bound',
    W: lang === 'HI' ? 'पश्चिम दिशा' : 'West Bound'
  };

  const currentAvgWait = Math.round(state?.avg_wait_time ?? metrics?.current_avg_wait_time ?? metrics?.avg_wait_time ?? 0);
  const losGrade = currentAvgWait <= 10 ? { grade: 'A', label: lang === 'HI' ? 'निर्बाध प्रवाह' : 'Free Flow', color: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]' }
    : currentAvgWait <= 20 ? { grade: 'B', label: lang === 'HI' ? 'स्थिर प्रवाह' : 'Stable Flow', color: 'bg-[#F1F5F9] text-[#0F2C59] border-[#E2E8F0]' }
      : currentAvgWait <= 35 ? { grade: 'C', label: lang === 'HI' ? 'मध्यम प्रवाह' : 'Moderate Flow', color: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]' }
        : currentAvgWait <= 55 ? { grade: 'D', label: lang === 'HI' ? 'सीमा के समीप' : 'Approaching Limit', color: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' }
          : { grade: 'E/F', label: lang === 'HI' ? 'अत्यधिक भीड़भाड़' : 'High Congestion', color: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]' };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 space-y-6">
      {/* 0. Government ICCC Corridor Strip (Spacious & Clean) */}
      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="px-2.5 py-1 rounded-md bg-[#0A1F44] text-[#F5A623] text-xs font-black tracking-wider uppercase border border-[#1E4D8C]">
            MoRTH ICCC
          </div>
          <div>
            <div className="text-sm font-bold text-[#0A1F44] flex items-center space-x-2">
              <span>{lang === 'HI' ? 'मुंबई महानगर क्षेत्र • BKC वित्तीय कॉरिडोर' : 'Mumbai Metropolitan Region • BKC Financial Corridor'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-extrabold text-[#0F2C59] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                {lang === 'HI' ? 'जंक्शन नोड #04' : 'Junction Node #04'}
              </span>
            </div>
            <div className="text-xs text-[#475569] mt-0.5">
              {lang === 'HI' ? 'सेंसर टेलीमेट्री: 4/4 कैमरे समन्वयित • अनुकूली RL नियंत्रण सक्रिय' : 'Sensor Telemetry: 4/4 Cameras Synchronized • Adaptive RL Control Active'}
            </div>
          </div>
        </div>

        {/* Level of Service (IRC:106 Standard) Badge & Live GIS Switch */}
        <div className="flex items-center flex-wrap gap-3">
          <button
            onClick={() => onNavigate && onNavigate('gis-maps')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#003366] hover:bg-[#1E4D8C] text-white text-xs font-bold transition shadow-xs cursor-pointer border border-blue-400/30"
            title="Open Live Google Maps GIS Command Center"
          >
            <Globe size={14} className="text-[#F5A623] animate-pulse" />
            <span>{lang === 'HI' ? 'लाइव गूगल मैप्स GIS' : 'Live Google Maps GIS'}</span>
          </button>

          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">{lang === 'HI' ? 'सेवा का स्तर (IRC:106)' : 'Level of Service (IRC:106)'}</div>
            <div className="text-xs font-bold text-[#0A1F44]">{losGrade.label}</div>
          </div>
          <div className={`px-3.5 py-1.5 rounded-lg border text-xs font-black flex items-center space-x-1.5 shadow-xs ${losGrade.color}`}>
            <span>LOS:</span>
            <span className="text-sm font-black">{losGrade.grade}</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl text-xs flex items-center space-x-2"
          >
            <AlertTriangle size={16} className="text-amber-500" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Alert Banner */}
      <AnimatePresence>
        {state?.emergencyActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border-2 border-red-500 text-red-800 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs"
          >
            <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
            <Siren size={18} className="text-red-600 shrink-0" />
            <span>
              {lang === 'HI'
                ? `आपातकालीन प्राथमिकता सक्रिय: मार्ग ${state.emergencyDirection} → हरा • विपरीत यातायात रोका गया`
                : `EMERGENCY PRIORITY ACTIVE: Approach ${state.emergencyDirection} → GREEN • Cross Traffic Halted`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. 4 KPI CARDS (Generous spacing & borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={lang === 'HI' ? 'गुज़रे हुए वाहन' : 'VEHICLES PASSED'}
          value={state?.cars_passed ?? metrics?.total_cars ?? 0}
          icon={CarIcon}
          showTrend={false}
          color="blue"
        />
        <StatCard
          title={lang === 'HI' ? 'औसत प्रतीक्षा समय' : 'AVERAGE WAIT TIME'}
          value={Math.round(state?.avg_wait_time ?? metrics?.current_avg_wait_time ?? metrics?.avg_wait_time ?? 0)}
          unit={lang === 'HI' ? 'सेकंड' : 'sec'}
          icon={Clock}
          showTrend={false}
          color="orange"
        />
        <StatCard
          title={lang === 'HI' ? 'कुल थ्रूपुट' : 'TOTAL THROUGHPUT'}
          value={Math.round(state?.throughput ?? metrics?.throughput ?? 0)}
          unit={lang === 'HI' ? 'वाहन/मिनट' : 'cars/min'}
          icon={BarChart3}
          showTrend={false}
          color="green"
        />
        <StatCard
          title={lang === 'HI' ? 'आपातकालीन वाहन' : 'EMERGENCY VEHICLES'}
          value={state?.emergencyActive ? 1 : (metrics?.emergency_count ?? 0)}
          unit={lang === 'HI' ? 'सक्रिय' : 'active'}
          icon={<AlertTriangle size={16} className="text-amber-500" />}
          showTrend={false}
          color="purple"
        />
      </div>

      {/* 2. SIGNAL OPTIMIZATION & DEMAND CONTROL PANEL */}
      <AIDecisionPanel showAllocationDetails={false} />

      {/* 3. MAIN SECTION: Left (70%) Live Intersection & Right (30%) Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_calc(30%-1.5rem)] gap-6 items-start">

        {/* LEFT COLUMN: Live Intersection View */}
        <div className="bg-white rounded-xl shadow-xs p-4 sm:p-5 border border-[#E2E8F0]">
          {/* Intersection Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-[#0F2C59]" />
              <h2 className="text-sm font-bold text-[#0A1F44]">
                {lang === 'HI' ? 'लाइव जंक्शन CCTV एवं एक्टिवेशन दृश्य' : 'Live Intersection CCTV & Actuation View'}
              </h2>
            </div>

            {/* Road status pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['N', 'S', 'E', 'W'].map(dir => {
                const dirFullNames = {
                  N: lang === 'HI' ? 'उत्तर' : 'North',
                  S: lang === 'HI' ? 'दक्षिण' : 'South',
                  E: lang === 'HI' ? 'पूर्व' : 'East',
                  W: lang === 'HI' ? 'पश्चिम' : 'West'
                };
                const isGreen = state?.signal === dir && state?.phase === 'GREEN';
                const isYellow = state?.signal === dir && state?.phase === 'YELLOW';
                const label = isGreen
                  ? (lang === 'HI' ? 'खुला' : 'OPEN')
                  : isYellow
                    ? (lang === 'HI' ? 'निकासी' : 'CLEARING')
                    : (lang === 'HI' ? 'बंद' : 'CLOSED');

                return (
                  <div
                    key={dir}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${isGreen
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : isYellow
                        ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                        : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                      }`}
                  >
                    {dirFullNames[dir]}: {label}
                  </div>
                );
              })}

              <button
                onClick={toggleFullscreen}
                className="p-1 rounded-lg hover:bg-slate-100 text-[#475569] transition-colors ml-1 cursor-pointer"
                title={isFullscreen ? (lang === 'HI' ? 'फुलस्क्रीन से बाहर निकलें' : 'Exit fullscreen') : (lang === 'HI' ? 'फुलस्क्रीन में देखें' : 'Enter fullscreen')}
              >
                {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              </button>
            </div>
          </div>

          {/* Simulation Canvas Container with Neutral Ground & Compact Environment */}
          <div
            ref={intersectionRef}
            className={`relative w-full bg-[#D9DEE3] rounded-2xl overflow-hidden border border-[#CBD2D9] shadow-xs select-none ${isFullscreen ? 'h-full' : 'h-[380px]'
              }`}
          >
            {/* Neutral Ground, Sidewalks, and Compact Realistic Greenery */}
            <ParkEnvironment isFullscreen={isFullscreen} />

            {/* Road asphalt layers & markings */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Horizontal road (#454D57 dark slate) */}
              <div
                className={`absolute top-1/2 left-0 w-full bg-[#454D57] transform -translate-y-1/2 shadow-xs ${isFullscreen ? 'h-40' : 'h-20'
                  }`}
              >
                {/* Yellow double center line */}
                <div className="absolute top-1/2 left-0 w-full h-[2.5px] bg-[#EAB308] transform -translate-y-1/2 shadow-xs" />
                {/* Dashed lane lines */}
                <div className="absolute top-1/4 left-0 w-full border-t border-dashed border-white/50" />
                <div className="absolute top-3/4 left-0 w-full border-t border-dashed border-white/50" />
              </div>

              {/* Vertical road (#454D57 dark slate) */}
              <div
                className={`absolute left-1/2 top-0 h-full bg-[#454D57] transform -translate-x-1/2 shadow-xs ${isFullscreen ? 'w-40' : 'w-20'
                  }`}
              >
                {/* Yellow double center line */}
                <div className="absolute left-1/2 top-0 w-[2.5px] h-full bg-[#EAB308] transform -translate-x-1/2 shadow-xs" />
                {/* Dashed lane lines */}
                <div className="absolute left-1/4 top-0 h-full border-l border-dashed border-white/50" />
                <div className="absolute left-3/4 top-0 h-full border-l border-dashed border-white/50" />
              </div>

              {/* Center Intersection Box (#3E4754 with subtle dashed yellow boundary) */}
              <div
                className={`absolute top-1/2 left-1/2 bg-[#3E4754] rounded-xs transform -translate-x-1/2 -translate-y-1/2 border border-dashed border-yellow-400/40 shadow-inner ${isFullscreen ? 'w-40 h-40' : 'w-20 h-20'
                  }`}
              />

              {/* Direction Arrows Painted on Road Lanes matching screenshot */}
              <div className={`absolute left-1/2 text-white/90 font-extrabold tracking-wider z-10 select-none ${isFullscreen ? 'top-6 transform -translate-x-1/2 text-sm' : 'top-3.5 transform -translate-x-1/2 text-[11px]'
                }`}>
                N ↑
              </div>
              <div className={`absolute left-1/2 text-white/90 font-extrabold tracking-wider z-10 select-none ${isFullscreen ? 'bottom-6 transform -translate-x-1/2 text-sm' : 'bottom-3.5 transform -translate-x-1/2 text-[11px]'
                }`}>
                S ↓
              </div>
              <div className={`absolute top-1/2 text-white/90 font-extrabold tracking-wider z-10 select-none ${isFullscreen ? 'left-8 transform -translate-y-1/2 text-sm' : 'left-5 transform -translate-y-1/2 text-[11px]'
                }`}>
                W ←
              </div>
              <div className={`absolute top-1/2 text-white/90 font-extrabold tracking-wider z-10 select-none ${isFullscreen ? 'right-8 transform -translate-y-1/2 text-sm' : 'right-5 transform -translate-y-1/2 text-[11px]'
                }`}>
                E →
              </div>


              {/* Zebra Crosswalks */}
              {/* North Crosswalk */}
              {(() => {
                const pN = state?.pedestrian_signals?.N || 'STOP';
                const isWalk = pN === 'WALK';
                return (
                  <>
                    <div
                      className={`absolute left-1/2 transform -translate-x-1/2 z-10 pointer-events-none ${isFullscreen
                        ? 'top-[calc(50%-145px)] w-32 h-12'
                        : 'top-[calc(50%-78px)] w-16 h-6.5'
                        }`}
                    >
                      <div className="w-full h-full flex justify-between px-0.5">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-full rounded-[0.5px] bg-white shadow-xs ${isFullscreen ? 'w-[3.5px]' : 'w-[2px]'
                              }`}
                          />
                        ))}
                      </div>
                      {isWalk && (
                        <motion.div
                          className={`absolute select-none pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${isFullscreen ? 'text-2xl -top-5' : 'text-lg -top-3.5'
                            }`}
                          animate={{ left: ['-5%', '100%'], opacity: [0, 1, 1, 1, 0] }}
                          transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                        >
                          <span className="inline-block">🚶‍♀️</span>
                        </motion.div>
                      )}
                    </div>
                    <div
                      className={`absolute z-20 ${isFullscreen
                        ? 'left-[calc(50%+84px)] top-[calc(50%-148px)]'
                        : 'left-[calc(50%+42px)] top-[calc(50%-80px)]'
                        }`}
                    >
                      <PedestrianLight status={pN} isFullscreen={isFullscreen} />
                    </div>
                  </>
                );
              })()}

              {/* South Crosswalk */}
              {(() => {
                const pS = state?.pedestrian_signals?.S || 'STOP';
                const isWalk = pS === 'WALK';
                return (
                  <>
                    <div
                      className={`absolute left-1/2 transform -translate-x-1/2 z-10 pointer-events-none ${isFullscreen
                        ? 'top-[calc(50%+102px)] w-32 h-12'
                        : 'top-[calc(50%+55px)] w-16 h-6.5'
                        }`}
                    >
                      <div className="w-full h-full flex justify-between px-0.5">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-full rounded-[0.5px] bg-white shadow-xs ${isFullscreen ? 'w-[3.5px]' : 'w-[2px]'
                              }`}
                          />
                        ))}
                      </div>
                      {isWalk && (
                        <motion.div
                          className={`absolute select-none pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${isFullscreen ? 'text-2xl -top-5' : 'text-lg -top-3.5'
                            }`}
                          animate={{ left: ['105%', '-5%'], opacity: [0, 1, 1, 1, 0] }}
                          transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                        >
                          <span className="inline-block transform -scale-x-100">🚶‍♀️</span>
                        </motion.div>
                      )}
                    </div>
                    <div
                      className={`absolute z-20 ${isFullscreen
                        ? 'left-[calc(50%-98px)] top-[calc(50%+102px)]'
                        : 'left-[calc(50%-52px)] top-[calc(50%+55px)]'
                        }`}
                    >
                      <PedestrianLight status={pS} isFullscreen={isFullscreen} />
                    </div>
                  </>
                );
              })()}

              {/* West Crosswalk */}
              {(() => {
                const pW = state?.pedestrian_signals?.W || 'STOP';
                const isWalk = pW === 'WALK';
                return (
                  <>
                    <div
                      className={`absolute top-1/2 transform -translate-y-1/2 z-10 flex flex-col justify-between pointer-events-none ${isFullscreen
                        ? 'left-[calc(50%-145px)] w-12 h-32 py-0.5'
                        : 'left-[calc(50%-78px)] w-6.5 h-16 py-0.5'
                        }`}
                    >
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-[0.5px] bg-white shadow-xs ${isFullscreen ? 'h-[3.5px]' : 'h-[2px]'
                            }`}
                        />
                      ))}
                      {isWalk && (
                        <motion.div
                          className={`absolute select-none pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${isFullscreen ? 'text-2xl -left-5' : 'text-lg -left-3'
                            }`}
                          animate={{ top: ['-5%', '100%'], opacity: [0, 1, 1, 1, 0] }}
                          transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                        >
                          <span className="inline-block">🚶‍♀️</span>
                        </motion.div>
                      )}
                    </div>
                    <div
                      className={`absolute z-20 ${isFullscreen
                        ? 'left-[calc(50%-148px)] top-[calc(50%-98px)]'
                        : 'left-[calc(50%-80px)] top-[calc(50%-52px)]'
                        }`}
                    >
                      <PedestrianLight status={pW} isFullscreen={isFullscreen} />
                    </div>
                  </>
                );
              })()}

              {/* East Crosswalk */}
              {(() => {
                const pE = state?.pedestrian_signals?.E || 'STOP';
                const isWalk = pE === 'WALK';
                return (
                  <>
                    <div
                      className={`absolute top-1/2 transform -translate-y-1/2 z-10 flex flex-col justify-between pointer-events-none ${isFullscreen
                        ? 'left-[calc(50%+102px)] w-12 h-32 py-0.5'
                        : 'left-[calc(50%+55px)] w-6.5 h-16 py-0.5'
                        }`}
                    >
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-[0.5px] bg-white shadow-xs ${isFullscreen ? 'h-[3.5px]' : 'h-[2px]'
                            }`}
                        />
                      ))}
                      {isWalk && (
                        <motion.div
                          className={`absolute select-none pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${isFullscreen ? 'text-2xl -right-5' : 'text-lg -right-3'
                            }`}
                          animate={{ top: ['105%', '-5%'], opacity: [0, 1, 1, 1, 0] }}
                          transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                        >
                          <span className="inline-block transform -scale-x-100">🚶‍♀️</span>
                        </motion.div>
                      )}
                    </div>
                    <div
                      className={`absolute z-20 ${isFullscreen
                        ? 'left-[calc(50%+102px)] top-[calc(50%+84px)]'
                        : 'left-[calc(50%+55px)] top-[calc(50%+42px)]'
                        }`}
                    >
                      <PedestrianLight status={pE} isFullscreen={isFullscreen} />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Traffic Lights for 4 approaches */}
            <TrafficLight
              direction="N"
              signal={state?.signal}
              phase={state?.phase}
              emergencyActive={state?.emergencyActive && state?.emergencyDirection === 'N'}
              isFullscreen={isFullscreen}
            />
            <TrafficLight
              direction="S"
              signal={state?.signal}
              phase={state?.phase}
              emergencyActive={state?.emergencyActive && state?.emergencyDirection === 'S'}
              isFullscreen={isFullscreen}
            />
            <TrafficLight
              direction="E"
              signal={state?.signal}
              phase={state?.phase}
              emergencyActive={state?.emergencyActive && state?.emergencyDirection === 'E'}
              isFullscreen={isFullscreen}
            />
            <TrafficLight
              direction="W"
              signal={state?.signal}
              phase={state?.phase}
              emergencyActive={state?.emergencyActive && state?.emergencyDirection === 'W'}
              isFullscreen={isFullscreen}
            />

            {/* Cars simulation */}
            <AnimatePresence>
              {state?.cars &&
                Object.entries(state.cars).map(([lane, cars]) =>
                  cars.map(car => (
                    <Car
                      key={`${car.id}-${lane}`}
                      id={car.id}
                      lane={lane}
                      position={car.position}
                      speed={car.speed}
                      type={car.type}
                      isFullscreen={isFullscreen}
                    />
                  ))
                )}
            </AnimatePresence>

            {/* Weather Visual Effects Layer (Rain & Fog) */}
            <WeatherEffects weatherMode={state?.weather_mode || weatherMode || 'normal'} isFullscreen={isFullscreen} />

            {/* Queue counts per lane */}
            {state?.queues &&
              Object.entries(state.queues).map(([lane, count]) => (
                <div
                  key={lane}
                  className={`absolute text-[11px] font-bold text-white bg-[#1E293B]/90 px-2 py-0.5 rounded-md shadow-xs z-30 ${lane === 'N'
                    ? 'top-2 left-1/2 transform -translate-x-1/2'
                    : lane === 'S'
                      ? 'bottom-2 left-1/2 transform -translate-x-1/2'
                      : lane === 'E'
                        ? 'right-2 top-1/2 transform -translate-y-1/2'
                        : 'left-2 top-1/2 transform -translate-y-1/2'
                    }`}
                >
                  {lane}: {count}
                </div>
              ))}

            {/* Fullscreen Floating Controls */}
            {isFullscreen && (
              <>
                {/* 1. Top-Left: Current Signal Indicator (Image 2) */}
                <div className="absolute top-4 left-4 z-40 pointer-events-auto flex items-center px-4 py-2 rounded-full text-xs font-bold bg-[#0A1F44]/95 backdrop-blur-md text-[#F5A623] shadow-xl border border-[#1E4D8C] select-none">
                  <span>
                    Current Signal: {state?.signal || 'E'} ({state?.phase || 'GREEN'}) | Green remaining: {state?.phase_remaining_sec ?? 2}s
                  </span>
                </div>

                {/* 2. Top-Right: Weather Controls & Exit Fullscreen */}
                <div className="absolute top-4 right-4 z-40 flex items-center space-x-1.5 pointer-events-auto bg-[#0A1F44]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg select-none">
                  {[
                    { mode: 'normal', label: 'Clear', icon: Sun },
                    { mode: 'rain', label: 'Rain', icon: CloudRain },
                    { mode: 'fog', label: 'Fog', icon: CloudFog }
                  ].map(({ mode, label, icon: Icon }) => {
                    const currentMode = (state?.weather_mode || weatherMode || 'normal').toLowerCase();
                    const isActive = (mode === 'normal' && (currentMode === 'normal' || currentMode === 'clear')) || currentMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setWeather && setWeather(mode)}
                        className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${isActive
                          ? 'bg-[#0F2C59] text-white shadow-xs border border-[#1E4D8C]'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        <Icon size={12} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                  <div className="w-[1px] h-4 bg-white/20 mx-1" />
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Exit Fullscreen"
                  >
                    <Minimize size={14} />
                  </button>
                </div>

                {/* 3. Bottom-Right: Emergency Dispatch Button (Image 1) */}
                <div className="absolute bottom-4 right-4 z-40 pointer-events-auto">
                  <button
                    onClick={() => triggerEmergencyVehicle && triggerEmergencyVehicle()}
                    disabled={state?.emergencyActive}
                    className={`px-5 py-2.5 rounded-full font-black text-xs text-white transition-all shadow-xl flex items-center space-x-2 cursor-pointer border border-white/20 select-none ${state?.emergencyActive
                        ? 'bg-red-800 animate-pulse cursor-default'
                        : 'bg-[#DC2626] hover:bg-red-700 active:scale-95 hover:shadow-red-500/25'
                      }`}
                    title="Dispatch emergency vehicle priority clearance"
                  >
                    <AlertTriangle size={16} className="text-[#F5A623] fill-[#F5A623]/20" />
                    <span className="tracking-wide">
                      {state?.emergencyActive ? `EMERGENCY ACTIVE (${state?.emergencyDirection || ''})` : 'EMERGENCY DISPATCH'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Status & Control Rows directly below the intersection canvas */}
          <div className="mt-3.5 space-y-2.5">
            {/* Row 1: Current status pill & weather pills */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Current Signal status capsule */}
              <div className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0A1F44] text-[#F5A623] shadow-xs border border-[#1E4D8C]">
                {lang === 'HI'
                  ? `वर्तमान सिग्नल: ${state?.signal || 'E'} (${state?.phase === 'GREEN' ? 'हरा' : state?.phase === 'YELLOW' ? 'पीला' : 'लाल'}) | शेष ग्रीन समय: ${state?.phase_remaining_sec ?? 2}s`
                  : `Current Signal: ${state?.signal || 'E'} (${state?.phase || 'GREEN'}) | Green remaining: ${state?.phase_remaining_sec ?? 2}s`}
              </div>

              {/* Weather selector pills */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
                {[
                  { mode: 'normal', label: lang === 'HI' ? 'साफ़' : 'Clear', icon: Sun },
                  { mode: 'rain', label: lang === 'HI' ? 'बारिश' : 'Rain', icon: CloudRain },
                  { mode: 'fog', label: lang === 'HI' ? 'कोहरा' : 'Fog', icon: CloudFog }
                ].map(({ mode, label, icon: Icon }) => {
                  const currentMode = (state?.weather_mode || weatherMode || 'normal').toLowerCase();
                  const isActive = (mode === 'normal' && (currentMode === 'normal' || currentMode === 'clear')) || currentMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setWeather && setWeather(mode)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center space-x-1 cursor-pointer ${isActive
                        ? 'bg-[#0F2C59] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#0A1F44]'
                        }`}
                    >
                      <Icon size={12} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Manual clearance info & EMERGENCY MODE button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F1F5F9]">
              {/* Manual clearance status */}
              <div className="flex items-center space-x-1 text-xs text-[#475569]">
                <TrafficCone size={16} className="text-[#0F2C59]" />
                <span className="font-semibold text-[#0A1F44]">{lang === 'HI' ? 'IRC सुरक्षा निकासी:' : 'IRC Safety Clearance:'}</span>
                <span>
                  {lang === 'HI'
                    ? `पीला ${state?.yellow_duration || 3}s → सर्व-लाल ${state?.all_red_duration || 1}s`
                    : `Yellow ${state?.yellow_duration || 3}s → All-red ${state?.all_red_duration || 1}s`}
                </span>
              </div>

              {/* Emergency button */}
              <button
                onClick={() => triggerEmergencyVehicle && triggerEmergencyVehicle()}
                disabled={state?.emergencyActive}
                className={`px-5 py-1.5 rounded-lg font-bold text-xs text-white transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer ${state?.emergencyActive
                  ? 'bg-red-700 animate-pulse cursor-default'
                  : 'bg-[#DC2626] hover:bg-red-700 active:scale-95'
                  }`}
                title={lang === 'HI' ? 'आपातकालीन वाहन प्राथमिकता निकासी भेजें' : 'Dispatch emergency vehicle priority clearance'}
              >
                <AlertTriangle size={16} className="text-[#F5A623]" />
                <span>
                  {state?.emergencyActive
                    ? (lang === 'HI' ? `आपातकाल सक्रिय (${state?.emergencyDirection || ''})` : `EMERGENCY ACTIVE (${state?.emergencyDirection || ''})`)
                    : (lang === 'HI' ? 'आपातकालीन डिस्पैच' : 'EMERGENCY DISPATCH')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Analytics Panel */}
        <div className="bg-white rounded-xl shadow-xs p-4 sm:p-5 border border-[#E2E8F0]">
          {/* Analytics Header */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-[#0F2C59]" />
              <h3 className="text-sm font-bold text-[#0A1F44]">{lang === 'HI' ? 'रीयल-टाइम एनालिटिक्स' : 'Real-Time Analytics'}</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#F1F5F9] text-[#0F2C59] border border-[#E2E8F0]">
              {lang === 'HI' ? 'लाइव टेलीमेट्री' : 'Live Telemetry'}
            </span>
          </div>

          {/* 3 Quick Status Cards */}
          <div className="space-y-2 mb-3.5">
            {/* 1. Current Signal */}
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <TrafficCone size={16} className="text-[#0F2C59]" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0F2C59]">
                    {lang === 'HI' ? 'सक्रिय फेज़' : 'Active Phase'}
                  </div>
                  <div className="text-sm font-extrabold text-[#0A1F44]">
                    {currentSignalDir} <span className="font-normal text-xs text-[#475569]">{dirNames[currentSignalDir] || ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Active Roads */}
            <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CarIcon size={16} className="text-[#16A34A]" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">
                    {lang === 'HI' ? 'सक्रिय पहुंच मार्ग' : 'Active Approaches'}
                  </div>
                  <div className="text-sm font-extrabold text-[#0A1F44]">
                    {activeRoadsCount} / 4 <span className="font-normal text-xs text-[#475569]">N, S, E, W</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Panel (Wait Time Line Chart, Queue Lengths Bar Chart, Traffic Summary) */}
          <ChartPanel metrics={metrics} state={state} />
        </div>
      </div>

      {/* 4. SYSTEM CONTROLS */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E2E8F0] p-4 sm:p-5">
        {/* System Controls Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#0A1F44] flex items-center justify-center border border-[#1E4D8C]">
              <Sliders className="w-4 h-4 text-[#F5A623]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A1F44]">{lang === 'HI' ? 'ICCC प्रणाली एवं सिमुलेशन नियंत्रण' : 'ICCC System & Simulation Controls'}</h3>
              <p className="text-[11px] text-[#475569]">{lang === 'HI' ? 'डेटा फीड, पीक लोड मल्टीप्लायर और नोड पैरामीटर कॉन्फ़िगर करें' : 'Configure data feeds, peak load multipliers, and node parameters'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Timestamp */}
            <span className="text-xs text-[#475569] font-mono">
              {currentTimeFormatted}
            </span>

            {/* Chevron toggle to collapse/expand */}
            <button
              onClick={() => setShowControls(prev => !prev)}
              className="p-1 rounded-lg text-[#64748B] hover:text-[#0A1F44] hover:bg-slate-100 transition cursor-pointer"
              title={showControls ? (lang === 'HI' ? 'संक्षिप्त करें' : 'Collapse') : (lang === 'HI' ? 'विस्तार करें' : 'Expand')}
            >
              {showControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Expandable Control Options */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-4 mt-4 border-t border-[#E2E8F0]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* 1. Generated Traffic */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                      {lang === 'HI' ? 'यातायात मांग (डिमांड)' : 'Traffic Demand'}
                    </label>
                    {demandPendingReset && useMock && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309]">
                        {lang === 'HI' ? 'अगला रीसेट' : 'Next reset'}
                      </span>
                    )}
                  </div>
                  {useMock ? (
                    <div className="flex space-x-1 p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
                      <button
                        onClick={() => setGeneratedDemandMultiplier && setGeneratedDemandMultiplier(0.5)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${stagedDemand === 0.5
                          ? 'bg-[#0F2C59] text-white shadow-xs'
                          : 'text-[#475569] hover:text-[#0A1F44]'
                          }`}
                        title={lang === 'HI' ? 'मध्यम मांग: 0.5x' : 'Moderate demand: 0.5x'}
                      >
                        {lang === 'HI' ? 'सामान्य (0.5x)' : 'Normal (0.5x)'}
                      </button>
                      <button
                        onClick={() => setGeneratedDemandMultiplier && setGeneratedDemandMultiplier(1.0)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${stagedDemand === 1.0
                          ? 'bg-[#0F2C59] text-white shadow-xs'
                          : 'text-[#475569] hover:text-[#0A1F44]'
                          }`}
                        title={lang === 'HI' ? 'व्यस्त समय मांग: 1.0x' : 'Peak time demand: 1.0x'}
                      >
                        {lang === 'HI' ? 'पीक लोड (1.0x)' : 'Peak Load (1.0x)'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 text-center">
                      {lang === 'HI' ? 'बैकएंड द्वारा प्रबंधित' : 'Managed by Backend'}
                    </div>
                  )}
                </div>

                {/* 3. Simulation Speed */}
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    {lang === 'HI' ? 'घड़ी गति मल्टीप्लायर' : 'Clock Multiplier'}
                  </label>
                  {useMock ? (
                    <div className="flex space-x-1 p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
                      {[1, 2, 3].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setSpeed(spd)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${simulationSpeed === spd
                            ? 'bg-white text-[#0A1F44] font-black shadow-xs border border-[#E2E8F0]'
                            : 'text-[#475569] hover:text-[#0A1F44]'
                            }`}
                        >
                          {spd}x {spd === 1 ? '(1:1)' : ''}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 text-center">
                      {lang === 'HI' ? '1x (रीयल टाइम)' : '1x (Real Time)'}
                    </div>
                  )}
                </div>

                {/* 4. Actions */}
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    {lang === 'HI' ? 'रीसेट एवं सिंक' : 'Reset & Sync'}
                  </label>
                  <button
                    onClick={resetSimulation}
                    className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-white border border-[#E2E8F0] text-[#0A1F44] hover:bg-[#F8FAFC] transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw size={13} className="text-[#0F2C59]" />
                    <span>{lang === 'HI' ? 'जंक्शन रीसेट करें' : 'Reset Intersection'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;