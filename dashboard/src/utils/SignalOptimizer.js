import { TRAFFIC_CONSTANTS } from './constants.js';

/**
 * SignalOptimizer: Configurable adaptive heuristic for signal evaluation.
 * Evaluates approach demand from queued PCUs of stopped vehicles and waiting age.
 * Enforces explicit maximum-red starvation rule and maximum continuous green bounds.
 */
export class SignalOptimizer {
  static calculateGreenDuration(approach, queuedPCU = 0, strategy = 'adaptive', policy = TRAFFIC_CONSTANTS.SIGNAL_POLICY) {
    if (strategy === 'fixed') {
      return (policy.FIXED_DURATIONS && policy.FIXED_DURATIONS[approach]) || 45;
    }

    const base = policy.BASE_GREEN || 10;
    const rate = policy.SECONDS_PER_PCU || 2.0;
    const proposed = base + rate * (queuedPCU || 0);

    return Math.min(policy.MAX_GREEN, Math.max(policy.MIN_GREEN, Math.round(proposed)));
  }

  static evaluateNextSignal({
    currentSignal = 'N',
    queuedPCUs = { N: 0, S: 0, E: 0, W: 0 },
    stoppedCounts = { N: 0, S: 0, E: 0, W: 0 },
    waitingSeconds = { N: 0, S: 0, E: 0, W: 0 },
    currentSignalTotalGreenSec = 0,
    strategy = 'adaptive',
    signalSequence = ['N', 'E', 'S', 'W'],
    forceOptimal = false,
    policy = TRAFFIC_CONSTANTS.SIGNAL_POLICY
  }) {
    if (strategy === 'fixed') {
      const currentIndex = signalSequence.indexOf(currentSignal);
      const nextIndex = (currentIndex + 1) % signalSequence.length;
      const nextSignal = signalSequence[nextIndex];
      const proposedGreen = (policy.FIXED_DURATIONS && policy.FIXED_DURATIONS[nextSignal]) || 45;

      return {
        nextSignal,
        proposedGreen,
        strategy: 'fixed',
        reason: `Fixed baseline timing plan: completed ${currentSignal} green, advancing to ${nextSignal} (${proposedGreen}s).`,
        scores: {},
        queuedPCUs: { ...queuedPCUs },
        stoppedCounts: { ...stoppedCounts }
      };
    }

    // --- Adaptive Strategy Evaluation (Configurable Heuristic) ---
    const scores = {};
    const starvationThreshold = policy.STARVATION_THRESHOLD_SEC || 45;
    const starvationBoostRate = policy.STARVATION_BOOST_PER_SEC || 0.5;
    const maxRedWait = policy.MAX_RED_WAIT_SEC || 60;
    const maxContinuousGreen = policy.MAX_CONTINUOUS_GREEN || 60;

    // Check continuous green bound on current signal
    const mustYieldCurrent = currentSignalTotalGreenSec >= maxContinuousGreen;

    let maxStarvedDir = null;
    let maxWaitTimeSec = 0;

    // 1. Calculate effective demand score per approach
    signalSequence.forEach(dir => {
      const rawPCU = queuedPCUs[dir] || 0;
      const waitSec = waitingSeconds[dir] || 0;
      const starvedSec = Math.max(0, waitSec - starvationThreshold);
      const boost = starvedSec * starvationBoostRate;

      scores[dir] = rawPCU + boost;

      if (dir !== currentSignal && waitSec > maxWaitTimeSec) {
        maxWaitTimeSec = waitSec;
        maxStarvedDir = dir;
      }
    });

    // Hard starvation rule: force serving direction if waiting time exceeds MAX_RED_WAIT_SEC
    if (maxStarvedDir && maxWaitTimeSec >= maxRedWait && (queuedPCUs[maxStarvedDir] > 0 || stoppedCounts[maxStarvedDir] > 0)) {
      const proposedGreen = SignalOptimizer.calculateGreenDuration(maxStarvedDir, queuedPCUs[maxStarvedDir], 'adaptive', policy);
      return {
        nextSignal: maxStarvedDir,
        proposedGreen,
        strategy: 'adaptive',
        reason: `Starvation rule enforced: ${maxStarvedDir} waiting ${Math.round(maxWaitTimeSec)}s (exceeded max red wait limit of ${maxRedWait}s).`,
        scores,
        queuedPCUs: { ...queuedPCUs },
        stoppedCounts: { ...stoppedCounts }
      };
    }

    // 2. Find best approach by score
    let bestDir = currentSignal;
    let bestScore = mustYieldCurrent ? -1 : (scores[currentSignal] || 0);

    signalSequence.forEach(dir => {
      if (mustYieldCurrent && dir === currentSignal) return;
      const score = scores[dir] || 0;
      if (score > bestScore || (forceOptimal && score === bestScore && dir !== currentSignal && score > 0)) {
        bestScore = score;
        bestDir = dir;
      }
    });

    // Forced yield due to continuous green limit
    if (mustYieldCurrent && bestDir !== currentSignal) {
      const proposedGreen = SignalOptimizer.calculateGreenDuration(bestDir, queuedPCUs[bestDir], 'adaptive', policy);
      return {
        nextSignal: bestDir,
        proposedGreen,
        strategy: 'adaptive',
        reason: `Max continuous green limit (${maxContinuousGreen}s) reached on ${currentSignal}. Switching allocation to ${bestDir}.`,
        scores,
        queuedPCUs: { ...queuedPCUs },
        stoppedCounts: { ...stoppedCounts }
      };
    }

    const switchMargin = policy.SWITCH_MARGIN_PCU || 3.0;
    const currentScore = scores[currentSignal] || 0;

    // 3. Switch decision logic
    if (bestDir !== currentSignal) {
      const margin = bestScore - currentScore;
      if (margin >= switchMargin || forceOptimal) {
        const proposedGreen = SignalOptimizer.calculateGreenDuration(bestDir, queuedPCUs[bestDir], 'adaptive', policy);
        return {
          nextSignal: bestDir,
          proposedGreen,
          strategy: 'adaptive',
          reason: `Demand heuristic: ${bestDir} score (${bestScore.toFixed(1)} PCUs) exceeds ${currentSignal} (${currentScore.toFixed(1)}) by margin ${margin.toFixed(1)} >= ${switchMargin}.`,
          scores,
          queuedPCUs: { ...queuedPCUs },
          stoppedCounts: { ...stoppedCounts }
        };
      }
    }

    // 4. Round-robin fallback if all approaches have minimal demand
    const anyMeaningfulDemand = Object.values(scores).some(s => s > 1.5);
    if (!anyMeaningfulDemand) {
      const currentIndex = signalSequence.indexOf(currentSignal);
      const nextIndex = (currentIndex + 1) % signalSequence.length;
      const nextSignal = signalSequence[nextIndex];
      const proposedGreen = SignalOptimizer.calculateGreenDuration(nextSignal, queuedPCUs[nextSignal], 'adaptive', policy);

      return {
        nextSignal,
        proposedGreen,
        strategy: 'adaptive',
        reason: `Low traffic demand: fallback round-robin phase selection to ${nextSignal} (${proposedGreen}s).`,
        scores,
        queuedPCUs: { ...queuedPCUs },
        stoppedCounts: { ...stoppedCounts }
      };
    }

    // Keep current green allocation
    const proposedGreen = SignalOptimizer.calculateGreenDuration(currentSignal, queuedPCUs[currentSignal], 'adaptive', policy);
    return {
      nextSignal: currentSignal,
      proposedGreen,
      strategy: 'adaptive',
      reason: `Demand maintained: ${currentSignal} continues green allocation (${proposedGreen}s).`,
      scores,
      queuedPCUs: { ...queuedPCUs },
      stoppedCounts: { ...stoppedCounts }
    };
  }
}
