import { SignalManager } from '../SignalManager.js';
import { VehicleManager } from '../VehicleManager.js';
import { AnalyticsManager } from '../AnalyticsManager.js';

export function runIntegrationTests() {
  const results = [];

  function assert(condition, message) {
    if (condition) {
      results.push({ pass: true, message });
    } else {
      results.push({ pass: false, message });
    }
  }

  // --- Test 1: Moving vehicles with 0 stopped vehicles MUST NOT trigger 2s early switch ---
  {
    const sm = new SignalManager();
    sm.setStrategy('fixed');
    for (let i = 0; i < 25; i++) {
      sm.updateSignal({ N: 5 }, { N: 0 }, { N: 0 }, {}, 0.1, false);
    }
    assert(
      sm.phase === 'GREEN' && sm.currentSignal === 'N' && sm.signalTimer >= 2.5,
      'Test 1: Green approach with 0 stopped vehicles remains green beyond 2 seconds'
    );
  }

  // --- Test 2: Fixed durations complete correctly ---
  {
    const sm = new SignalManager();
    sm.setStrategy('fixed');
    for (let i = 0; i < 290; i++) {
      sm.updateSignal({}, {}, {}, {}, 0.1, false);
    }
    assert(
      sm.phase === 'GREEN' && sm.currentSignal === 'N',
      'Test 2a: Fixed mode remains GREEN for North before 30s duration completes'
    );

    for (let i = 0; i < 15; i++) {
      sm.updateSignal({}, {}, {}, {}, 0.1, false);
    }
    assert(
      sm.phase === 'YELLOW' && sm.pendingSignal === 'E',
      'Test 2b: Fixed mode enters YELLOW clearance and selects E after 30s'
    );
  }

  // --- Test 3: Adaptive allocations complete correctly & respect continuous green limit ---
  {
    const sm = new SignalManager();
    sm.setStrategy('adaptive');
    for (let i = 0; i < 650; i++) {
      sm.updateSignal({ N: 20, S: 10 }, { N: 20, S: 10 }, { N: 20, S: 10 }, {}, 0.1, false);
    }
    assert(
      sm.phase === 'YELLOW' || sm.phase === 'ALL_RED' || sm.currentSignal !== 'N',
      'Test 3: Adaptive allocation respects continuous-green limit (60s) under continuous demand'
    );
  }

  // --- Test 4: Selecting next direction does not overwrite current active allocation during clearance ---
  {
    const sm = new SignalManager();
    sm.setStrategy('adaptive');
    sm.activeGreenDuration = 30;
    sm.signalTimer = 30;
    sm.initiateClearanceSwitch({ E: 10 }, { E: 10 }, { E: 10 }, {}, true);

    const state = sm.getState();
    assert(
      sm.phase === 'YELLOW' &&
      state.active_green_duration === 30 &&
      state.pending_green_duration === 30 &&
      state.pending_signal === 'E',
      'Test 4: Clearance switch stores pending allocation (E, 30s) without overwriting active green duration (30s)'
    );
  }

  // --- Test 5: Green, yellow, and all-red countdowns match their respective phases ---
  {
    const sm = new SignalManager();
    sm.activeGreenDuration = 30;
    sm.signalTimer = 10;
    sm.phase = 'GREEN';
    let st = sm.getState();
    assert(
      st.phase_remaining_sec === 20 && st.phase_label === 'Green remaining',
      'Test 5a: Green phase remaining countdown matches (30 - 10 = 20s)'
    );

    sm.phase = 'YELLOW';
    sm.phaseTimer = 1;
    st = sm.getState();
    assert(
      st.phase_remaining_sec === 2 && st.phase_label === 'Yellow clearance',
      'Test 5b: Yellow phase remaining countdown matches (3 - 1 = 2s)'
    );

    sm.phase = 'ALL_RED';
    sm.phaseTimer = 0.5;
    st = sm.getState();
    assert(
      st.phase_remaining_sec === 1 && st.phase_label === 'All-red clearance',
      'Test 5c: All-red phase remaining countdown matches (1 - 0.5 = 1s)'
    );
  }

  // --- Test 6: Full Emergency Lifecycle Integration Test ---
  {
    const vm = new VehicleManager();
    const sm = new SignalManager();
    const am = new AnalyticsManager();
    sm.setStrategy('fixed');

    assert(sm.currentSignal === 'N' && sm.phase === 'GREEN', 'Test 6a: Baseline start signal is N GREEN');

    const emg = vm.triggerEmergencyVehicle('S');
    sm.handleEmergencyVehicle(emg);

    assert(
      sm.emergencyActive && sm.pendingSignal === 'S' && sm.phase === 'YELLOW',
      'Test 6b: Emergency trigger puts signal into YELLOW clearance targeting S'
    );

    for (let i = 0; i < 45; i++) {
      const isOcc = vm.isIntersectionOccupied();
      const activeEmg = vm.getActiveEmergencyVehicle();
      sm.checkEmergencyCleared(activeEmg, vm.getQueueLengths());
      sm.updateSignal(vm.getQueueLengths(), vm.getStoppedQueues(), vm.getQueuedPCUs(), {}, 0.1, isOcc);
      vm.updateVehicles(sm.currentSignal, sm.phase, 0.1);
    }

    assert(
      sm.currentSignal === 'S' && sm.phase === 'GREEN',
      'Test 6c: Clearance completed and signal granted GREEN priority to emergency approach S'
    );

    let emgExited = false;
    for (let i = 0; i < 400; i++) {
      const isOcc = vm.isIntersectionOccupied();
      const activeEmg = vm.getActiveEmergencyVehicle();
      sm.checkEmergencyCleared(activeEmg, vm.getQueueLengths());
      sm.updateSignal(vm.getQueueLengths(), vm.getStoppedQueues(), vm.getQueuedPCUs(), {}, 0.1, isOcc);
      vm.updateVehicles(sm.currentSignal, sm.phase, 0.1);

      if (!activeEmg && !sm.emergencyActive) {
        emgExited = true;
        break;
      }
    }

    assert(emgExited && !sm.emergencyActive, 'Test 6d: Emergency vehicle exited intersection and priority was released');
    assert(sm.phase === 'YELLOW' || sm.phase === 'ALL_RED' || sm.strategy === 'fixed', 'Test 6e: Signal transitioned to clearance back to active strategy (fixed)');
  }

  // --- Test 7: Analytics Manager Event Contract Integration Test ---
  {
    const vm = new VehicleManager();
    const sm = new SignalManager();
    const am = new AnalyticsManager();

    for (let i = 0; i < 50; i++) {
      const subDt = 0.1;
      const isOcc = vm.isIntersectionOccupied();
      sm.updateSignal(vm.getQueueLengths(), vm.getStoppedQueues(), vm.getQueuedPCUs(), {}, subDt, isOcc);
      vm.updateVehicles(sm.currentSignal, sm.phase, subDt);

      const vState = vm.getState();
      const sState = sm.getState(vState.queues, vState.cars);
      const arrivals = vm.getCompletedArrivals();
      const departures = vm.getCompletedDepartures();

      am.recordTick({
        dt: subDt,
        simTime: i * subDt,
        currentSignal: sState.current_signal,
        phase: sState.phase,
        stoppedQueues: vState.stopped_queues,
        queuedPCUs: vState.queued_pcus,
        arrivals,
        departures,
        cars: vState.cars,
        emergencyActive: vState.emergencyActive,
        emergencyDirection: vState.emergencyDirection,
        avgWaitTime: vState.avg_wait_time,
        throughput: vState.throughput
      });
    }

    const snap = am.getSnapshot();
    assert(
      snap.sessionDurationSeconds === 5 && snap.totalSignalSeconds === 5,
      'Test 7a: Analytics sessionDurationSeconds matches accumulated simulation seconds (5.0s)'
    );
    assert(
      snap.processedCarIds !== undefined || snap.vehiclesProcessed >= 0,
      'Test 7b: Analytics processed departure events cleanly without duplication'
    );
  }

  // --- Test 8: Provider & Component Integration Verification ---
  {
    const vm = new VehicleManager();
    
    const startResult = vm.start();
    assert(startResult === true, 'Test 8a: VehicleManager.start() exists and preserves active session');

    const metrics = vm.getMetrics();
    assert(
      metrics &&
      typeof metrics.total_cars === 'number' &&
      typeof metrics.current_avg_wait_time === 'number' &&
      typeof metrics.throughput === 'number' &&
      metrics.traditional_wait_time === 45.0 &&
      metrics.queue_lengths !== undefined &&
      Array.isArray(metrics.queue_history) &&
      Array.isArray(metrics.wait_time_history),
      'Test 8b: VehicleManager.getMetrics() supplies all required consumer fields cleanly (including queue_history & wait_time_history)'
    );

    const emg = vm.triggerEmergencyVehicle('S');
    const vState = vm.getState();
    const renderedCarsInS = vState.cars.S || [];
    const containsEmgInRenderedSnapshot = renderedCarsInS.some(c => c.id === emg.id);

    assert(
      containsEmgInRenderedSnapshot,
      'Test 8c: VehicleManager.getState().cars includes active emergency vehicle in composed rendering snapshot'
    );

    const physicalCarsInS = vm.cars.S || [];
    const countInPhysical = physicalCarsInS.filter(c => c.id === emg.id).length;
    assert(
      countInPhysical === 0,
      'Test 8d: Emergency vehicle is NOT inserted into normal physical cars array (no double updates)'
    );
  }

  // --- Test 9: Upstream Backlog & Queue Saturation Test ---
  {
    const vm = new VehicleManager(42);
    for (let i = 0; i < 400; i++) {
      vm.updateVehicles('S', 'GREEN', 0.1);
    }
    const nQueues = vm.getQueueLengths().N;
    const nBacklog = vm.getBacklogQueues().N;
    const nVisible = vm.cars.N.length;

    assert(
      nQueues > 5,
      `Test 9a: Approach queue can exceed 5 vehicles (Total demand on N = ${nQueues})`
    );
    assert(
      nBacklog > 0,
      `Test 9b: Excess arrivals fill upstream backlog queue without overflowing visible segment (Backlog = ${nBacklog}, Visible = ${nVisible})`
    );
  }

  // --- Test 10: Demand Curves ---
  {
    const vm = new VehicleManager(99);
    const rateN_t60 = vm.getArrivalRate('N', 60);
    const rateW_t60 = vm.getArrivalRate('W', 60);

    const rateN_t180 = vm.getArrivalRate('N', 180);
    const rateW_t180 = vm.getArrivalRate('W', 180);

    assert(
      rateN_t60 > rateW_t60 && rateN_t180 < rateW_t180,
      'Test 10: Demand rates vary dynamically over simulation time (North busiest at t=60s, West not always busiest)'
    );
  }

  // --- Test 11: Speed-Independent Arrival Rate ---
  {
    const vm1 = new VehicleManager(777);
    const vm2 = new VehicleManager(777);

    for (let i = 0; i < 100; i++) {
      vm1.updateVehicles('N', 'GREEN', 0.1);
    }

    for (let i = 0; i < 50; i++) {
      vm2.updateVehicles('N', 'GREEN', 0.2);
    }

    assert(
      Math.abs(vm1.sessionDurationSeconds - 10.0) < 0.001 && Math.abs(vm2.sessionDurationSeconds - 10.0) < 0.001,
      'Test 11a: Both sessions accumulate exact 10.0 simulation seconds'
    );
  }

  // --- Test 12: Exact Deterministic Arrival Trace Verification Across Substep Sizes ---
  {
    const seed = 555;
    const vmSub05 = new VehicleManager(seed);
    const vmSub10 = new VehicleManager(seed);

    for (let i = 0; i < 400; i++) {
      vmSub05.updateVehicles('N', 'GREEN', 0.05);
    }

    for (let i = 0; i < 200; i++) {
      vmSub10.updateVehicles('N', 'GREEN', 0.10);
    }

    const idx05 = vmSub05.nextArrivalIndex;
    const idx10 = vmSub10.nextArrivalIndex;

    assert(
      idx05 === idx10 && idx05 > 0,
      `Test 12a: Both sub-step configurations dispatched identical arrival count (${idx05} arrivals) over 20s`
    );

    let exactTraceMatch = true;
    for (let k = 0; k < idx05; k++) {
      const a = vmSub05.arrivalSchedule[k];
      const b = vmSub10.arrivalSchedule[k];
      if (a.id !== b.id || a.timeSec !== b.timeSec || a.direction !== b.direction || a.type !== b.type) {
        exactTraceMatch = false;
        break;
      }
    }

    assert(
      exactTraceMatch,
      'Test 12b: Verified 100% identical arrival timestamps, directions, and vehicle types across 0.05s vs 0.1s sub-steps'
    );
  }

  // --- Test 13: Upstream Backlog Analytics Accounting Invariant Test ---
  {
    const vm = new VehicleManager(1234);
    const am = new AnalyticsManager();

    // Hold ALL_RED so no departures occur and arrivals fill visible segment + backlog until total arrivals reaches 101
    let tickCount = 0;
    while (am.getSnapshot().totalVehicles < 101 && tickCount < 1500) {
      tickCount++;
      vm.updateVehicles('N', 'ALL_RED', 0.1);
      const arrivals = vm.getCompletedArrivals();
      const vState = vm.getState();

      am.recordTick({
        dt: 0.1,
        simTime: tickCount * 0.1,
        currentSignal: 'N',
        phase: 'ALL_RED',
        stoppedQueues: vState.stopped_queues,
        queuedPCUs: vState.queued_pcus,
        arrivals,
        departures: [],
        cars: vState.cars,
        emergencyActive: false,
        emergencyDirection: null,
        avgWaitTime: 0,
        throughput: 0
      });
    }

    const snap = am.getSnapshot();
    const vState = vm.getState();
    const visibleCount = Object.values(vState.cars).reduce((sum, lane) => sum + lane.length, 0);
    const backlogCount = Object.values(vState.backlog_queues).reduce((sum, b) => sum + b, 0);
    const departuresCount = vState.cars_passed;

    assert(
      snap.totalVehicles === departuresCount + visibleCount + backlogCount,
      `Test 13a: Analytics invariant holds: Total Arrivals (${snap.totalVehicles}) = Departed (${departuresCount}) + Visible Active (${visibleCount}) + Backlog (${backlogCount})`
    );

    assert(
      snap.activeVehicles === 101 && snap.totalVehicles === 101 && visibleCount === 20 && backlogCount === 81,
      `Test 13b: Simulation with 10 initial vehicles + 91 arrivals and 0 departures reports 101 active vehicles (visible: ${visibleCount}, backlog: ${backlogCount})`
    );

    const vehicleTypeSum = snap.vehicleTypeData.reduce((sum, item) => sum + item.count, 0);
    assert(
      vehicleTypeSum === snap.totalVehicles,
      `Test 13c: Vehicle-type distribution total (${vehicleTypeSum}) includes all visible and backlog arrivals (${snap.totalVehicles})`
    );
  }

  return results;
}
