import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  Activity, 
  Globe, 
  Car 
} from 'lucide-react';
import { 
  loadGoogleMapsScript, 
  getStoredApiKey, 
  setStoredApiKey, 
  GOV_DARK_MAP_STYLE 
} from '../utils/googleTrafficService';
import { useLanguage } from '../context/LanguageContext';

export const GoogleTrafficMap = ({ 
  selectedCity, 
  junctions = [], 
  emergencyActive = false, 
  emergencyVehicleId = 'AMB-108',
  onSelectJunction, 
  selectedJunctionId 
}) => {
  const { lang } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const markersRef = useRef([]);
  const emergencyPolylineRef = useRef(null);

  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [tempKeyInput, setTempKeyInput] = useState(getStoredApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(null);
  const [trafficLayerActive, setTrafficLayerActive] = useState(true);
  const [showVehicleCounts, setShowVehicleCounts] = useState(true);
  const [mapType, setMapType] = useState('dark'); // 'dark' | 'satellite' | 'hybrid' | 'roadmap'

  // Initialize Google Maps
  const initMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    setMapLoadError(null);
    const key = getStoredApiKey();

    if (!key) {
      setMapLoaded(false);
      setMapLoadError('NO_API_KEY');
      return;
    }

    try {
      const googleMaps = await loadGoogleMapsScript(key);
      const center = selectedCity?.center || { lat: 19.0607, lng: 72.8688 };
      const zoom = selectedCity?.zoom || 13;

      let mapTypeId = googleMaps.MapTypeId.ROADMAP;
      let styles = [];

      if (mapType === 'dark') {
        styles = GOV_DARK_MAP_STYLE;
      } else if (mapType === 'satellite') {
        mapTypeId = googleMaps.MapTypeId.SATELLITE;
      } else if (mapType === 'hybrid') {
        mapTypeId = googleMaps.MapTypeId.HYBRID;
      }

      const map = new googleMaps.Map(mapContainerRef.current, {
        center,
        zoom,
        mapTypeId,
        styles,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: false,
        gestureHandling: 'greedy'
      });

      mapInstanceRef.current = map;

      // Create Real-Time Traffic Layer
      const trafficLayer = new googleMaps.TrafficLayer();
      if (trafficLayerActive) {
        trafficLayer.setMap(map);
      }
      trafficLayerRef.current = trafficLayer;

      setMapLoaded(true);
      setMapLoadError(null);
    } catch (err) {
      console.warn('Google Maps load issue:', err);
      setMapLoaded(false);
      setMapLoadError(err.message || 'FAILED_TO_LOAD');
    }
  }, [selectedCity, mapType, trafficLayerActive]);

  // Handle City Change
  useEffect(() => {
    if (mapInstanceRef.current && window.google && selectedCity) {
      mapInstanceRef.current.panTo(selectedCity.center);
      mapInstanceRef.current.setZoom(selectedCity.zoom || 13);
    }
  }, [selectedCity]);

  // Handle Map Type Change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const googleMaps = window.google.maps;

    if (mapType === 'dark') {
      mapInstanceRef.current.setMapTypeId(googleMaps.MapTypeId.ROADMAP);
      mapInstanceRef.current.setOptions({ styles: GOV_DARK_MAP_STYLE });
    } else if (mapType === 'roadmap') {
      mapInstanceRef.current.setMapTypeId(googleMaps.MapTypeId.ROADMAP);
      mapInstanceRef.current.setOptions({ styles: [] });
    } else if (mapType === 'satellite') {
      mapInstanceRef.current.setMapTypeId(googleMaps.MapTypeId.SATELLITE);
      mapInstanceRef.current.setOptions({ styles: [] });
    } else if (mapType === 'hybrid') {
      mapInstanceRef.current.setMapTypeId(googleMaps.MapTypeId.HYBRID);
      mapInstanceRef.current.setOptions({ styles: [] });
    }
  }, [mapType]);

  // Handle Traffic Layer Toggle
  useEffect(() => {
    if (trafficLayerRef.current) {
      trafficLayerRef.current.setMap(trafficLayerActive ? mapInstanceRef.current : null);
    }
  }, [trafficLayerActive]);

  // Render Google Map Markers & Live Vehicle Counts
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const googleMaps = window.google.maps;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const cityJunctions = junctions.length > 0 ? junctions : (selectedCity?.junctions || []);

    cityJunctions.forEach((junc) => {
      const isSelected = selectedJunctionId === junc.id;
      const statusColor = junc.status === 'optimal' ? '#16A34A' : junc.status === 'moderate' ? '#F5A623' : '#DC2626';
      const vehCount = junc.vehicleCount || Math.round(junc.pcu * 0.9);
      const breakdown = junc.breakdown || {
        cars: Math.round(vehCount * 0.5),
        bikes: Math.round(vehCount * 0.35),
        autos: Math.round(vehCount * 0.1),
        heavies: Math.max(2, Math.round(vehCount * 0.05))
      };

      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="64" viewBox="0 0 60 64">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            <path d="M30 4C20.06 4 12 12.06 12 22c0 14 18 32 18 32s18-18 18-32c0-9.94-8.06-18-18-18z" fill="${isSelected ? '#003366' : statusColor}" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="30" cy="22" r="8" fill="#FFFFFF"/>
            <circle cx="30" cy="22" r="5" fill="${statusColor}"/>

            ${showVehicleCounts ? `
              <rect x="2" y="0" width="56" height="15" rx="7.5" fill="#0A1F44" stroke="#F5A623" stroke-width="1.2"/>
              <text x="30" y="11" fill="#FFFFFF" font-size="8.5" font-weight="900" font-family="monospace" text-anchor="middle">
                ${vehCount} VEH
              </text>
            ` : ''}
          </g>
        </svg>
      `;

      const marker = new googleMaps.Marker({
        position: { lat: junc.lat, lng: junc.lng },
        map: mapInstanceRef.current,
        title: `${junc.code} — ${junc.name} (${vehCount} Vehicles, ${junc.pcu} PCU)`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
          scaledSize: new googleMaps.Size(54, 58),
          anchor: new googleMaps.Point(27, 54)
        }
      });

      const infoWindow = new googleMaps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: sans-serif; color: #0A1F44; min-width: 200px;">
            <div style="font-size: 11px; font-weight: 800; color: #003366; display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px;">
              <span>${junc.code} • ${junc.name}</span>
              <span style="background: #0A1F44; color: #F5A623; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-family: monospace;">${junc.phase || 'NS'} ${junc.timer || 20}s</span>
            </div>
            <div style="margin-top: 6px; font-size: 13px; font-weight: bold;">
              ${vehCount} <span style="font-size: 10px; color: #64748B;">Vehicles (${junc.pcu} PCU)</span>
            </div>
            <div style="margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: #475569;">
              <div>🚗 Cars: <b>${breakdown.cars}</b></div>
              <div>🏍️ Bikes: <b>${breakdown.bikes}</b></div>
              <div>🛺 Autos: <b>${breakdown.autos}</b></div>
              <div>🚌 Heavy: <b>${breakdown.heavies}</b></div>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        if (onSelectJunction) onSelectJunction(junc.id);
      });

      markersRef.current.push(marker);
    });

    // Emergency Corridor Polyline
    if (emergencyActive && cityJunctions.length >= 2) {
      const path = cityJunctions.map(j => ({ lat: j.lat, lng: j.lng }));
      if (emergencyPolylineRef.current) emergencyPolylineRef.current.setMap(null);
      emergencyPolylineRef.current = new googleMaps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#DC2626',
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: mapInstanceRef.current
      });
    } else {
      if (emergencyPolylineRef.current) emergencyPolylineRef.current.setMap(null);
    }
  }, [junctions, selectedCity, selectedJunctionId, emergencyActive, showVehicleCounts, onSelectJunction]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  // Smoothly Pan & Zoom to selected junction when user picks one from the search list
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !selectedJunctionId) return;
    const currentJunctions = junctions.length > 0 ? junctions : (selectedCity?.junctions || []);
    const targetJunc = currentJunctions.find(j => j.id === selectedJunctionId);
    if (targetJunc && targetJunc.lat && targetJunc.lng) {
      mapInstanceRef.current.panTo({ lat: targetJunc.lat, lng: targetJunc.lng });
      mapInstanceRef.current.setZoom(16); // High-detail junction intersection view
    }
  }, [selectedJunctionId, junctions, selectedCity]);

  const handleSaveKey = () => {
    setStoredApiKey(tempKeyInput);
    setApiKey(tempKeyInput);
    setIsKeyModalOpen(false);
    window.location.reload();
  };

  const currentJunctions = junctions.length > 0 ? junctions : (selectedCity?.junctions || []);

  return (
    <div className="relative w-full h-full min-h-[560px] flex flex-col bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl select-none">
      
      {/* Top Map Control Bar */}
      <div className="bg-[#0A1F44] border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="flex items-center space-x-1.5 font-bold text-xs tracking-wide">
            <Globe size={14} className="text-[#F5A623]" />
            <span>{lang === 'HI' ? 'गूगल मैप्स लाइव जीआईएस व वाहन गणना' : 'Google Maps Live Traffic & Vehicle Count'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            {selectedCity?.name?.split('—')[0] || 'Corridor'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          
          {/* Traffic Layer Toggle */}
          <button
            onClick={() => setTrafficLayerActive(prev => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              trafficLayerActive 
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={13} className={trafficLayerActive ? 'text-emerald-400' : ''} />
            <span>{lang === 'HI' ? 'ट्रैफ़िक लेयर' : 'Traffic Layer'}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${trafficLayerActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700'}`}>
              {trafficLayerActive ? 'LIVE' : 'OFF'}
            </span>
          </button>

          {/* Vehicle Count Toggle */}
          <button
            onClick={() => setShowVehicleCounts(prev => !prev)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
              showVehicleCounts 
                ? 'bg-[#F5A623]/20 border-[#F5A623] text-[#F5A623]' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Car size={13} />
            <span>{lang === 'HI' ? 'वाहन गणना' : 'Vehicles'}</span>
          </button>

          {/* Map Base Style Selector */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-[11px]">
            {[
              { id: 'dark', label: 'Dark GIS' },
              { id: 'satellite', label: 'Satellite' },
              { id: 'hybrid', label: 'Hybrid' },
              { id: 'roadmap', label: 'Road' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setMapType(type.id)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  mapType === type.id 
                    ? 'bg-[#1E4D8C] text-white font-bold shadow-xs' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* API Key Button */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs transition cursor-pointer"
          >
            <Key size={12} className={apiKey ? 'text-emerald-400' : 'text-[#F5A623]'} />
            <span className="hidden sm:inline">{apiKey ? 'Key Active' : 'Set Key'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full h-full min-h-[480px] bg-[#111827]">
        {/* Real Google Map Div */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full absolute inset-0 z-0"
          style={{ display: mapLoaded ? 'block' : 'none' }}
        />

        {/* High-Fidelity Interactive GIS Fallback Canvas */}
        {!mapLoaded && (
          <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-between p-6 bg-radial from-[#1E293B] to-[#0F172A] z-0 overflow-hidden select-none">
            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
              <defs>
                <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gisGrid)" />
            </svg>

            {/* Arterial Connecting Routes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-1">
              {currentJunctions.map((junc, idx) => {
                const nextJunc = currentJunctions[(idx + 1) % currentJunctions.length];
                if (!nextJunc || currentJunctions.length < 2) return null;
                const x1 = 18 + (idx % 2 === 0 ? 15 : 60);
                const y1 = 25 + (idx < 2 ? 15 : 55);
                const x2 = 18 + ((idx + 1) % 2 === 0 ? 15 : 60);
                const y2 = 25 + ((idx + 1) < 2 ? 15 : 55);
                const strokeColor = junc.status === 'congested' ? '#DC2626' : junc.status === 'moderate' ? '#F5A623' : '#16A34A';
                return (
                  <g key={`route-${idx}`}>
                    <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                    <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
                  </g>
                );
              })}
            </svg>

            {/* Simulated Live Junction Nodes */}
            <div className="absolute inset-0 z-2">
              {currentJunctions.map((junc, idx) => {
                const posX = 18 + (idx % 2 === 0 ? 15 : 60);
                const posY = 25 + (idx < 2 ? 15 : 55);
                const isSelected = selectedJunctionId === junc.id;
                const statusBg = junc.status === 'congested' ? 'bg-rose-500' : junc.status === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500';
                const vehCount = junc.vehicleCount || Math.round(junc.pcu * 0.9);

                return (
                  <div
                    key={junc.id}
                    onClick={() => onSelectJunction && onSelectJunction(junc.id)}
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  >
                    <div className={`p-3 rounded-xl border backdrop-blur-md transition-all shadow-xl flex flex-col space-y-2 ${
                      isSelected 
                        ? 'bg-slate-900/95 border-[#F5A623] ring-2 ring-[#F5A623]/50 scale-105' 
                        : 'bg-slate-900/85 border-slate-700 hover:border-slate-500 hover:scale-102'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${statusBg} animate-pulse flex-shrink-0`} />
                        <span className="text-xs font-black text-white font-mono">{junc.code}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {junc.phase || 'NS'} {junc.timer || 20}s
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-bold truncate max-w-[170px]">{junc.name}</div>
                      {showVehicleCounts && (
                        <div className="bg-[#0A1F44] border border-[#1E4D8C] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-slate-300 text-[10px]">
                            <Car size={11} className="text-[#F5A623]" />
                            <span className="font-bold text-white font-mono text-xs">{vehCount}</span>
                            <span>Veh</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {junc.pcu} PCU
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Traffic Legend Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/90 rounded-lg px-3 py-2 text-white shadow-xl backdrop-blur-md z-10 flex items-center space-x-4 text-[11px]">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            {lang === 'HI' ? 'ट्रैफ़िक सघनता:' : 'Traffic Density:'}
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-semibold">Fast (&lt;85 PCU)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300 font-semibold">Moderate</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300 font-semibold">Heavy</span>
          </div>
        </div>
      </div>

      {/* Google Maps API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Key size={18} className="text-[#F5A623]" />
                <h3 className="font-bold text-sm">
                  {lang === 'HI' ? 'गूगल मैप्स API Key कॉन्फ़िगरेशन' : 'Google Maps API Key Configuration'}
                </h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Google Maps API Key
              </label>
              <input
                type="text"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-[#F5A623]"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                {lang === 'HI' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-lg bg-[#003366] hover:bg-[#1E4D8C] text-white text-xs font-bold border border-blue-400/40 transition cursor-pointer shadow-md flex items-center space-x-1.5"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>{lang === 'HI' ? 'सहेजें व लोड करें' : 'Save & Reload'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTrafficMap;
