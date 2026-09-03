import { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  Compass, 
  Clock, 
  Activity, 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  TrendingUp, 
  Car, 
  Timer, 
  Fuel, 
  Leaf, 
  IndianRupee,
  Play,
  Pause
} from 'lucide-react';
import { useTrafficData } from '../utils/useTrafficData';
import Loader from '../components/Loader';
import { BenchmarkComparison } from '../components/BenchmarkComparison';


const Analytics = ({ onNavigate }) => {
  const { 
    state, 
    metrics, 
    analyticsSession, 
    loading, 
    simulationSpeed, 
    setSpeed, 
    resetSimulation,
    comparisonResult,
    comparisonStatus,
    comparisonError,
    rerunComparison,
    videoReplayActive
  } = useTrafficData();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'charts' | 'environmental'

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader message="Loading Current Simulation Analytics Engine..." />
      </div>
    );
  }

  const session = analyticsSession || {
    sessionId: 'SIM-INIT',
    sessionStartTime: Date.now(),
    sessionDurationSeconds: 0,
    eventCount: 0,
    isRunning: false,
    totalVehicles: 0,
    vehiclesProcessed: 0,
    activeVehicles: 0,
    emergencyVehicles: 0,
    emergencyPreemptions: 0,
    averageWaitTime: 0,
    hasWaitTimeData: false,
    peakActiveVehicles: 0,
    peakQueueLength: 0,
    peakThroughput: 0,
    currentThroughput: 0,
    vehicleTypeData: [],
    laneData: [],
    signalStateData: [],
    timeSeries: [],
    hasTimeSeriesData: false,
    emergencyEvents: [],
    sustainability: { hasData: false }
  };

  // Format session duration helper
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const startTimeString = new Date(session.sessionStartTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const isSimulationActive = simulationSpeed > 0;
  const hasData = session.totalVehicles > 0 || session.vehiclesProcessed > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* ── 1. Page Header & Session Control Strip ─────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="text-[#F59E0B]" size={28} />
                <span>Traffic Analytics</span>
              </h1>

              {/* Strict Data Source Indicator */}
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Data Source: Current Simulation
              </span>

              {/* Status Pill */}
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isSimulationActive 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isSimulationActive ? `Running (${simulationSpeed}x)` : 'Paused'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time analytics from the current simulation session. Zero mocked or fabricated numbers.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setSpeed(isSimulationActive ? 0 : 1)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              {isSimulationActive ? <Pause size={14} /> : <Play size={14} />}
              <span>{isSimulationActive ? 'Pause Sim' : 'Resume Sim'}</span>
            </button>

            <button
              onClick={resetSimulation}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Clear all session data and start fresh"
            >
              <RotateCcw size={14} />
              <span>Reset Session</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('live-intersection')}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#07172E] hover:bg-[#0D2E5C] text-white flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Compass size={14} />
              <span>Live Intersection</span>
            </button>
          </div>

        </div>

        {/* Session Metadata Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Session ID</span>
            <span className="font-mono font-bold text-slate-800">{session.sessionId}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Session Started</span>
            <span className="font-semibold text-slate-800">{startTimeString}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Elapsed Duration</span>
            <span className="font-semibold text-slate-800">{formatDuration(session.sessionDurationSeconds)}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Recorded Events</span>
            <span className="font-semibold text-blue-600">{session.eventCount} events</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 block font-medium text-[11px]">Active Signal</span>
            <span className="font-bold text-emerald-600">Lane {state?.signal || 'N'}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Required KPI Cards (Current Session Data) ────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Vehicles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Vehicles</span>
            <Car size={16} className="text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {session.totalVehicles}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Generated in session</p>
          </div>
        </div>

        {/* Vehicles Processed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Processed</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              {session.vehiclesProcessed}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Cleared intersection</p>
          </div>
        </div>

        {/* Active Vehicles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active in Grid</span>
            <Activity size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {session.activeVehicles}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">In approach lanes</p>
          </div>
        </div>

        {/* Average Waiting Time */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Wait Time</span>
            <Timer size={16} className="text-amber-500" />
          </div>
          <div className="mt-2">
            {session.hasWaitTimeData ? (
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
                {session.averageWaitTime}s
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 block py-1.5">
                Insufficient data
              </span>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">Measured wait/car</p>
          </div>
        </div>

        {/* Peak Traffic */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Peak Traffic</span>
            <TrendingUp size={16} className="text-purple-500" />
          </div>
          <div className="mt-2">
            {session.peakActiveVehicles > 0 ? (
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 tracking-tight">
                {session.peakActiveVehicles}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 block py-1.5">
                Insufficient data
              </span>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">Max concurrent cars</p>
          </div>
        </div>

        {/* Emergency Vehicles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Emergency</span>
            <ShieldAlert size={16} className="text-red-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
              {session.emergencyVehicles}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {session.emergencyPreemptions} priority waves
            </p>
          </div>
        </div>

      </div>

      {/* ── Saved Benchmark Comparison Section (Phase 3B) ──────── */}
      <BenchmarkComparison />

      {/* ── 3. Empty State Guard if No Traffic Generated Yet ────── */}

      {!hasData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
            🚦
          </div>
          <h3 className="text-lg font-bold text-slate-900">No traffic data yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Start the simulation or allow the current session to spawn vehicles. Analytics will automatically record and visualize live telemetry.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate && onNavigate('live-intersection')}
              className="px-5 py-2.5 rounded-xl bg-[#07172E] text-white text-xs font-bold hover:bg-[#0D2E5C] transition"
            >
              Open Live Intersection
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Main Charts Grid ─────────────────────────────────── */}
      {hasData && (
        <div className="space-y-6">
          
          {/* Row 1: Volume Over Time & Throughput Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Traffic Volume Over Time */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Traffic Volume Over Time</h3>
                  <p className="text-[11px] text-slate-500">Active vs Processed vehicle counts across simulation ticks</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
                  LINE CHART
                </span>
              </div>

              <div className="h-[250px] w-full pt-2">
                {session.hasTimeSeriesData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={session.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#07172E', borderRadius: '10px', border: '1px solid #1E293B', color: '#fff', fontSize: '11px' }}
                        itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                        labelStyle={{ color: '#F8FAFC', fontWeight: 700 }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="activeVehicles" 
                        name="Active in Lanes" 
                        stroke="#2563EB" 
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls={true}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="processedVehicles" 
                        name="Total Cleared" 
                        stroke="#059669" 
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Insufficient time-series data
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Traffic Throughput Trend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Traffic Throughput (Cars / Min)</h3>
                  <p className="text-[11px] text-slate-500">Real processing velocity derived from actual passed vehicles</p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">
                  RATE TREND
                </span>
              </div>

              <div className="h-[250px] w-full pt-2">
                {session.hasTimeSeriesData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={session.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} unit=" c/m" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#07172E', borderRadius: '10px', border: '1px solid #1E293B', color: '#fff', fontSize: '11px' }}
                        itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                        labelStyle={{ color: '#F8FAFC', fontWeight: 700 }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="throughput" 
                        name="Throughput (cars/min)" 
                        stroke="#D97706" 
                        strokeWidth={2.5}
                        dot={{ fill: '#D97706', r: 3 }}
                        isAnimationActive={false}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Insufficient throughput data
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Row 2: Traffic by Lane & Vehicle Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 3: Traffic by Lane / Direction (Bar Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Traffic by Lane / Direction</h3>
                  <p className="text-[11px] text-slate-500">Actual vehicle counts generated vs processed per approach</p>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
                  BAR CHART
                </span>
              </div>

              <div className="h-[250px] w-full pt-2">
                {session.laneData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={session.laneData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="label" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#07172E', borderRadius: '10px', border: '1px solid #1E293B', color: '#fff', fontSize: '11px' }}
                        itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                        labelStyle={{ color: '#F8FAFC', fontWeight: 700 }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="arrivals" name="Total Spawned" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="processed" name="Cleared" fill="#059669" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="activeQueue" name="Queued" fill="#D97706" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No lane data recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Vehicle Type Distribution (Pie Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Vehicle Type Distribution</h3>
                  <p className="text-[11px] text-slate-500">Actual classification breakdown from current session traffic</p>
                </div>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2.5 py-0.5 rounded-full">
                  PIE CHART
                </span>
              </div>

              <div className="h-[250px] w-full flex flex-col sm:flex-row items-center justify-center">
                {session.vehicleTypeData.length > 0 ? (
                  <>
                    <div className="w-[180px] h-[180px] shrink-0 flex items-center justify-center">
                      <PieChart width={180} height={180}>
                        <Pie
                          data={session.vehicleTypeData}
                          cx={90}
                          cy={90}
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="count"
                          isAnimationActive={false}
                        >
                          {session.vehicleTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#07172E', borderRadius: '10px', border: '1px solid #1E293B', color: '#FFFFFF', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                          itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                          labelStyle={{ color: '#F8FAFC', fontWeight: 700 }}
                        />
                      </PieChart>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 sm:ml-4 flex-1">
                      {session.vehicleTypeData.map(item => (
                        <div key={item.type} className="flex items-center justify-between py-1 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-1 ring-slate-900/10" style={{ backgroundColor: item.color }}></span>
                            <span className="font-semibold text-slate-800">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-600 font-medium">{item.count} cars</span>
                            <span className="font-bold text-slate-900">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No vehicle distribution data recorded
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Row 3: Signal Phase State Distribution & Queue Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 5: Signal State Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Signal State Distribution</h3>
                  <p className="text-[11px] text-slate-500">Actual time allocated to green phase per direction</p>
                </div>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-full">
                  PHASE TIME
                </span>
              </div>

              <div className="h-[250px] w-full flex flex-col sm:flex-row items-center justify-center">
                {session.signalStateData.length > 0 ? (
                  <>
                    <div className="w-[180px] h-[180px] shrink-0 flex items-center justify-center">
                      <PieChart width={180} height={180}>
                        <Pie
                          data={session.signalStateData}
                          cx={90}
                          cy={90}
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="seconds"
                          isAnimationActive={false}
                        >
                          {session.signalStateData.map((entry, index) => (
                            <Cell key={`sig-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#07172E', borderRadius: '10px', border: '1px solid #1E293B', color: '#FFFFFF', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                          itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                          labelStyle={{ color: '#F8FAFC', fontWeight: 700 }}
                        />
                      </PieChart>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 sm:ml-4 flex-1">
                      {session.signalStateData.map(item => (
                        <div key={item.direction} className="flex items-center justify-between py-1 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-1 ring-slate-900/10" style={{ backgroundColor: item.color }}></span>
                            <span className="font-semibold text-slate-800">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-600 font-medium">{item.seconds}s green</span>
                            <span className="font-bold text-slate-900">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 text-[11px] flex justify-between">
                        <span className="text-slate-600 font-medium">Total Switches:</span>
                        <span className="font-bold text-slate-900">{session.signalSwitchCount} times</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No signal phase data recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Chart 6: Queue & Congestion Trend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Queue & Congestion Trend</h3>
                  <p className="text-[11px] text-slate-500">Real cumulative queue sizes observed in all 4 approaches</p>
                </div>
                <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2.5 py-0.5 rounded-full">
                  QUEUE SIZES
                </span>
              </div>

              <div className="h-[250px] w-full pt-2">
                {session.hasTimeSeriesData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={session.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} label={{ value: 'Cars', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#07172E', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="totalQueue" name="Total Queue" stroke="#EF4444" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="queueN" name="Queue N" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="queueS" name="Queue S" stroke="#10B981" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No queue trend data recorded yet
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Row 4: Emergency Events Log & Derived ROI Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Emergency Vehicle Priority Log */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Emergency Priority Log</h3>
                  <p className="text-[11px] text-slate-500">Actual priority pre-emption activations</p>
                </div>
                <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  {session.emergencyEvents.length} Events
                </span>
              </div>

              <div className="space-y-2.5 max-h-[200px] overflow-y-auto pt-1">
                {session.emergencyEvents.length > 0 ? (
                  session.emergencyEvents.map(evt => (
                    <div key={evt.id} className="p-2.5 rounded-xl bg-red-50/60 border border-red-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-red-900">
                          <span>🚨</span>
                          <span>Lane {evt.direction} Preemption</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{evt.timestamp} • {evt.id}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        evt.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-200 text-red-900 animate-pulse'
                      }`}>
                        {evt.resolved ? 'CLEARED' : 'ACTIVE'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <ShieldAlert size={28} className="mx-auto mb-2 text-slate-300" />
                    No emergency vehicles detected in this session
                  </div>
                )}
              </div>
            </div>

            {/* Derived Environmental & Commuter Benefit Audit */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Derived Environmental & Commuter Impact</h3>
                  <p className="text-[11px] text-slate-500">
                    Calculated strictly from {session.vehiclesProcessed} passed cars & measured delay reduction (Baseline: 45.0s)
                  </p>
                </div>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-full">
                  DERIVED MATRIX
                </span>
              </div>

              {session.sustainability.hasData ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                    <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
                      <span>Fuel Conserved</span>
                      <Fuel size={16} />
                    </div>
                    <div className="text-2xl font-black text-emerald-800">
                      {session.sustainability.fuelSavedLiters} L
                    </div>
                    <p className="text-[10px] text-slate-500">Rate: 0.00028 L/sec delay reduction</p>
                  </div>

                  <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100 space-y-1">
                    <div className="flex items-center justify-between text-teal-700 text-xs font-bold">
                      <span>CO₂ Avoided</span>
                      <Leaf size={16} />
                    </div>
                    <div className="text-2xl font-black text-teal-800">
                      {session.sustainability.co2ReducedKg} kg
                    </div>
                    <p className="text-[10px] text-slate-500">Factor: 2.31 kg CO₂ per liter</p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
                    <div className="flex items-center justify-between text-amber-700 text-xs font-bold">
                      <span>Economic Value</span>
                      <IndianRupee size={16} />
                    </div>
                    <div className="text-2xl font-black text-amber-800">
                      ₹{session.sustainability.economicSavingsRupees.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-slate-500">Retail fuel + commuter time value</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  <AlertCircle size={24} className="mx-auto mb-1.5 text-slate-300" />
                  <p className="font-semibold text-slate-600">Insufficient Data for Environmental Audit</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vehicles must pass through the intersection to compute measured fuel & emissions savings.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Fixed 45s vs Adaptive Computed Benchmark Comparison (Always accessible) */}
      <div className="mt-8">
        <BenchmarkComparison 
          data={comparisonResult} 
          status={comparisonStatus} 
          error={comparisonError}
          onRerun={rerunComparison} 
          isLiveRun={videoReplayActive} 
        />
      </div>

    </div>
  );
};

export default Analytics;
