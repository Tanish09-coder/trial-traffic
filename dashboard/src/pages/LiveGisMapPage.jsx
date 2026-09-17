import { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  MapPin, 
  Layers, 
  Activity, 
  Zap, 
  Siren, 
  Clock, 
  Car, 
  Bike,
  Truck,
  Bus,
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Compass,
  Building2,
  Navigation,
  Radio,
  Search,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Filter,
  Check
} from 'lucide-react';
import GoogleTrafficMap from '../components/GoogleTrafficMap';
import { CITY_PRESETS } from '../utils/googleTrafficService';
import { useLanguage } from '../context/LanguageContext';
import { useTrafficData } from '../utils/useTrafficData';

export const LiveGisMapPage = ({ onNavigate }) => {
  const { lang } = useLanguage();
  const { state, metrics } = useTrafficData();
  const [selectedCityId, setSelectedCityId] = useState('mumbai');
  const [selectedJunctionId, setSelectedJunctionId] = useState('MUM-01');
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyVehicleId, setEmergencyVehicleId] = useState('AMB-108');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'congested' | 'moderate' | 'optimal'

  const currentCity = CITY_PRESETS.find(c => c.id === selectedCityId) || CITY_PRESETS[0];

  // Dynamic live fluctuations for arterial speeds & vehicle counts
  const [arterials, setArterials] = useState(currentCity.arterials);
  const [junctions, setJunctions] = useState(currentCity.junctions);

  useEffect(() => {
    setArterials(currentCity.arterials);
    setJunctions(currentCity.junctions);
    if (currentCity.junctions.length > 0) {
      setSelectedJunctionId(currentCity.junctions[0].id);
    }
  }, [selectedCityId, currentCity]);

  // Periodic subtle live fluctuation to simulate real-time sensor & Google traffic updates
  useEffect(() => {
    const interval = setInterval(() => {
      setArterials(prev => 
        prev.map(art => {
          const delta = (Math.random() - 0.48) * 2;
          const newCurrentMin = Math.max(art.freeFlowMin, Math.round(art.currentMin + delta));
          const delayPercent = Math.round(((newCurrentMin - art.freeFlowMin) / art.freeFlowMin) * 100);
          let status = 'optimal';
          if (delayPercent > 60) status = 'congested';
          else if (delayPercent > 20) status = 'moderate';

          return {
            ...art,
            currentMin: newCurrentMin,
            status
          };
        })
      );

      setJunctions(prev =>
        prev.map(junc => {
          const countDelta = Math.floor((Math.random() - 0.45) * 4);
          const newVehCount = Math.max(20, (junc.vehicleCount || 80) + countDelta);
          const newPcu = Math.round(newVehCount * 1.15);
          const timerCountdown = junc.timer > 1 ? junc.timer - 1 : 28;

          return {
            ...junc,
            vehicleCount: newVehCount,
            pcu: newPcu,
            timer: timerCountdown,
            breakdown: {
              cars: Math.round(newVehCount * 0.48),
              bikes: Math.round(newVehCount * 0.36),
              autos: Math.round(newVehCount * 0.10),
              heavies: Math.max(2, Math.round(newVehCount * 0.06))
            }
          };
        })
      );

      setLastRefreshed(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, [currentCity]);

  // Filtered Signals List based on Search and Status Filter
  const filteredJunctions = useMemo(() => {
    return junctions.filter(junc => {
      const matchesSearch = 
        junc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        junc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (junc.area && junc.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (junc.road && junc.road.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || junc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [junctions, searchQuery, statusFilter]);

  const toggleEmergency = () => {
    setEmergencyActive(prev => !prev);
  };

  const selectedJunction = junctions.find(j => j.id === selectedJunctionId) || junctions[0] || currentCity.junctions[0];

  // Aggregate live metrics across all corridor junctions
  const totalVehiclesCount = junctions.reduce((acc, j) => acc + (j.vehicleCount || 0), 0);
  const totalPcuCount = junctions.reduce((acc, j) => acc + (j.pcu || 0), 0);
  const totalCars = junctions.reduce((acc, j) => acc + (j.breakdown?.cars || 0), 0);
  const totalBikes = junctions.reduce((acc, j) => acc + (j.breakdown?.bikes || 0), 0);
  const totalAutos = junctions.reduce((acc, j) => acc + (j.breakdown?.autos || 0), 0);
  const totalHeavies = junctions.reduce((acc, j) => acc + (j.breakdown?.heavies || 0), 0);

  // Approach calculations for selected signal
  const selVeh = selectedJunction?.vehicleCount || 100;
  const approachNorth = { count: Math.round(selVeh * 0.32), queue: Math.round(selVeh * 0.9), speed: 24 };
  const approachSouth = { count: Math.round(selVeh * 0.28), queue: Math.round(selVeh * 0.75), speed: 28 };
  const approachEast = { count: Math.round(selVeh * 0.22), queue: Math.round(selVeh * 0.6), speed: 32 };
  const approachWest = { count: Math.round(selVeh * 0.18), queue: Math.round(selVeh * 0.45), speed: 36 };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 space-y-6 animate-fadeIn select-none pb-12">
      
      {/* 1. Header Banner & City Selector */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#0A1F44] text-[#F5A623] rounded-xl shadow-md flex-shrink-0">
            <Globe size={24} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-[#0A1F44] tracking-tight">
                {lang === 'HI' ? 'शहर के सभी ट्रैफिक सिग्नल व लाइव डेटा सर्च' : 'City-Wide Traffic Signals & Live Telemetry Directory'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
                {junctions.length} SIGNALS MONITORED
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {lang === 'HI' 
                ? 'शहर का कोई भी सिग्नल खोजें और वास्तविक समय की वाहन संख्या, सिग्नल टाइमर व भीड़भाड़ देखें'
                : 'Search any traffic signal in the city to pan the map and inspect real-time vehicle counts, phase timers, and queue density.'}
            </p>
          </div>
        </div>

        {/* City Selector Pills */}
        <div className="flex items-center flex-wrap gap-2">
          {CITY_PRESETS.map((city) => {
            const isSelected = selectedCityId === city.id;
            return (
              <button
                key={city.id}
                onClick={() => {
                  setSelectedCityId(city.id);
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#003366] text-white shadow-md border border-[#003366]'
                    : 'bg-[#F8FAFC] hover:bg-slate-100 text-[#0A1F44] border border-[#E2E8F0]'
                }`}
              >
                <Building2 size={13} className={isSelected ? 'text-[#F5A623]' : 'text-slate-400'} />
                <span>{lang === 'HI' ? city.nameHi.split('—')[0] : city.name.split('—')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isSelected ? 'bg-slate-900 text-[#F5A623]' : 'bg-slate-200 text-slate-700'}`}>
                  {city.junctions.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. City-Wide Instant Signal Search & Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'HI' 
                ? 'सिग्नल का नाम, कोड, सड़क या क्षेत्र खोजें (उदा. Dadar, Worli, BKC, Linking Road)...' 
                : 'Search any signal by Name, Code, Road, or Area (e.g. Dadar, BKC, Worli, Santacruz, Linking Road)...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0A1F44] font-medium placeholder-slate-400 focus:outline-hidden focus:border-[#003366] focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">Status:</span>
          {[
            { id: 'all', label: 'All Signals' },
            { id: 'congested', label: '🚨 Congested', count: junctions.filter(j => j.status === 'congested').length },
            { id: 'moderate', label: '⚠️ Moderate', count: junctions.filter(j => j.status === 'moderate').length },
            { id: 'optimal', label: '🟢 Free Flow', count: junctions.filter(j => j.status === 'optimal').length }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                statusFilter === f.id
                  ? 'bg-[#003366] text-white shadow-xs'
                  : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{f.label}</span>
              {f.count !== undefined && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${statusFilter === f.id ? 'bg-slate-900 text-[#F5A623]' : 'bg-slate-300 text-slate-800'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Split View: Searchable Signals Directory (Left) + Google Map Viewport & Selected Live Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Searchable Signal Directory Cards */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex-1 flex flex-col min-h-[580px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal size={15} className="text-[#003366]" />
                <h3 className="text-xs font-black text-[#0A1F44] uppercase tracking-wide">
                  {lang === 'HI' ? 'ट्रैफ़िक सिग्नल सूची' : 'Traffic Signals Directory'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Showing {filteredJunctions.length} of {junctions.length}
              </span>
            </div>

            {/* Signals Scrollable Card List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[520px] pr-1.5">
              {filteredJunctions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No signals found matching "{searchQuery}".
                </div>
              ) : (
                filteredJunctions.map((junc) => {
                  const isSelected = selectedJunctionId === junc.id;
                  const isCongested = junc.status === 'congested';
                  const isModerate = junc.status === 'moderate';

                  return (
                    <div
                      key={junc.id}
                      onClick={() => setSelectedJunctionId(junc.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-50/70 border-[#003366] ring-2 ring-[#003366]/30 shadow-md'
                          : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Code, Name, Phase */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isCongested ? 'bg-rose-500 animate-pulse' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <span className="text-xs font-mono font-black text-[#003366]">{junc.code}</span>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-[#F5A623] font-bold">
                          {junc.phase} • {junc.timer}s Green
                        </span>
                      </div>

                      {/* Signal Name & Area */}
                      <div className="text-xs font-bold text-[#0A1F44] mb-1">
                        {junc.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mb-2 truncate" title={junc.road}>
                        📍 {junc.area} • {junc.road}
                      </div>

                      {/* Live Metrics Row */}
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                        <span className="flex items-center space-x-1 font-bold text-slate-700">
                          <Car size={12} className="text-[#003366]" />
                          <span>{junc.vehicleCount} Vehicles</span>
                          <span className="text-slate-400 font-normal">({junc.pcu} PCU)</span>
                        </span>

                        <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                          isCongested ? 'bg-rose-100 text-rose-800' : isModerate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {junc.speedKmph || 25} km/h
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute right-2 top-2">
                          <span className="w-2 h-2 rounded-full bg-[#003366]" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Google Map with Auto-Pan & Detailed Selected Signal Inspector */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          
          {/* Main Google Map Viewport */}
          <div className="h-[460px] w-full rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm">
            <GoogleTrafficMap
              selectedCity={currentCity}
              junctions={junctions}
              emergencyActive={emergencyActive}
              emergencyVehicleId={emergencyVehicleId}
              onSelectJunction={(id) => setSelectedJunctionId(id)}
              selectedJunctionId={selectedJunctionId}
            />
          </div>

          {/* Detailed Selected Signal Live Telemetry Inspector Card */}
          {selectedJunction && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded bg-[#0A1F44] text-[#F5A623] font-mono font-black text-xs">
                      {selectedJunction.code}
                    </span>
                    <h3 className="text-base font-black text-[#0A1F44]">
                      {selectedJunction.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 {selectedJunction.road} • {selectedJunction.area} ({selectedJunction.lat?.toFixed(4)}, {selectedJunction.lng?.toFixed(4)})
                  </p>
                </div>

                {/* Emergency Preemption Button */}
                <button
                  onClick={toggleEmergency}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                    emergencyActive 
                      ? 'bg-rose-600 text-white animate-pulse shadow-rose-200' 
                      : 'bg-[#003366] hover:bg-[#1E4D8C] text-white'
                  }`}
                >
                  <Siren size={14} className={emergencyActive ? 'animate-spin' : ''} />
                  <span>{emergencyActive ? 'Preemption Active' : 'Trigger Ambulance Green Wave'}</span>
                </button>
              </div>

              {/* 4-Way Approach Live Queues & Counts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>⬆️ North Approach</span>
                    <span className="text-emerald-600 font-bold">{approachNorth.speed} km/h</span>
                  </div>
                  <div className="text-base font-black text-[#0A1F44] font-mono mt-1">
                    {approachNorth.count} <span className="text-xs font-normal text-slate-500">Vehicles</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Queue: {approachNorth.queue}m</div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>⬇️ South Approach</span>
                    <span className="text-emerald-600 font-bold">{approachSouth.speed} km/h</span>
                  </div>
                  <div className="text-base font-black text-[#0A1F44] font-mono mt-1">
                    {approachSouth.count} <span className="text-xs font-normal text-slate-500">Vehicles</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Queue: {approachSouth.queue}m</div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>➡️ East Approach</span>
                    <span className="text-amber-600 font-bold">{approachEast.speed} km/h</span>
                  </div>
                  <div className="text-base font-black text-[#0A1F44] font-mono mt-1">
                    {approachEast.count} <span className="text-xs font-normal text-slate-500">Vehicles</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Queue: {approachEast.queue}m</div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>⬅️ West Approach</span>
                    <span className="text-emerald-600 font-bold">{approachWest.speed} km/h</span>
                  </div>
                  <div className="text-base font-black text-[#0A1F44] font-mono mt-1">
                    {approachWest.count} <span className="text-xs font-normal text-slate-500">Vehicles</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Queue: {approachWest.queue}m</div>
                </div>
              </div>

              {/* Vehicle Classification Breakdown for this Signal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between">
                  <span>🚗 Cars (LMV)</span>
                  <span className="font-mono font-black text-sm">{selectedJunction.breakdown?.cars || 42}</span>
                </div>
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
                  <span>🏍️ 2-Wheelers</span>
                  <span className="font-mono font-black text-sm">{selectedJunction.breakdown?.bikes || 34}</span>
                </div>
                <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
                  <span>🛺 Auto-Rickshaws</span>
                  <span className="font-mono font-black text-sm">{selectedJunction.breakdown?.autos || 12}</span>
                </div>
                <div className="bg-rose-50 text-rose-900 border border-rose-200 rounded-xl p-2.5 flex items-center justify-between">
                  <span>🚌 Buses & Trucks</span>
                  <span className="font-mono font-black text-sm">{selectedJunction.breakdown?.heavies || 6}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default LiveGisMapPage;
