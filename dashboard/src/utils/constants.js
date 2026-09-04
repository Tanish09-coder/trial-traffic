export const TRAFFIC_CONSTANTS = {
  MIN_SIGNAL_TIME: 10,
  MAX_SIGNAL_TIME: 60,
  BASE_TIME_PER_CAR: 2.0,
  POLL_INTERVAL: 1000,
  FUEL_CONSUMPTION_RATE: 0.00028, // L/sec delay reduction
  CO2_FACTOR: 2.31, // kg CO2 per liter of gasoline
  FUEL_COST: 105, // INR/L
  COMMUTER_TIME_VALUE_PER_HOUR: 200, // INR/hour commuter time valuation
  TRADITIONAL_WAIT_TIME: 45.0, // seconds baseline fixed plan delay
  EMERGENCY_TYPES: {
    AMBULANCE: { priority: 3, spawnRate: 0.0008 },
    FIRE: { priority: 2, spawnRate: 0.0004 },
    POLICE: { priority: 1, spawnRate: 0.0003 }
  },
  DIRECTIONS: ['N', 'S', 'E', 'W'],
  LANE_WEIGHTS: { N: 0.3, S: 0.25, E: 0.25, W: 0.2 },

  // Prototype PCU conversion weights (configurable parameters)
  PCU_WEIGHTS: {
    car: 1.0,
    bike: 0.5,
    bus: 2.5,
    truck: 2.5,
    emergency: 1.0
  },

  // Weather-Adaptive Clearance Configuration (Prototype tuning assumptions)
  WEATHER_POLICY: {
    DEFAULT_MODE: 'normal',
    MODES: ['normal', 'rain', 'fog'],
    MULTIPLIERS: {
      normal: 1.0,
      rain: 1.2,
      fog: 1.4
    },
    NOMINAL_YELLOW_SEC: 3.0,
    NOMINAL_ALL_RED_SEC: 1.0,
    CLEARANCE_BOUNDS: {
      yellow: { min: 3.0, max: 4.2 },
      allRed: { min: 1.0, max: 1.4 }
    }
  },

  // Generated Demand Policy
  DEMAND_POLICY: {
    DEFAULT_GENERATED_DEMAND_MULTIPLIER: 0.5,
    OPTIONS: [
      { value: 0.5, label: 'Moderate 0.5×' },
      { value: 1.0, label: 'Peak Time 1.0×' }
    ]
  },

  // Prototype Signal Optimization Policy
  SIGNAL_POLICY: {
    MIN_GREEN: 10,
    MAX_GREEN: 60,
    MAX_CONTINUOUS_GREEN: 60,
    BASE_GREEN: 10,
    SECONDS_PER_PCU: 1.0,
    ADAPTIVE_SECONDS_PER_PCU: 1.0,
    SWITCH_MARGIN_PCU: 3.0,
    STARVATION_THRESHOLD_SEC: 45,
    STARVATION_BOOST_PER_SEC: 0.5,
    MAX_RED_WAIT_SEC: 60,
    YELLOW_DURATION_SEC: 3,
    ALL_RED_DURATION_SEC: 1,
    FIXED_DURATIONS: { N: 45, S: 45, E: 45, W: 45 }
  }
};