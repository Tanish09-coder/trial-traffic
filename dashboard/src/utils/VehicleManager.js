import { TRAFFIC_CONSTANTS } from './constants.js';

const INTERSECTION_ENTRY_THRESHOLD = 42;
const MIN_VEHICLE_GAP = 5.5;
const STOP_LINE_POSITION = 25;
const QUEUE_APPROACH_SPEED = 1.2;

/**
 * Seedable Pseudo-Random Number Generator (Mulberry32)
 */
function createPRNG(seed = 12345) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class VehicleManager {
  constructor(seed = 12345) {
    this.seed = seed;
    this.cars = { N: [], E: [], S: [], W: [] };
    this.backlog = { N: [], E: [], S: [], W: [] };
    this.carsPassed = 0;
    this.sessionDurationSeconds = 0;
    this.emergencyVehicle = null;
    this.emergencyCooldown = 0;
    this.carIdCounter = 1;

    this._queueHistory = [];
    this._completedWaitTimes = [];
    this._completedArrivals = [];
    this._completedDepartures = [];
    this._waitTimeHistory = [];
    this._throughputHistory = [];

    this._initScheduleAndSimulation();
  }

  start() {
    return true;
  }

  setSeed(seed = 12345) {
    this.seed = seed;
    this._initScheduleAndSimulation();
  }

  _initScheduleAndSimulation() {
    this.arrivalSchedule = this._generateArrivalSchedule(this.seed, 1200);
    this.nextArrivalIndex = 0;
    this._initializeSimulationVehicles();
  }

  /**
   * Dynamic time-varying demand curves (vehicles per simulation second).
   */
  getArrivalRate(direction, simTimeSec) {
    const t = simTimeSec || 0;
    let baseRate = 0.30;

    switch (direction) {
      case 'N':
        baseRate = 0.30 + 0.25 * Math.sin((2 * Math.PI * t) / 120);
        break;
      case 'S':
        baseRate = 0.35 + 0.25 * Math.cos((2 * Math.PI * t) / 180);
        break;
      case 'E':
        baseRate = 0.25 + 0.30 * Math.sin((2 * Math.PI * t) / 150 + Math.PI / 2);
        break;
      case 'W':
        baseRate = 0.28 + 0.28 * Math.sin((2 * Math.PI * t) / 200 + Math.PI);
        break;
    }
    return Math.max(0.08, parseFloat(baseRate.toFixed(3)));
  }

  /**
   * Precomputes a continuous, deterministic arrival schedule for the seed.
   * Ensures identical arrival timestamps, directions, and vehicle types
   * regardless of physics sub-step sizes (e.g. 0.05s vs 0.1s).
   */
  _generateArrivalSchedule(seed, maxDurationSec = 1200) {
    const prng = createPRNG(seed);
    const schedule = [];
    const directions = ['N', 'S', 'E', 'W'];
    let idCounter = 1;

    directions.forEach(direction => {
      let t = prng() * 2.0;
      while (t < maxDurationSec) {
        const ratePerSec = this.getArrivalRate(direction, t);
        const dtArrival = -Math.log(1 - Math.min(0.99, prng())) / ratePerSec;
        t += Math.max(0.5, dtArrival);

        if (t >= maxDurationSec) break;

        const r = prng();
        const vType = r < 0.50 ? 'car' : r < 0.72 ? 'bike' : r < 0.88 ? 'bus' : 'truck';
        const speed = vType === 'bike' ? 7.5 : vType === 'bus' ? 4.5 : vType === 'truck' ? 4.0 : 6.0;

        schedule.push({
          id: `v-${direction}-${idCounter++}`,
          timeSec: parseFloat(t.toFixed(3)),
          direction,
          type: vType,
          speed
        });
      }
    });

    schedule.sort((a, b) => a.timeSec - b.timeSec);
    return schedule;
  }

  _initializeSimulationVehicles() {
    this.cars = { N: [], E: [], S: [], W: [] };
    this.backlog = { N: [], E: [], S: [], W: [] };
    this._completedArrivals = [];
    const initialCounts = { N: 3, E: 2, S: 4, W: 1 };
    const vehicleTypes = ['car', 'bike', 'bus', 'truck'];

    Object.entries(initialCounts).forEach(([dir, count]) => {
      let lastPos = 2;
      for (let i = 0; i < count; i++) {
        const spacing = 5 + (i * 1.5);
        const pos = Math.min(STOP_LINE_POSITION - 0.5, lastPos + spacing);
        lastPos = pos;
        const vType = vehicleTypes[i % vehicleTypes.length];
        const speed = vType === 'bike' ? 7.5 : vType === 'bus' ? 4.5 : vType === 'truck' ? 4.0 : 6.0;
        const vehId = `init-${dir}-${this.carIdCounter++}`;

        this.cars[dir].push({
          id: vehId,
          position: pos,
          speed,
          type: vType,
          waitTime: pos >= (STOP_LINE_POSITION - 2) ? 5 + (i * 2) : 0,
          isStopped: pos >= (STOP_LINE_POSITION - 2),
          inIntersection: false
        });

        this._completedArrivals.push({
          id: vehId,
          direction: dir,
          type: vType,
          timeSec: 0
        });
      }
      this.cars[dir].sort((a, b) => b.position - a.position);
    });
  }

  getQueueLengths() {
    const q = {};
    Object.keys(this.cars).forEach(dir => {
      q[dir] = this.cars[dir].length + (this.backlog[dir] ? this.backlog[dir].length : 0);
    });
    return q;
  }

  getVisibleStoppedQueues() {
    const visible = {};
    Object.keys(this.cars).forEach(dir => {
      visible[dir] = this.cars[dir].filter(c => c.position <= STOP_LINE_POSITION && c.isStopped).length;
    });
    return visible;
  }

  getStoppedQueues() {
    const stopped = {};
    Object.keys(this.cars).forEach(dir => {
      const visibleStopped = this.cars[dir].filter(c => c.position <= STOP_LINE_POSITION && c.isStopped).length;
      const backlogCount = this.backlog[dir] ? this.backlog[dir].length : 0;
      stopped[dir] = visibleStopped + backlogCount;
    });
    return stopped;
  }

  getBacklogQueues() {
    const b = {};
    Object.keys(this.backlog).forEach(dir => {
      b[dir] = this.backlog[dir].length;
    });
    return b;
  }

  getQueuedPCUs() {
    const pcus = {};
    const weights = TRAFFIC_CONSTANTS.PCU_WEIGHTS || { car: 1.0, bike: 0.5, bus: 2.5, truck: 2.5 };
    Object.keys(this.cars).forEach(dir => {
      let totalPcu = 0;
      this.cars[dir].forEach(c => {
        if (c.position <= STOP_LINE_POSITION && c.isStopped) {
          const w = weights[c.type] || 1.0;
          totalPcu += w;
        }
      });
      (this.backlog[dir] || []).forEach(bVeh => {
        const w = weights[bVeh.type] || 1.0;
        totalPcu += w;
      });

      pcus[dir] = parseFloat(totalPcu.toFixed(1));
    });
    return pcus;
  }

  getOldestWaitTimes() {
    const oldest = {};
    Object.keys(this.cars).forEach(dir => {
      let maxWait = 0;
      this.cars[dir].forEach(car => {
        if (car.position <= STOP_LINE_POSITION && car.isStopped && car.waitTime > maxWait) {
          maxWait = car.waitTime;
        }
      });
      (this.backlog[dir] || []).forEach(bVeh => {
        if (bVeh.waitTime > maxWait) {
          maxWait = bVeh.waitTime;
        }
      });
      oldest[dir] = maxWait;
    });
    return oldest;
  }

  getCompletedArrivals() {
    return [...(this._completedArrivals || [])];
  }

  getCompletedDepartures() {
    return [...(this._completedDepartures || [])];
  }

  getActiveEmergencyVehicle() {
    if (this.emergencyVehicle && this.emergencyVehicle.position < 100) {
      return this.emergencyVehicle;
    }
    return null;
  }

  isIntersectionOccupied() {
    const normalOccupied = Object.values(this.cars).some(lane =>
      lane.some(car => car.inIntersection || (car.position > STOP_LINE_POSITION && car.position < 100))
    );
    const emgOccupied = !!(this.emergencyVehicle &&
      (this.emergencyVehicle.inIntersection || (this.emergencyVehicle.position > STOP_LINE_POSITION && this.emergencyVehicle.position < 100))
    );
    return normalOccupied || emgOccupied;
  }

  /**
   * Bounded Physics, Deterministic Scheduled Arrivals & Backlog Rules:
   * 1. Scheduled arrivals enter system strictly at precomputed simulation timestamps (timeSec).
   * 2. When visible entrance fills, arriving vehicles queue in the off-screen backlog.
   * 3. Backlog vehicles transition smoothly onto visible road (position = 0) as space opens.
   * 4. External arrivals continue spawning regardless of emergency mode.
   */
  updateVehicles(currentSignal = 'N', signalPhase = 'GREEN', dt = 1.0) {
    const deltaSec = typeof dt === 'number' && dt > 0 ? dt : 1.0;
    this.sessionDurationSeconds += deltaSec;
    const isEmergencyActive = !!(this.emergencyVehicle && this.emergencyVehicle.position < 100);

    // 1. Process backlog wait times
    Object.keys(this.backlog).forEach(dir => {
      (this.backlog[dir] || []).forEach(bVeh => {
        bVeh.waitTime += deltaSec;
      });
    });

    // 2. Dispatch precomputed arrival schedule up to current sessionDurationSeconds
    while (
      this.arrivalSchedule &&
      this.nextArrivalIndex < this.arrivalSchedule.length &&
      this.arrivalSchedule[this.nextArrivalIndex].timeSec <= this.sessionDurationSeconds
    ) {
      const event = this.arrivalSchedule[this.nextArrivalIndex++];
      const direction = event.direction;

      const newVeh = {
        id: event.id,
        position: 0,
        speed: event.speed,
        type: event.type,
        waitTime: 0,
        isStopped: false,
        inIntersection: false
      };

      this._completedArrivals.push({
        id: event.id,
        direction: event.direction,
        type: event.type,
        timeSec: event.timeSec
      });

      const sortedLane = this.cars[direction];
      const rearCar = sortedLane.length > 0 ? sortedLane[sortedLane.length - 1] : null;

      if (!rearCar || rearCar.position >= MIN_VEHICLE_GAP) {
        this.cars[direction].push(newVeh);
        this.cars[direction].sort((a, b) => b.position - a.position);
      } else {
        this.backlog[direction].push(newVeh);
      }
    }

    // 3. Update visible vehicle positions
    Object.keys(this.cars).forEach(direction => {
      const isGreenPhase = (direction === currentSignal && signalPhase === 'GREEN');
      const laneArr = this.cars[direction];

      const updatedCars = laneArr.filter(car => {
        if (car.position >= INTERSECTION_ENTRY_THRESHOLD && !car.inIntersection) {
          car.inIntersection = true;
        }

        const isCommittedPastStopLine = car.position > STOP_LINE_POSITION;
        const canMove = isGreenPhase || isCommittedPastStopLine || car.inIntersection;

        const myIndex = laneArr.indexOf(car);
        const carAhead = myIndex > 0 ? laneArr[myIndex - 1] : null;

        if (canMove) {
          car.isStopped = false;
          const moveSpeed = car.speed * deltaSec;
          car.position += moveSpeed;

          if (carAhead && car.position > carAhead.position - MIN_VEHICLE_GAP) {
            car.position = carAhead.position - MIN_VEHICLE_GAP;
          }

          if (car.position >= 100) {
            this.carsPassed++;
            const wt = typeof car.waitTime === 'number' ? car.waitTime : 0;
            this._completedWaitTimes.push(wt);
            if (this._completedWaitTimes.length > 300) this._completedWaitTimes.shift();

            this._completedDepartures.push({
              id: car.id,
              type: car.type || 'car',
              direction,
              delay: wt,
              exitTime: Date.now()
            });
            if (this._completedDepartures.length > 500) {
              this._completedDepartures.shift();
            }
            return false;
          }
        } else {
          const naturalSlot = carAhead
            ? Math.min(STOP_LINE_POSITION, carAhead.position - MIN_VEHICLE_GAP)
            : STOP_LINE_POSITION;

          if (car.position < naturalSlot) {
            car.isStopped = false;
            car.position = Math.min(naturalSlot, car.position + QUEUE_APPROACH_SPEED * deltaSec);
          } else {
            car.position = Math.min(car.position, naturalSlot);
            car.isStopped = true;
            car.waitTime = (car.waitTime || 0) + deltaSec;
          }
        }
        return true;
      });

      this.cars[direction] = updatedCars.sort((a, b) => b.position - a.position);

      // Dequeue from backlog onto visible road (position = 0) as space opens
      // Note: Transitioning from backlog onto visible road does NOT emit a new arrival event
      const sortedLane = this.cars[direction];
      const rearCar = sortedLane.length > 0 ? sortedLane[sortedLane.length - 1] : null;

      if ((!rearCar || rearCar.position >= MIN_VEHICLE_GAP) && this.backlog[direction].length > 0) {
        const enteringVeh = this.backlog[direction].shift();
        enteringVeh.position = 0;
        enteringVeh.isStopped = false;
        this.cars[direction].push(enteringVeh);
        this.cars[direction].sort((a, b) => b.position - a.position);
      }
    });

    // 4. Advance separate emergency vehicle entity if active
    if (isEmergencyActive) {
      const emgApp = this.emergencyVehicle.approach;
      const isEmgGreen = (emgApp === currentSignal && signalPhase === 'GREEN');
      const isEmgCommitted = this.emergencyVehicle.position > STOP_LINE_POSITION;

      if (isEmgGreen || isEmgCommitted || this.emergencyVehicle.inIntersection) {
        this.emergencyVehicle.isStopped = false;
        const laneArr = this.cars[emgApp] || [];
        const carsAhead = laneArr.filter(c => c.position > this.emergencyVehicle.position);
        const carDirectlyAhead = carsAhead.length > 0
          ? carsAhead.reduce((prev, curr) => curr.position < prev.position ? curr : prev)
          : null;

        const maxAllowedPos = carDirectlyAhead
          ? Math.max(0, carDirectlyAhead.position - MIN_VEHICLE_GAP)
          : 105;

        const targetPos = this.emergencyVehicle.position + Math.max(this.emergencyVehicle.speed || 8, 8) * deltaSec;
        this.emergencyVehicle.position = Math.min(targetPos, Math.max(this.emergencyVehicle.position + 2.0 * deltaSec, maxAllowedPos));

        if (this.emergencyVehicle.position >= INTERSECTION_ENTRY_THRESHOLD) {
          this.emergencyVehicle.inIntersection = true;
        }

        if (this.emergencyVehicle.position >= 100) {
          this.carsPassed++;
          this._completedDepartures.push({
            id: this.emergencyVehicle.id,
            type: this.emergencyVehicle.type || 'ambulance',
            direction: emgApp,
            delay: this.emergencyVehicle.waitTime || 0,
            exitTime: Date.now()
          });
          this.emergencyVehicle = null;
        }
      } else {
        const naturalSlot = STOP_LINE_POSITION;
        if (this.emergencyVehicle.position < naturalSlot) {
          this.emergencyVehicle.isStopped = false;
          this.emergencyVehicle.position = Math.min(naturalSlot, this.emergencyVehicle.position + QUEUE_APPROACH_SPEED * deltaSec);
        } else {
          this.emergencyVehicle.position = Math.min(this.emergencyVehicle.position, naturalSlot);
          this.emergencyVehicle.isStopped = true;
          this.emergencyVehicle.waitTime = (this.emergencyVehicle.waitTime || 0) + deltaSec;
        }
      }
    }

    if (this.emergencyCooldown > 0) {
      this.emergencyCooldown -= deltaSec;
    }

    const ql = this.getQueueLengths();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const snapshot = {
      time: timeStr,
      ...ql,
      queues: { ...ql }
    };
    this._queueHistory = [...this._queueHistory.slice(-29), snapshot];

    const currentAvgWait = this.calculateAverageWaitTime();
    if (this._completedWaitTimes.length > 0) {
      this._waitTimeHistory = [
        ...this._waitTimeHistory.slice(-29),
        {
          time: timeStr,
          wait_time: currentAvgWait
        }
      ];
    }

    this._throughputHistory = [
      ...this._throughputHistory.slice(-119),
      {
        timestamp: Date.now(),
        throughput: this.calculateThroughput()
      }
    ];
  }

  triggerEmergency(direction) {
    return this.triggerEmergencyVehicle(direction);
  }

  triggerEmergencyVehicle(direction) {
    const app = ['N', 'S', 'E', 'W'].includes(direction) ? direction : 'S';
    const emgId = `emg-${app}-${Date.now()}`;

    this.emergencyVehicle = {
      id: emgId,
      position: 0,
      speed: 8.5,
      type: 'ambulance',
      approach: app,
      waitTime: 0,
      isStopped: false,
      inIntersection: false
    };

    this._completedArrivals.push({
      id: emgId,
      direction: app,
      type: 'ambulance',
      timeSec: this.sessionDurationSeconds
    });

    return this.emergencyVehicle;
  }

  calculateAverageWaitTime() {
    if (this._completedWaitTimes.length === 0) return 0;
    const sum = this._completedWaitTimes.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / this._completedWaitTimes.length).toFixed(1));
  }

  calculateThroughput() {
    if (this.sessionDurationSeconds <= 0) return 0;
    return Math.round((this.carsPassed / this.sessionDurationSeconds) * 60);
  }

  getMetrics() {
    const avgWait = this.calculateAverageWaitTime();
    const throughput = this.calculateThroughput();
    const totalCars = this.carsPassed;

    return {
      total_cars: totalCars,
      cars_passed: totalCars,
      current_avg_wait_time: avgWait,
      avg_wait_time: avgWait,
      throughput: throughput,
      traditional_wait_time: 45.0,
      time_saved_per_hour_minutes: parseFloat(((totalCars * 12.5) / 60).toFixed(1)),
      fuel_saved_per_hour_liters: parseFloat((totalCars * 0.15).toFixed(1)),
      queue_lengths: this.getQueueLengths(),
      queues: this.getQueueLengths(),
      stopped_queues: this.getStoppedQueues(),
      visible_stopped_queues: this.getVisibleStoppedQueues(),
      backlog_queues: this.getBacklogQueues(),
      queued_pcus: this.getQueuedPCUs(),
      queue_history: [...this._queueHistory],
      wait_time_history: [...this._waitTimeHistory]
    };
  }

  reset(seed = 12345) {
    this.seed = seed;
    this.carsPassed = 0;
    this.sessionDurationSeconds = 0;
    this.emergencyVehicle = null;
    this.emergencyCooldown = 0;
    this.carIdCounter = 1;
    this._queueHistory = [];
    this._completedWaitTimes = [];
    this._completedArrivals = [];
    this._completedDepartures = [];
    this._waitTimeHistory = [];
    this._throughputHistory = [];
    this._initScheduleAndSimulation();
  }

  getState() {
    const composedCars = { N: [...this.cars.N], E: [...this.cars.E], S: [...this.cars.S], W: [...this.cars.W] };
    if (this.emergencyVehicle && this.emergencyVehicle.position < 100) {
      const app = this.emergencyVehicle.approach;
      if (composedCars[app]) {
        composedCars[app] = [...composedCars[app], this.emergencyVehicle].sort((a, b) => b.position - a.position);
      }
    }

    return {
      cars: composedCars,
      cars_passed: this.carsPassed,
      emergency_vehicle: this.emergencyVehicle,
      emergencyActive: !!(this.emergencyVehicle && this.emergencyVehicle.position < 100),
      emergencyDirection: this.emergencyVehicle ? this.emergencyVehicle.approach : null,
      queues: this.getQueueLengths(),
      stopped_queues: this.getStoppedQueues(),
      visible_stopped_queues: this.getVisibleStoppedQueues(),
      backlog_queues: this.getBacklogQueues(),
      queued_pcus: this.getQueuedPCUs(),
      avg_wait_time: this.calculateAverageWaitTime(),
      throughput: this.calculateThroughput()
    };
  }
}