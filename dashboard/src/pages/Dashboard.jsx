import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize } from 'lucide-react';
import { useTrafficData } from '../utils/useTrafficData';
import Car from '../components/car';
import TrafficLight from '../components/TrafficLight';
import PedestrianLight from '../components/PedestrianLight';
import AIDecisionPanel from '../components/AIDecisionPanel';
import StatCard from '../components/StatCard';
import ChartPanel from '../components/ChartPanel';
import Loader from '../components/Loader';
import ErrorBoundary from '../components/ErrorBoundary';
import { calculateEnvironmentalImpact } from '../utils/environmentalImpact';

const Dashboard = () => {
  const { 
    state, 
    metrics, 
    loading, 
    error, 
    useMock, 
    simulationSpeed,
    switchToMock, 
    switchToBackend, 
    setSpeed, 
    resetSimulation,
    triggerEmergencyVehicle 
  } = useTrafficData();

  // Control panel state
  const [showControls, setShowControls] = useState(true);

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

  // Sustainability & Economic Savings
  const [savingsStats, setSavingsStats] = useState({
    fuelSavedLiters: 0,
    timeSavedMinutes: 0,
    co2ReducedKg: 0,
    totalSavingsRupees: 0
  });

  useEffect(() => {
    if (state || metrics) {
      const carsPassed = state?.cars_passed || metrics?.total_cars || 0;
      const currentAvgWait = (typeof state?.avg_wait_time === 'number' && state.avg_wait_time > 0)
        ? state.avg_wait_time
        : (metrics?.current_avg_wait_time || 30.0);

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
        <Loader message="Initializing Traffic System..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div>
        
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg"
            >
              <p className="text-sm">⚠️ {error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency Alert */}
        <AnimatePresence>
          {state?.emergencyActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-semibold">
                  🚨 EMERGENCY PRIORITY: Approach {state.emergencyDirection} → GREEN • Other Approaches → RED (Conflicting Traffic Held)
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section with enhanced status displays */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                🧠 Smart Traffic Management System
              </h1>

              <div className="flex items-center space-x-4">

                <span className="text-xs sm:text-sm text-slate-500">📍 Mumbai BKC Junction</span>
              </div>
              
              {/* Enhanced status indicators */}
              {state?.empty_roads && state.empty_roads.length > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                    <span>🚫</span>
                    <span>Empty Roads: {state.empty_roads.join(', ')}</span>
                  </span>
                </div>
              )}
              
              {state?.postEmergencyMode && (
                <div className="mt-2">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                    <span>🔄</span>
                    <span>Post-Emergency Rotation: {60 - (state.postEmergencyTimer || 0)}s remaining</span>
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Primary Operational Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <StatCard
            title="Vehicles Passed"
            value={state?.cars_passed || 0}
            icon="🚗"
            color="blue"
          />
          <StatCard
            title="Average Wait Time"
            value={state?.avg_wait_time ? parseFloat(state.avg_wait_time.toFixed(1)) : 0}
            unit="sec"
            icon="⏱️"
            color="orange"
          />
          <StatCard
            title="Total Throughput" 
            value={typeof metrics?.throughput === 'number' ? Number(metrics.throughput.toFixed(1)) : 0}
            unit="cars/min"
            icon="📊"
            color="green"
          />
          <StatCard
            title="Emergency Vehicles"
            value={metrics?.emergency_count || (state?.emergencyActive ? 1 : 0)}
            unit="active"
            icon="🚨"
            color="purple"
          />
        </div>

        {/* Strategy & Decision Panel */}
        <div className="mb-6">
          <AIDecisionPanel />
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Intersection View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Live Intersection View
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {['N', 'S', 'E', 'W'].map(dir => {
                    const dirNames = { N: 'North', S: 'South', E: 'East', W: 'West' };
                    const isGreen = state?.signal === dir && state?.phase === 'GREEN';
                    const isYellow = state?.signal === dir && state?.phase === 'YELLOW';
                    const isAllRed = state?.phase === 'ALL_RED';
                    const label = isGreen ? 'OPEN' : (isYellow || isAllRed) ? 'CLEARING' : 'CLOSED';
                    const cls = isGreen ? 'bg-green-100 text-green-800' : (isYellow || isAllRed) ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-600';
                    return (
                      <div key={dir} className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${cls}`}>
                        {dirNames[dir]}: {label}
                      </div>
                    );
                  })}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors ml-0.5 shrink-0"
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>
                </div>
              </div>

              {/* Intersection Container */}
              <div
                ref={intersectionRef}
                className={`relative w-full bg-[#EAECEF] rounded-2xl overflow-hidden border-2 border-[#1E293B] shadow-sm ${isFullscreen ? 'h-full' : 'h-96'}`}
              >
                {/* Road lanes with improved styling */}
                <div className="absolute inset-0">
                  {/* Horizontal road */}
                  <div className={`absolute top-1/2 left-0 w-full bg-[#364152] transform -translate-y-1/2 shadow-2xl ${isFullscreen ? 'h-40' : 'h-20'}`}>
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-yellow-400 opacity-90 transform -translate-y-1/2"></div>
                  </div>
                  
                  {/* Vertical road */}
                  <div className={`absolute left-1/2 top-0 h-full bg-[#364152] transform -translate-x-1/2 shadow-2xl ${isFullscreen ? 'w-40' : 'w-20'}`}>
                    <div className="absolute left-1/2 top-0 w-1 h-full bg-yellow-400 opacity-90 transform -translate-x-1/2"></div>
                  </div>
                  
                  {/* Intersection center box */}
                  <div className={`absolute top-1/2 left-1/2 bg-[#4B5461] rounded-lg transform -translate-x-1/2 -translate-y-1/2 shadow-2xl ${isFullscreen ? 'w-40 h-40' : 'w-20 h-20'}`}>
                  </div>

                  {/* 🚶‍♂️ Minimalist Compact Zebra Crossings & High-Visibility Pedestrian Walkers */}
                  
                  {/* North Crosswalk */}
                  {(() => {
                    const pN = state?.pedestrian_signals?.N || 'STOP';
                    const isWalk = pN === 'WALK';
                    return (
                      <>
                        <div className={`absolute left-1/2 transform -translate-x-1/2 z-10 pointer-events-none ${
                          isFullscreen 
                            ? 'top-[calc(50%-145px)] w-32 h-12' 
                            : 'top-[calc(50%-78px)] w-16 h-6.5'
                        }`}>
                          <div className="w-full h-full flex justify-between px-0.5">
                            {[...Array(8)].map((_, i) => (
                              <div key={i} className={`h-full rounded-[0.5px] bg-white shadow-sm ${isFullscreen ? 'w-[3.5px]' : 'w-[2px]'}`} />
                            ))}
                          </div>
                          {isWalk && (
                            <motion.div
                              className={`absolute select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                                isFullscreen ? 'text-sm -top-4' : 'text-xs -top-3'
                              }`}
                              animate={{ left: ['-5%', '100%'], opacity: [0, 1, 1, 1, 0] }}
                              transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                            >
                              🚶‍♀️
                            </motion.div>
                          )}
                        </div>
                        {/* North Pedestrian Signal Light (Right Curb) */}
                        <div className={`absolute z-20 ${
                          isFullscreen 
                            ? 'left-[calc(50%+84px)] top-[calc(50%-148px)]' 
                            : 'left-[calc(50%+42px)] top-[calc(50%-80px)]'
                        }`}>
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
                        <div className={`absolute left-1/2 transform -translate-x-1/2 z-10 pointer-events-none ${
                          isFullscreen 
                            ? 'top-[calc(50%+102px)] w-32 h-12' 
                            : 'top-[calc(50%+55px)] w-16 h-6.5'
                        }`}>
                          <div className="w-full h-full flex justify-between px-0.5">
                            {[...Array(8)].map((_, i) => (
                              <div key={i} className={`h-full rounded-[0.5px] bg-white shadow-sm ${isFullscreen ? 'w-[3.5px]' : 'w-[2px]'}`} />
                            ))}
                          </div>
                          {isWalk && (
                            <motion.div
                              className={`absolute select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                                isFullscreen ? 'text-sm -top-4' : 'text-xs -top-3'
                              }`}
                              animate={{ left: ['105%', '-5%'], opacity: [0, 1, 1, 1, 0] }}
                              transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                            >
                              🚶‍♀️
                            </motion.div>
                          )}
                        </div>
                        {/* South Pedestrian Signal Light (Left Curb) */}
                        <div className={`absolute z-20 ${
                          isFullscreen 
                            ? 'left-[calc(50%-98px)] top-[calc(50%+102px)]' 
                            : 'left-[calc(50%-52px)] top-[calc(50%+55px)]'
                        }`}>
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
                        <div className={`absolute top-1/2 transform -translate-y-1/2 z-10 flex flex-col justify-between pointer-events-none ${
                          isFullscreen 
                            ? 'left-[calc(50%-145px)] w-12 h-32 py-0.5' 
                            : 'left-[calc(50%-78px)] w-6.5 h-16 py-0.5'
                        }`}>
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className={`w-full rounded-[0.5px] bg-white shadow-sm ${isFullscreen ? 'h-[3.5px]' : 'h-[2px]'}`} />
                          ))}
                          {isWalk && (
                            <motion.div
                              className={`absolute select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                                isFullscreen ? 'text-sm -left-4' : 'text-xs -left-3'
                              }`}
                              animate={{ top: ['-5%', '100%'], opacity: [0, 1, 1, 1, 0] }}
                              transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                            >
                              🚶‍♀️
                            </motion.div>
                          )}
                        </div>
                        {/* West Pedestrian Signal Light (Top Curb) */}
                        <div className={`absolute z-20 ${
                          isFullscreen 
                            ? 'left-[calc(50%-148px)] top-[calc(50%-98px)]' 
                            : 'left-[calc(50%-80px)] top-[calc(50%-52px)]'
                        }`}>
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
                        <div className={`absolute top-1/2 transform -translate-y-1/2 z-10 flex flex-col justify-between pointer-events-none ${
                          isFullscreen 
                            ? 'left-[calc(50%+102px)] w-12 h-32 py-0.5' 
                            : 'left-[calc(50%+55px)] w-6.5 h-16 py-0.5'
                        }`}>
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className={`w-full rounded-[0.5px] bg-white shadow-sm ${isFullscreen ? 'h-[3.5px]' : 'h-[2px]'}`} />
                          ))}
                          {isWalk && (
                            <motion.div
                              className={`absolute select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                                isFullscreen ? 'text-sm -right-4' : 'text-xs -right-3'
                              }`}
                              animate={{ top: ['105%', '-5%'], opacity: [0, 1, 1, 1, 0] }}
                              transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                            >
                              🚶‍♀️
                            </motion.div>
                          )}
                        </div>
                        {/* East Pedestrian Signal Light (Bottom Curb) */}
                        <div className={`absolute z-20 ${
                          isFullscreen 
                            ? 'left-[calc(50%+102px)] top-[calc(50%+84px)]' 
                            : 'left-[calc(50%+55px)] top-[calc(50%+42px)]'
                        }`}>
                          <PedestrianLight status={pE} isFullscreen={isFullscreen} />
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Traffic Lights */}
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

                {/* Cars */}
                <AnimatePresence>
                  {state?.cars && Object.entries(state.cars).map(([lane, cars]) =>
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

                {/* Queue Indicators matching Image 2 */}
                {state?.queues && Object.entries(state.queues).map(([lane, count]) => (
                  <div
                    key={lane}
                    className={`absolute text-xs font-bold text-white bg-[#1E2939] px-2.5 py-1 rounded-md shadow-sm z-30 ${
                      lane === 'N' ? 'top-2 left-1/2 transform -translate-x-1/2' :
                      lane === 'S' ? 'bottom-2 left-1/2 transform -translate-x-1/2' :
                      lane === 'E' ? 'right-2 top-1/2 transform -translate-y-1/2' :
                      'left-2 top-1/2 transform -translate-y-1/2'
                    }`}
                  >
                    {lane}: {count}
                  </div>
                ))}

                {/* Fullscreen Mode Overlay Controls */}
                {isFullscreen && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-50 select-none">
                    <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 text-white px-5 py-2.5 rounded-xl shadow-2xl">
                      <span className="text-sm font-semibold">
                        Current: {state?.signal} ({state?.phase || 'GREEN'}) | {state?.clearance_status ? state.clearance_status : `${state?.phase_label || 'Remaining'}: ${state?.phase_remaining_sec ?? 0}s`}
                      </span>
                    </div>

                    {/* Simulation Speed Control */}
                    <div className="flex items-center space-x-1 bg-gray-900/90 backdrop-blur-md border border-gray-700 p-1 rounded-xl shadow-2xl">
                      {[1, 2, 3].map(s => (
                        <button
                          key={s}
                          onClick={() => setSpeed && setSpeed(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            simulationSpeed === s
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                          title={`Set simulation speed to ${s}x`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => triggerEmergencyVehicle && triggerEmergencyVehicle()}
                      disabled={state?.emergencyActive}
                      className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-2xl flex items-center space-x-2 ${
                        state?.emergencyActive
                          ? 'bg-red-700 animate-pulse cursor-default'
                          : 'bg-red-600 hover:bg-red-700 active:scale-95'
                      }`}
                      title="Dispatch emergency vehicle (Random approach)"
                    >
                      <span>{state?.emergencyActive ? `🚨 EMERGENCY ACTIVE (${state?.emergencyDirection || ''})` : 'EMERGENCY MODE'}</span>
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2.5 rounded-xl bg-gray-900/90 hover:bg-gray-800 text-white border border-gray-700 shadow-2xl transition cursor-pointer"
                      title="Exit Fullscreen"
                    >
                      <Minimize size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Signal Timer & Emergency Mode Button */}
              {state?.phase_remaining_sec !== undefined && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-sm">
                    <span className="text-sm font-medium">
                      Current: {state.signal} ({state.phase || 'GREEN'}) | {state.clearance_status ? state.clearance_status : `${state.phase_label || 'Remaining'}: ${state.phase_remaining_sec}s`}
                    </span>
                  </div>
                  <button
                    onClick={() => triggerEmergencyVehicle && triggerEmergencyVehicle()}
                    disabled={state?.emergencyActive}
                    className={`px-5 py-2 rounded-lg font-bold text-sm text-white transition-all shadow-md flex items-center space-x-1.5 ${
                      state?.emergencyActive
                        ? 'bg-red-700 animate-pulse cursor-default'
                        : 'bg-red-600 hover:bg-red-700 active:scale-95'
                    }`}
                    title="Dispatch emergency vehicle (Random approach)"
                  >
                    <span>{state?.emergencyActive ? `🚨 EMERGENCY ACTIVE (${state?.emergencyDirection || ''})` : 'EMERGENCY MODE'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Panel with new metrics */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Analytics
              </h2>
              
              {/* Quick Stats */}
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Current Signal</div>
                  <div className="text-2xl font-bold text-blue-800">{state?.signal || 'None'}</div>
                  {state?.empty_roads?.includes(state?.signal) && (
                    <div className="text-xs text-gray-500 mt-1">⚠️ Empty Road</div>
                  )}
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Active Roads</div>
                  <div className="text-2xl font-bold text-green-800">
                    {state?.roads_with_traffic?.length || 0}/4
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    {state?.roads_with_traffic?.join(', ') || 'None'}
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Wait Time</div>
                  <div className="text-2xl font-bold text-orange-800">
                    {(state?.avg_wait_time || 0).toFixed(1)}s
                  </div>
                </div>
                
                {state?.emergencyActive && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-sm text-red-600 font-medium">Emergency Mode</div>
                    <div className="text-lg font-bold text-red-800">
                      {state.emergencyDirection} Lane
                    </div>
                    <div className="text-xs text-red-700 mt-1">Priority Active</div>
                  </div>
                )}
                
                {state?.postEmergencyMode && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-600 font-medium">Post-Emergency</div>
                    <div className="text-lg font-bold text-yellow-800">
                      Rotation Mode
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      {60 - (state.postEmergencyTimer || 0)}s remaining
                    </div>
                  </div>
                )}
              </div>
              
              <ChartPanel metrics={metrics} state={state} />
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">System Controls</h3>
                <button
                  onClick={() => setShowControls(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Data Source Toggle */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Data Source
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={switchToMock}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        useMock
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Mock Data
                    </button>
                    <button
                      onClick={switchToBackend}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        !useMock
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Live Backend
                    </button>
                  </div>
                </div>

                {/* Simulation Speed */}
                {useMock && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Simulation Speed: {simulationSpeed}x
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={simulationSpeed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Actions
                  </label>
                  <div className="space-x-2">
                    {useMock && (
                      <button
                        onClick={resetSimulation}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show Controls Button (when collapsed) */}
        {!showControls && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowControls(true)}
              className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Show Controls
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;