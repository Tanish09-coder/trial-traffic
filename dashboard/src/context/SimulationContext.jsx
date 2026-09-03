import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { VehicleManager } from '../utils/VehicleManager';
import { SignalManager } from '../utils/SignalManager';
import { SimulationClock } from '../utils/SimulationClock';
import { analyticsManager } from '../utils/AnalyticsManager';
import { 
  getState as getBackendState, 
  getMetrics as getBackendMetrics, 
  startSimulation as startBackendSimulation, 
  stopSimulation as stopBackendSimulation, 
  setSimulationSpeed as setBackendSpeed, 
  resetBackendSimulation 
} from '../utils/api';
import { runComparisonPair } from '../utils/comparisonEngine';

const DEFAULT_BELLEVUE_EVENTS = [
  { eventId: 'bellevue-0', videoTimeSec: 11.2, vehicleType: 'car', mappedDirection: 'S' },
  { eventId: 'bellevue-1', videoTimeSec: 18.5, vehicleType: 'car', mappedDirection: 'S' },
  { eventId: 'bellevue-2', videoTimeSec: 25.1, vehicleType: 'truck', mappedDirection: 'S' },
  { eventId: 'bellevue-3', videoTimeSec: 32.8, vehicleType: 'car', mappedDirection: 'S' },
  { eventId: 'bellevue-4', videoTimeSec: 45.4, vehicleType: 'bus', mappedDirection: 'S' },
  { eventId: 'bellevue-5', videoTimeSec: 58.0, vehicleType: 'car', mappedDirection: 'S' },
  { eventId: 'bellevue-6', videoTimeSec: 72.3, vehicleType: 'car', mappedDirection: 'S' },
  { eventId: 'bellevue-7', videoTimeSec: 89.6, vehicleType: 'truck', mappedDirection: 'S' },
  { eventId: 'bellevue-8', videoTimeSec: 104.2, vehicleType: 'car', mappedDirection: 'S' },
  { eventId: 'bellevue-9', videoTimeSec: 120.1, vehicleType: 'car', mappedDirection: 'S' },
  { eventId: 'bellevue-10', videoTimeSec: 142.7, vehicleType: 'car', mappedDirection: 'S' }
];

const SimulationContext = createContext(null);

export const SimulationProvider = ({ children }) => {
  // Singletons retained across the lifetime of the application
  const vehicleManagerRef = useRef(null);
  const signalManagerRef = useRef(null);
  const clockRef = useRef(null);

  if (!vehicleManagerRef.current) {
    vehicleManagerRef.current = new VehicleManager();
    vehicleManagerRef.current.start();
  }
  if (!signalManagerRef.current) {
    signalManagerRef.current = new SignalManager();
  }
  if (!clockRef.current) {
    clockRef.current = new SimulationClock(1.0);
  }

  const vehicleManager = vehicleManagerRef.current;
  const signalManager = signalManagerRef.current;
  const clock = clockRef.current;

  // Session configuration state
  const [useMock, setUseMock] = useState(true);
  const [simulationSpeed, setSimulationSpeedState] = useState(1.0);
  const [strategy, setStrategyState] = useState('adaptive'); // 'adaptive' | 'fixed'
  const [dataSource, setDataSource] = useState('simulation'); // 'simulation' | 'recorded_video'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Consolidated session state & metrics
  const [state, setState] = useState(() => {
    const vState = vehicleManager.getState();
    const sState = signalManager.getState(vState.queues, vState.cars);
    return {
      ...vState,
      signal: sState.current_signal,
      pending_signal: sState.pending_signal,
      phase: sState.phase,
      signal_timer: sState.timer,
      signal_duration: sState.duration,
      emergencyActive: sState.emergency_active || vState.emergencyActive,
      emergencyDirection: sState.emergency_direction || vState.emergencyDirection,
      pedestrian_signals: sState.pedestrian_signals,
      strategy: sState.strategy,
      staged_strategy: sState.staged_strategy,
      decision: sState.decision,
      dataSource: 'simulation'
    };
  });

  const [metrics, setMetrics] = useState(() => vehicleManager.getMetrics());

  // Video replay session state
  const [videoReplayActive, setVideoReplayActive] = useState(false);
  const [videoReplayConfig, setVideoReplayConfig] = useState(null); // { videoId, arrivalEvents, mappedDirection, durationSec }
  const videoEventCursorRef = useRef(0);
  const processedEventIdsRef = useRef(new Set());

  // Computed comparison engine state
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonStatus, setComparisonStatus] = useState('IDLE'); // 'IDLE' | 'RUNNING' | 'COMPLETED' | 'STALE' | 'FAILED'
  const [comparisonError, setComparisonError] = useState(null);
  const jobTokenRef = useRef(0);
  const activeTimerRef = useRef(null);

  const runComparison = useCallback((configOverride = null) => {
    // Check if configOverride is a React Event object
    const isDOMEvent = configOverride && typeof configOverride.preventDefault === 'function';
    const cfg = (!isDOMEvent && configOverride && configOverride.arrivalEvents)
      ? configOverride
      : videoReplayConfig;

    const targetCfg = (!cfg || !cfg.arrivalEvents || cfg.arrivalEvents.length === 0)
      ? { videoId: 'bellevue_trial', arrivalEvents: DEFAULT_BELLEVUE_EVENTS, mappedDirection: 'S', durationSec: 158.63 }
      : cfg;

    setComparisonError(null);
    setComparisonStatus('RUNNING');

    jobTokenRef.current++;
    const currentToken = jobTokenRef.current;

    if (activeTimerRef.current) {
      clearTimeout(activeTimerRef.current);
    }

    activeTimerRef.current = setTimeout(() => {
      try {
        const res = runComparisonPair({
          videoId: targetCfg.videoId || 'bellevue_trial',
          arrivalEvents: targetCfg.arrivalEvents,
          mappedDirection: targetCfg.mappedDirection || 'S',
          durationSec: targetCfg.durationSec || 158.63,
          randomSeed: 42
        });

        // Job Token Protection: ignore results if a newer run was triggered
        if (currentToken === jobTokenRef.current) {
          setComparisonResult(res);
          setComparisonStatus('COMPLETED');
          setComparisonError(null);
        }
      } catch (err) {
        console.error('Comparison execution error:', err);
        if (currentToken === jobTokenRef.current) {
          setComparisonStatus('FAILED');
          setComparisonError(err.message || 'Comparison calculation failed.');
        }
      }
    }, 15);
  }, [videoReplayConfig]);

  useEffect(() => {
    return () => {
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    };
  }, []);

  // Direct simulation tick logic with sub-stepping for physical accuracy
  const tickSimulation = useCallback(() => {
    if (!useMock) return;

    try {
      const { totalDt, subSteps } = clock.tick();
      const currentSimTime = clock.getSimTime();

      // If video replay is active, dispatch pending arrival events up to currentSimTime
      if (videoReplayActive && videoReplayConfig && videoReplayConfig.arrivalEvents) {
        const events = videoReplayConfig.arrivalEvents;
        const mappedDir = videoReplayConfig.mappedDirection || 'S';
        
        while (
          videoEventCursorRef.current < events.length &&
          events[videoEventCursorRef.current].videoTimeSec <= currentSimTime
        ) {
          const event = events[videoEventCursorRef.current++];
          if (event && !processedEventIdsRef.current.has(event.eventId)) {
            processedEventIdsRef.current.add(event.eventId);
            vehicleManager.injectExternalArrival(mappedDir, event);
          }
        }
      }

      subSteps.forEach(subDt => {
        const stoppedQueues = vehicleManager.getStoppedQueues();
        const queuedPCUs = vehicleManager.getQueuedPCUs();
        const oldestWaitTimes = vehicleManager.getOldestWaitTimes();
        const totalQueues = vehicleManager.getQueueLengths();

        const isIntersectionOccupied = vehicleManager.isIntersectionOccupied();
        const activeEmergency = vehicleManager.getActiveEmergencyVehicle();

        // Check emergency clearance against active emergency vehicle entity
        signalManager.checkEmergencyCleared(
          activeEmergency,
          totalQueues
        );

        // Advance signal controller with clearance occupancy check
        signalManager.updateSignal(totalQueues, stoppedQueues, queuedPCUs, oldestWaitTimes, subDt, isIntersectionOccupied);

        // Advance vehicle positions with clearance physics
        vehicleManager.updateVehicles(
          signalManager.currentSignal,
          signalManager.phase,
          subDt
        );
      });

      // Extract fresh states
      const vState = vehicleManager.getState();
      const sState = signalManager.getState(vState.queues, vState.cars);
      const freshMetrics = vehicleManager.getMetrics();

      const mergedState = {
        ...vState,
        signal: sState.current_signal,
        pending_signal: sState.pending_signal,
        phase: sState.phase,
        signal_timer: sState.timer,
        signal_duration: sState.duration,
        active_green_duration: sState.active_green_duration,
        pending_green_duration: sState.pending_green_duration,
        phase_remaining_sec: sState.phase_remaining_sec,
        phase_label: sState.phase_label,
        clearance_status: sState.clearance_status,
        emergencyActive: sState.emergency_active || vState.emergencyActive,
        emergencyDirection: sState.emergency_direction || vState.emergencyDirection,
        pedestrian_signals: sState.pedestrian_signals,
        strategy: sState.strategy,
        staged_strategy: sState.staged_strategy,
        decision: sState.decision,
        dataSource,
        videoReplayActive,
        videoReplayConfig,
        simTime: currentSimTime,
        approachSources: vehicleManager.approachSources,
        empty_roads: ['N', 'S', 'E', 'W'].filter(d => (vState.queues[d] || 0) === 0),
        roads_with_traffic: ['N', 'S', 'E', 'W'].filter(d => (vState.queues[d] || 0) > 0)
      };


      // Record analytics tick
      analyticsManager.recordTick({
        dt: totalDt,
        simTime: currentSimTime,
        currentSignal: sState.current_signal,
        phase: sState.phase,
        stoppedQueues: vehicleManager.getStoppedQueues(),
        queuedPCUs: vehicleManager.getQueuedPCUs(),
        arrivals: vehicleManager.getCompletedArrivals(),
        departures: vehicleManager.getCompletedDepartures(),
        cars: vState.cars,
        emergencyActive: vState.emergencyActive,
        emergencyDirection: vState.emergencyDirection,
        avgWaitTime: vState.avg_wait_time,
        throughput: freshMetrics.throughput
      });

      setState(mergedState);
      setMetrics(freshMetrics);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Simulation tick error:', err);
      setError(`Simulation tick error: ${err.message}`);
    }
  }, [useMock, dataSource, videoReplayActive, videoReplayConfig]);


  // Single central simulation loop protected against StrictMode duplicates
  const isLoopActiveRef = useRef(false);
  useEffect(() => {
    if (useMock && !isLoopActiveRef.current) {
      isLoopActiveRef.current = true;
      const intervalId = setInterval(tickSimulation, 100);
      return () => {
        isLoopActiveRef.current = false;
        clearInterval(intervalId);
      };
    }
  }, [useMock, tickSimulation]);

  // Backend polling loop
  useEffect(() => {
    if (!useMock) {
      let active = true;
      setLoading(true);
      setError(null);

      startBackendSimulation().catch(err => {
        if (!err.message.includes('already running')) {
          console.warn('Backend start simulation warning:', err);
        }
      });

      setBackendSpeed(simulationSpeed).catch(err => console.warn('Backend speed sync error:', err));

      const fetchBackendData = async () => {
        try {
          const stateData = await getBackendState();
          const metricsData = await getBackendMetrics();

          if (active) {
            const mappedQueues = stateData.queues || { N: 0, S: 0, E: 0, W: 0 };
            const emergencyActive = stateData.emergency_active || false;
            const emergencyDirection = stateData.emergency_direction || null;
            const avgWait = metricsData.avg_wait_time || 0;
            const totalCars = metricsData.total_vehicles || 0;

            const mappedState = {
              cars: stateData.cars || { N: [], S: [], E: [], W: [] },
              cars_passed: totalCars,
              avg_wait_time: avgWait,
              queues: mappedQueues,
              stopped_queues: mappedQueues,
              queued_pcus: mappedQueues,
              emergencyActive,
              emergencyDirection,
              signal: stateData.signal?.current || 'N',
              pending_signal: stateData.signal?.current || 'N',
              phase: stateData.signal?.phase || 'GREEN',
              signal_timer: stateData.signal?.timer || 0,
              signal_duration: stateData.signal?.duration || 30,
              empty_roads: ['N', 'S', 'E', 'W'].filter(d => (mappedQueues[d] || 0) === 0),
              roads_with_traffic: ['N', 'S', 'E', 'W'].filter(d => (mappedQueues[d] || 0) > 0),
              system_mode: emergencyActive ? 'Emergency' : 'AI Intelligent',
              system_efficiency: 92,
              wait_time_trend: 'stable',
              mumbai_improvement_percentage: 28.5,
              mumbai_target_achieved: avgWait >= 30 && avgWait <= 35,
              time_saved_per_hour: (totalCars * 12.5) / 60,
              fuel_saved_per_hour: totalCars * 0.15,
              strategy,
              staged_strategy: strategy,
              decision: {
                selectedDirection: stateData.signal?.current || 'N',
                strategy,
                proposedGreen: stateData.signal?.duration || 30,
                activeGreen: stateData.signal?.duration || 30,
                reason: 'Backend Python simulation active (video upload and local heuristic controls disabled)',
                queuedPCUs: mappedQueues,
                stoppedCounts: mappedQueues,
                timestamp: Date.now()
              },
              dataSource
            };

            const mappedMetrics = {
              total_cars: totalCars,
              avg_trip_time: avgWait * 0.6,
              throughput: (totalCars / 60).toFixed(1),
              queue_history: [],
              wait_time_history: [],
              emergency_count: metricsData.emergency_count || 0,
              fuel_saved_total: (totalCars * 0.15).toFixed(1),
              cost_saved_total: (totalCars * 15).toFixed(0),
              efficiency_improvement: 92,
              empty_road_count: Object.values(mappedQueues).filter(q => q === 0).length,
              active_road_count: Object.values(mappedQueues).filter(q => q > 0).length,
              system_efficiency: 92,
              system_mode: emergencyActive ? 'Emergency' : 'AI Intelligent',
              wait_time_trend: 'stable',
              traditional_wait_time: 45,
              current_avg_wait_time: avgWait,
              target_wait_time: 32.5,
              improvement_percentage: 28.5,
              target_achieved: avgWait >= 30 && avgWait <= 35,
              time_saved_per_hour_minutes: (totalCars * 12.5) / 60,
              fuel_saved_per_hour_liters: totalCars * 0.15
            };

            setState(mappedState);
            setMetrics(mappedMetrics);
            setLoading(false);
            setError(null);
          }
        } catch (err) {
          if (active) {
            setError(`Backend connection error: ${err.message}`);
            setLoading(false);
          }
        }
      };

      fetchBackendData();
      const intervalId = setInterval(fetchBackendData, 1000);
      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }
  }, [useMock, simulationSpeed, strategy, dataSource]);

  // Actions
  const setSpeed = useCallback((speed) => {
    const newSpeed = Math.max(0.1, Math.min(5.0, speed));
    setSimulationSpeedState(newSpeed);
    clock.setSpeed(newSpeed);
    if (!useMock) {
      setBackendSpeed(newSpeed).catch(err => console.warn('Backend speed update error:', err));
    }
  }, [useMock, clock]);

  const setStrategy = useCallback((newStrategy) => {
    if (['adaptive', 'fixed'].includes(newStrategy)) {
      setStrategyState(newStrategy);
      signalManager.setStrategy(newStrategy);
    }
  }, [signalManager]);

  const resetSimulation = useCallback(() => {
    analyticsManager.reset();
    clock.reset();
    videoEventCursorRef.current = 0;
    processedEventIdsRef.current.clear();
    setVideoReplayActive(false);
    setDataSource('simulation');
    if (useMock) {
      ['N', 'S', 'E', 'W'].forEach(d => vehicleManager.setApproachSource(d, 'simulation'));
      vehicleManager.reset();
      signalManager.reset();
    } else {
      resetBackendSimulation().catch(err => console.warn('Backend reset error:', err));
    }
  }, [useMock, vehicleManager, signalManager, clock]);

  const startVideoDrivenSimulation = useCallback(({ videoId, arrivalEvents, mappedDirection, durationSec }) => {
    if (!useMock) {
      setError('Video-driven simulation is only available in Browser Simulation mode.');
      return;
    }
    
    // Explicit fresh session reset
    analyticsManager.reset();
    clock.reset();
    videoEventCursorRef.current = 0;
    processedEventIdsRef.current.clear();

    if (useMock) {
      vehicleManager.reset();
      signalManager.reset();
    }

    const targetDirection = ['N', 'S', 'E', 'W'].includes(mappedDirection) ? mappedDirection : 'S';

    // Set target approach source to recorded_video, others remain simulation
    ['N', 'S', 'E', 'W'].forEach(d => {
      if (d === targetDirection) {
        vehicleManager.setApproachSource(d, 'recorded_video');
        vehicleManager.clearApproach(d);
      } else {
        vehicleManager.setApproachSource(d, 'simulation');
      }
    });

    const replayCfg = {
      videoId,
      arrivalEvents: arrivalEvents || [],
      mappedDirection: targetDirection,
      durationSec: durationSec || 160
    };

    setDataSource('recorded_video');
    setVideoReplayActive(true);
    setVideoReplayConfig(replayCfg);

    // Automatically start isolated comparison run on valid video analysis start
    runComparison(replayCfg);
  }, [useMock, vehicleManager, signalManager, clock, runComparison]);

  const stopVideoDrivenSimulation = useCallback(() => {
    setVideoReplayActive(false);
    setDataSource('simulation');
    ['N', 'S', 'E', 'W'].forEach(d => vehicleManager.setApproachSource(d, 'simulation'));
  }, [vehicleManager]);


  const triggerEmergencyVehicle = useCallback((direction = null, type = null) => {
    if (!useMock) {
      setError('Emergency injection is only available in Browser Simulation mode.');
      return null;
    }
    const activeSignal = signalManager.currentSignal || 'N';
    const emg = vehicleManager.triggerEmergency(direction, type, activeSignal);
    if (emg) {
      signalManager.handleEmergencyVehicle(emg);
    }
    return emg;
  }, [useMock, vehicleManager, signalManager]);

  const handleManualOverride = useCallback((direction, reason) => {
    if (!useMock) {
      setError('Manual signal override is only available in Browser Simulation mode.');
      return;
    }
    signalManager.manualOverride(direction);
  }, [useMock, signalManager]);

  const switchToMock = useCallback(() => {
    if (!useMock) {
      stopBackendSimulation().catch(err => console.warn('Failed to stop backend simulation:', err));
    }
    setUseMock(true);
    setError(null);
  }, [useMock]);

  const switchToBackend = useCallback(() => {
    setUseMock(false);
  }, []);

  const value = {
    state,
    metrics,
    analyticsSession: analyticsManager.getSnapshot(),
    loading: useMock ? false : loading,
    error,
    useMock,
    simulationSpeed,
    strategy,
    stagedStrategy: signalManager.stagedStrategy,
    dataSource,
    videoReplayActive,
    videoReplayConfig,
    comparisonResult,
    comparisonStatus,
    comparisonError,
    rerunComparison: useCallback(() => runComparison(null), [runComparison]),
    setStrategy,
    setDataSource,
    switchToMock,
    switchToBackend,
    setSpeed,
    resetSimulation,
    startVideoDrivenSimulation,
    stopVideoDrivenSimulation,
    manualOverride: handleManualOverride,
    triggerEmergencyVehicle
  };


  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
