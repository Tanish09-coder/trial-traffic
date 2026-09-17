// Google Maps & Traffic Intelligence Integration Service
// Comprehensive City-Wide Signal Directory & Real-Time Traffic Telemetry

const STORAGE_KEY = 'stms_google_maps_api_key';
const DEFAULT_FALLBACK_KEY = '';

export const CITY_PRESETS = [
  {
    id: 'mumbai',
    name: 'Mumbai Metropolitan Region',
    nameHi: 'मुंबई महानगर क्षेत्र',
    center: { lat: 19.0607, lng: 72.8688 },
    zoom: 12,
    junctions: [
      { 
        id: 'MUM-01', 
        code: 'WSL-01', 
        name: 'Worli Sea Link Interchange', 
        area: 'Worli / South Mumbai',
        road: 'Bandra-Worli Sea Link / Khan Abdul Ghaffar Khan Rd',
        lat: 19.0222, 
        lng: 72.8166, 
        pcu: 76, 
        vehicleCount: 68,
        breakdown: { cars: 36, bikes: 22, autos: 6, heavies: 4 },
        flowRatePerMin: 34,
        queueMeters: 45,
        status: 'optimal', 
        phase: 'NS', 
        timer: 24,
        speedKmph: 46
      },
      { 
        id: 'MUM-02', 
        code: 'DDR-02', 
        name: 'Dadar TT Circle Hub', 
        area: 'Dadar Central',
        road: 'Dr. Babasaheb Ambedkar Road / Tilak Bridge',
        lat: 19.0178, 
        lng: 72.8478, 
        pcu: 172, 
        vehicleCount: 154,
        breakdown: { cars: 72, bikes: 54, autos: 18, heavies: 10 },
        flowRatePerMin: 62,
        queueMeters: 145,
        status: 'congested', 
        phase: 'EW', 
        timer: 18,
        speedKmph: 14
      },
      { 
        id: 'MUM-03', 
        code: 'BKC-03', 
        name: 'BKC Central Plaza Junction', 
        area: 'Bandra Kurla Complex',
        road: 'BKC Main Avenue / Bharat Diamond Bourse Link',
        lat: 19.0664, 
        lng: 72.8677, 
        pcu: 114, 
        vehicleCount: 98,
        breakdown: { cars: 58, bikes: 26, autos: 10, heavies: 4 },
        flowRatePerMin: 46,
        queueMeters: 80,
        status: 'moderate', 
        phase: 'NS', 
        timer: 12,
        speedKmph: 28
      },
      { 
        id: 'MUM-04', 
        code: 'WEH-04', 
        name: 'Santacruz WEH Airport Jn', 
        area: 'Santacruz East',
        road: 'Western Express Highway / Nehru Road',
        lat: 19.0822, 
        lng: 72.8530, 
        pcu: 92, 
        vehicleCount: 82,
        breakdown: { cars: 48, bikes: 24, autos: 6, heavies: 4 },
        flowRatePerMin: 40,
        queueMeters: 55,
        status: 'optimal', 
        phase: 'EW', 
        timer: 30,
        speedKmph: 42
      },
      { 
        id: 'MUM-05', 
        code: 'BND-05', 
        name: 'Bandra Linking Road Crossing', 
        area: 'Bandra West',
        road: 'Linking Road / Waterfield Road',
        lat: 19.0588, 
        lng: 72.8335, 
        pcu: 145, 
        vehicleCount: 132,
        breakdown: { cars: 64, bikes: 48, autos: 16, heavies: 4 },
        flowRatePerMin: 50,
        queueMeters: 110,
        status: 'congested', 
        phase: 'NS', 
        timer: 15,
        speedKmph: 16
      },
      { 
        id: 'MUM-06', 
        code: 'AND-06', 
        name: 'Andheri WEH Flyover Node', 
        area: 'Andheri East',
        road: 'Western Express Highway / Andheri-Kurla Road',
        lat: 19.1197, 
        lng: 72.8564, 
        pcu: 185, 
        vehicleCount: 168,
        breakdown: { cars: 82, bikes: 56, autos: 20, heavies: 10 },
        flowRatePerMin: 68,
        queueMeters: 160,
        status: 'congested', 
        phase: 'EW', 
        timer: 10,
        speedKmph: 12
      },
      { 
        id: 'MUM-07', 
        code: 'SION-07', 
        name: 'Sion Circle Flyover Junction', 
        area: 'Sion / Central Mumbai',
        road: 'Eastern Express Highway / Sion-Bandra Link',
        lat: 19.0390, 
        lng: 72.8619, 
        pcu: 138, 
        vehicleCount: 124,
        breakdown: { cars: 58, bikes: 44, autos: 14, heavies: 8 },
        flowRatePerMin: 54,
        queueMeters: 95,
        status: 'moderate', 
        phase: 'NS', 
        timer: 22,
        speedKmph: 24
      },
      { 
        id: 'MUM-08', 
        code: 'LP-08', 
        name: 'Lower Parel Currey Road Crossing', 
        area: 'Lower Parel Financial District',
        road: 'Senapati Bapat Marg / NM Joshi Marg',
        lat: 19.0012, 
        lng: 72.8304, 
        pcu: 160, 
        vehicleCount: 142,
        breakdown: { cars: 70, bikes: 50, autos: 16, heavies: 6 },
        flowRatePerMin: 56,
        queueMeters: 130,
        status: 'congested', 
        phase: 'EW', 
        timer: 14,
        speedKmph: 15
      },
      { 
        id: 'MUM-09', 
        code: 'JUHU-09', 
        name: 'Juhu Circle Signal', 
        area: 'Juhu / Vile Parle',
        road: 'Juhu Tara Road / Gulmohar Road',
        lat: 19.1136, 
        lng: 72.8277, 
        pcu: 88, 
        vehicleCount: 80,
        breakdown: { cars: 46, bikes: 24, autos: 8, heavies: 2 },
        flowRatePerMin: 38,
        queueMeters: 48,
        status: 'optimal', 
        phase: 'NS', 
        timer: 28,
        speedKmph: 38
      },
      { 
        id: 'MUM-10', 
        code: 'POW-10', 
        name: 'Powai Hiranandani Main Gate', 
        area: 'Powai Lake Corridor',
        road: 'Jogeshwari-Vikhroli Link Road (JVLR) / Central Ave',
        lat: 19.1176, 
        lng: 72.9060, 
        pcu: 122, 
        vehicleCount: 108,
        breakdown: { cars: 60, bikes: 32, autos: 12, heavies: 4 },
        flowRatePerMin: 44,
        queueMeters: 75,
        status: 'moderate', 
        phase: 'EW', 
        timer: 20,
        speedKmph: 30
      }
    ],
    arterials: [
      { name: 'Worli - Dadar Arterial', origin: '19.0222,72.8166', dest: '19.0178,72.8478', freeFlowMin: 8, currentMin: 14, speedKmph: 22, vehicleLoad: 420, status: 'moderate' },
      { name: 'Dadar - BKC Connector', origin: '19.0178,72.8478', dest: '19.0664,72.8677', freeFlowMin: 12, currentMin: 28, speedKmph: 14, vehicleLoad: 890, status: 'congested' },
      { name: 'Western Express Highway (WEH)', origin: '19.0664,72.8677', dest: '19.0822,72.8530', freeFlowMin: 10, currentMin: 12, speedKmph: 42, vehicleLoad: 310, status: 'optimal' },
      { name: 'BKC - Kurla SCLR Link', origin: '19.0664,72.8677', dest: '19.0700,72.8800', freeFlowMin: 7, currentMin: 9, speedKmph: 36, vehicleLoad: 260, status: 'optimal' }
    ]
  },
  {
    id: 'pune',
    name: 'Pune Smart City',
    nameHi: 'पुणे स्मार्ट सिटी',
    center: { lat: 18.5314, lng: 73.8446 },
    zoom: 12,
    junctions: [
      { 
        id: 'PUN-01', 
        code: 'SHV-01', 
        name: 'Shivaji Nagar Square', 
        area: 'Shivaji Nagar',
        road: 'Old Mumbai-Pune Highway / JM Road',
        lat: 18.5308, 
        lng: 73.8475, 
        pcu: 135, 
        vehicleCount: 126,
        breakdown: { cars: 46, bikes: 62, autos: 12, heavies: 6 },
        flowRatePerMin: 52,
        queueMeters: 95,
        status: 'moderate', 
        phase: 'NS', 
        timer: 20,
        speedKmph: 22
      },
      { 
        id: 'PUN-02', 
        code: 'JHG-02', 
        name: 'Jehangir Hospital Junction', 
        area: 'Pune Railway Station Hub',
        road: 'Sasoon Road / Mangaldas Road',
        lat: 18.5285, 
        lng: 73.8742, 
        pcu: 188, 
        vehicleCount: 168,
        breakdown: { cars: 68, bikes: 76, autos: 16, heavies: 8 },
        flowRatePerMin: 68,
        queueMeters: 160,
        status: 'congested', 
        phase: 'EW', 
        timer: 15,
        speedKmph: 12
      },
      { 
        id: 'PUN-03', 
        code: 'FCR-03', 
        name: 'FC Road GoodLuck Chowk', 
        area: 'Deccan Gymkhana',
        road: 'Fergusson College Road / Ghole Road',
        lat: 18.5211, 
        lng: 73.8415, 
        pcu: 84, 
        vehicleCount: 78,
        breakdown: { cars: 26, bikes: 42, autos: 8, heavies: 2 },
        flowRatePerMin: 32,
        queueMeters: 40,
        status: 'optimal', 
        phase: 'NS', 
        timer: 25,
        speedKmph: 36
      },
      { 
        id: 'PUN-04', 
        code: 'SWG-04', 
        name: 'Swargate Multimodal Hub', 
        area: 'Swargate',
        road: 'Satara Road / Shivaji Road',
        lat: 18.5018, 
        lng: 73.8580, 
        pcu: 160, 
        vehicleCount: 144,
        breakdown: { cars: 52, bikes: 64, autos: 18, heavies: 10 },
        flowRatePerMin: 58,
        queueMeters: 130,
        status: 'congested', 
        phase: 'EW', 
        timer: 10,
        speedKmph: 15
      },
      { 
        id: 'PUN-05', 
        code: 'UNI-05', 
        name: 'Pune University Circle', 
        area: 'Ganeshkhind',
        road: 'Ganeshkhind Road / Aundh-Baner Link',
        lat: 18.5412, 
        lng: 73.8290, 
        pcu: 175, 
        vehicleCount: 158,
        breakdown: { cars: 62, bikes: 74, autos: 14, heavies: 8 },
        flowRatePerMin: 64,
        queueMeters: 150,
        status: 'congested', 
        phase: 'NS', 
        timer: 12,
        speedKmph: 14
      },
      { 
        id: 'PUN-06', 
        code: 'HNJ-06', 
        name: 'Hinjewadi Phase 1 Shivaji Chowk', 
        area: 'Hinjewadi IT Park',
        road: 'Hinjewadi Main Road / Wakad Bridge',
        lat: 18.5913, 
        lng: 73.7389, 
        pcu: 195, 
        vehicleCount: 180,
        breakdown: { cars: 85, bikes: 75, autos: 10, heavies: 10 },
        flowRatePerMin: 72,
        queueMeters: 180,
        status: 'congested', 
        phase: 'EW', 
        timer: 8,
        speedKmph: 10
      },
      { 
        id: 'PUN-07', 
        code: 'KTH-07', 
        name: 'Chandani Chowk Multi-Tier Jn', 
        area: 'Kothrud / Bavdhan',
        road: 'Mumbai-Bangalore Highway (NH48) / Paud Rd',
        lat: 18.5085, 
        lng: 73.7925, 
        pcu: 98, 
        vehicleCount: 88,
        breakdown: { cars: 42, bikes: 36, autos: 6, heavies: 4 },
        flowRatePerMin: 38,
        queueMeters: 50,
        status: 'optimal', 
        phase: 'NS', 
        timer: 28,
        speedKmph: 42
      }
    ],
    arterials: [
      { name: 'FC Road -> Shivaji Nagar', origin: '18.5211,73.8415', dest: '18.5308,73.8475', freeFlowMin: 6, currentMin: 11, speedKmph: 19, vehicleLoad: 380, status: 'moderate' },
      { name: 'Shivaji Nagar -> Jehangir Hub', origin: '18.5308,73.8475', dest: '18.5285,73.8742', freeFlowMin: 10, currentMin: 22, speedKmph: 12, vehicleLoad: 740, status: 'congested' },
      { name: 'Swargate -> Station Arterial', origin: '18.5018,73.8580', dest: '18.5285,73.8742', freeFlowMin: 14, currentMin: 18, speedKmph: 28, vehicleLoad: 520, status: 'moderate' }
    ]
  },
  {
    id: 'delhi',
    name: 'National Capital Region (Delhi)',
    nameHi: 'राष्ट्रीय राजधानी क्षेत्र (दिल्ली)',
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 12,
    junctions: [
      { 
        id: 'DEL-01', 
        code: 'CP-01', 
        name: 'Connaught Place Outer Circle', 
        area: 'Central Delhi',
        road: 'Barakhamba Road / Janpath Radial',
        lat: 28.6328, 
        lng: 77.2197, 
        pcu: 145, 
        vehicleCount: 132,
        breakdown: { cars: 82, bikes: 34, autos: 12, heavies: 4 },
        flowRatePerMin: 54,
        queueMeters: 110,
        status: 'moderate', 
        phase: 'NS', 
        timer: 22,
        speedKmph: 25
      },
      { 
        id: 'DEL-02', 
        code: 'ITO-02', 
        name: 'ITO Intersection Hub', 
        area: 'ITO / Vikas Marg',
        road: 'Bahadur Shah Zafar Marg / Vikas Marg',
        lat: 28.6297, 
        lng: 77.2410, 
        pcu: 195, 
        vehicleCount: 182,
        breakdown: { cars: 105, bikes: 52, autos: 15, heavies: 10 },
        flowRatePerMin: 72,
        queueMeters: 175,
        status: 'congested', 
        phase: 'EW', 
        timer: 14,
        speedKmph: 12
      },
      { 
        id: 'DEL-03', 
        code: 'AIM-03', 
        name: 'AIIMS Ring Road Flyover', 
        area: 'South Delhi',
        road: 'Ring Road / Sri Aurobindo Marg',
        lat: 28.5672, 
        lng: 77.2100, 
        pcu: 180, 
        vehicleCount: 165,
        breakdown: { cars: 98, bikes: 44, autos: 13, heavies: 10 },
        flowRatePerMin: 66,
        queueMeters: 150,
        status: 'congested', 
        phase: 'NS', 
        timer: 16,
        speedKmph: 15
      },
      { 
        id: 'DEL-04', 
        code: 'DLG-04', 
        name: 'India Gate C-Hexagon', 
        area: 'Kartavya Path',
        road: 'Rajpath / Ashoka Road',
        lat: 28.6129, 
        lng: 77.2295, 
        pcu: 78, 
        vehicleCount: 72,
        breakdown: { cars: 48, bikes: 18, autos: 4, heavies: 2 },
        flowRatePerMin: 30,
        queueMeters: 35,
        status: 'optimal', 
        phase: 'EW', 
        timer: 28,
        speedKmph: 45
      },
      { 
        id: 'DEL-05', 
        code: 'ASH-05', 
        name: 'Ashram Chowk Underpass Jn', 
        area: 'Ashram / Ring Road',
        road: 'Ring Road / Mathura Road',
        lat: 28.5710, 
        lng: 77.2590, 
        pcu: 190, 
        vehicleCount: 175,
        breakdown: { cars: 102, bikes: 48, autos: 15, heavies: 10 },
        flowRatePerMin: 70,
        queueMeters: 170,
        status: 'congested', 
        phase: 'NS', 
        timer: 10,
        speedKmph: 14
      },
      { 
        id: 'DEL-06', 
        code: 'DHK-06', 
        name: 'Dhaula Kuan Multimodal Node', 
        area: 'Dhaula Kuan',
        road: 'Ring Road / NH-48 Airport Expressway',
        lat: 28.5921, 
        lng: 77.1610, 
        pcu: 92, 
        vehicleCount: 84,
        breakdown: { cars: 52, bikes: 22, autos: 6, heavies: 4 },
        flowRatePerMin: 38,
        queueMeters: 45,
        status: 'optimal', 
        phase: 'EW', 
        timer: 32,
        speedKmph: 48
      }
    ],
    arterials: [
      { name: 'CP Radial -> ITO Junction', origin: '28.6328,77.2197', dest: '28.6297,77.2410', freeFlowMin: 9, currentMin: 21, speedKmph: 15, vehicleLoad: 810, status: 'congested' },
      { name: 'Barakhamba -> India Gate', origin: '28.6328,77.2197', dest: '28.6129,77.2295', freeFlowMin: 7, currentMin: 9, speedKmph: 35, vehicleLoad: 320, status: 'optimal' },
      { name: 'Ring Road: AIIMS -> Ashram', origin: '28.5672,77.2100', dest: '28.5710,77.2590', freeFlowMin: 11, currentMin: 26, speedKmph: 16, vehicleLoad: 920, status: 'congested' }
    ]
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru Tech Capital',
    nameHi: 'बेंगलुरु टेक कैपिटल',
    center: { lat: 12.9172, lng: 77.6228 },
    zoom: 12,
    junctions: [
      { 
        id: 'BLR-01', 
        code: 'SLK-01', 
        name: 'Central Silk Board Junction', 
        area: 'Silk Board / BTM',
        road: 'Hosur Road / Outer Ring Road (ORR)',
        lat: 12.9177, 
        lng: 77.6238, 
        pcu: 240, 
        vehicleCount: 228,
        breakdown: { cars: 115, bikes: 88, autos: 15, heavies: 10 },
        flowRatePerMin: 85,
        queueMeters: 220,
        status: 'congested', 
        phase: 'EW', 
        timer: 10,
        speedKmph: 8
      },
      { 
        id: 'BLR-02', 
        code: 'HSR-02', 
        name: 'HSR Layout 27th Main Signal', 
        area: 'HSR Sector 1',
        road: 'Outer Ring Road / 27th Main Rd',
        lat: 12.9116, 
        lng: 77.6389, 
        pcu: 130, 
        vehicleCount: 118,
        breakdown: { cars: 62, bikes: 42, autos: 10, heavies: 4 },
        flowRatePerMin: 48,
        queueMeters: 85,
        status: 'moderate', 
        phase: 'NS', 
        timer: 20,
        speedKmph: 24
      },
      { 
        id: 'BLR-03', 
        code: 'ECI-03', 
        name: 'Electronic City Toll Plaza', 
        area: 'Electronic City Phase 1',
        road: 'Hosur Elevated Tollway / Neeladri Rd',
        lat: 12.8452, 
        lng: 77.6602, 
        pcu: 95, 
        vehicleCount: 88,
        breakdown: { cars: 55, bikes: 22, autos: 5, heavies: 6 },
        flowRatePerMin: 38,
        queueMeters: 45,
        status: 'optimal', 
        phase: 'NS', 
        timer: 32,
        speedKmph: 44
      },
      { 
        id: 'BLR-04', 
        code: 'MRH-04', 
        name: 'Marathahalli ORR Bridge', 
        area: 'Marathahalli',
        road: 'Outer Ring Road / Old Airport Road',
        lat: 12.9591, 
        lng: 77.6974, 
        pcu: 210, 
        vehicleCount: 195,
        breakdown: { cars: 98, bikes: 74, autos: 13, heavies: 10 },
        flowRatePerMin: 76,
        queueMeters: 190,
        status: 'congested', 
        phase: 'EW', 
        timer: 12,
        speedKmph: 11
      },
      { 
        id: 'BLR-05', 
        code: 'HEB-05', 
        name: 'Hebbal Flyover Airport Expressway', 
        area: 'Hebbal',
        road: 'Bellary Road / Outer Ring Road',
        lat: 13.0358, 
        lng: 77.5970, 
        pcu: 175, 
        vehicleCount: 160,
        breakdown: { cars: 90, bikes: 52, autos: 10, heavies: 8 },
        flowRatePerMin: 62,
        queueMeters: 140,
        status: 'congested', 
        phase: 'NS', 
        timer: 15,
        speedKmph: 18
      },
      { 
        id: 'BLR-06', 
        code: 'KOR-06', 
        name: 'Sony World Junction Koramangala', 
        area: 'Koramangala 4th Block',
        road: '100 Feet Road / 80 Feet Road',
        lat: 12.9345, 
        lng: 77.6266, 
        pcu: 125, 
        vehicleCount: 115,
        breakdown: { cars: 58, bikes: 42, autos: 12, heavies: 3 },
        flowRatePerMin: 45,
        queueMeters: 80,
        status: 'moderate', 
        phase: 'EW', 
        timer: 22,
        speedKmph: 22
      }
    ],
    arterials: [
      { name: 'Silk Board -> HSR BDA Complex', origin: '12.9177,77.6238', dest: '12.9116,77.6389', freeFlowMin: 8, currentMin: 24, speedKmph: 11, vehicleLoad: 950, status: 'congested' },
      { name: 'Silk Board -> Electronic City Flyover', origin: '12.9177,77.6238', dest: '12.8452,77.6602', freeFlowMin: 14, currentMin: 18, speedKmph: 44, vehicleLoad: 410, status: 'optimal' },
      { name: 'HSR Layout -> Marathahalli ORR', origin: '12.9116,77.6389', dest: '12.9591,77.6974', freeFlowMin: 15, currentMin: 36, speedKmph: 13, vehicleLoad: 1100, status: 'congested' }
    ]
  }
];

export const getStoredApiKey = () => {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage && fromStorage.trim().length > 5) return fromStorage.trim();
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || DEFAULT_FALLBACK_KEY;
};

export const setStoredApiKey = (key) => {
  try {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};

let googleMapsScriptPromise = null;

export const loadGoogleMapsScript = (apiKey) => {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const key = apiKey || getStoredApiKey();
    if (!key) {
      return reject(new Error('NO_API_KEY'));
    }

    const scriptId = 'google-maps-sdk-script';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const callbackName = `__initGoogleMaps_${Date.now()}`;
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places,geometry,visualization&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      googleMapsScriptPromise = null;
      reject(new Error('FAILED_TO_LOAD_SCRIPT'));
    };

    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
};

export const GOV_DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1B263B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A1F44' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#E2E8F0' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#F5A623' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94A3B8' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2C3E50' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1E293B' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#D97706' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1E3A8A' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0F172A' }]
  }
];
