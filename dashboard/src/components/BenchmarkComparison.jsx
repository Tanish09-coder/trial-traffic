import React from 'react';
import { 
  BarChart2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Info, 
  ShieldAlert,
  Sliders,
  Database,
  Layers,
  Cpu,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react';

export const BenchmarkComparison = ({ 
  data = null, 
  status = 'IDLE', 
  error = null,
  onRerun = null,
  isLiveRun = false 
}) => {
  // Empty IDLE state without silent fallback
  if (status === 'IDLE' && !data) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 size={14} /> Computed Simulation Comparison
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                IDLE
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-2">
              Fixed 45s vs Adaptive Comparison Engine
            </h2>
          </div>

          {onRerun && (
            <button
              onClick={() => onRerun?.()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer shrink-0"
            >
              <Play size={14} /> Run Comparison
            </button>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <BarChart2 size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No Comparison Run Initiated</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Select or load a video-driven analysis in <strong className="text-slate-700">Traffic Intelligence</strong> to automatically compute identical-traffic Fixed 45s vs Adaptive metrics, or click <strong>Run Comparison</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // FAILED state with error message
  if (status === 'FAILED' && !data) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 size={14} /> Computed Simulation Comparison
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold">
                FAILED
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-2">
              Comparison Execution Error
            </h2>
          </div>

          {onRerun && (
            <button
              onClick={() => onRerun?.()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer shrink-0"
            >
              <RefreshCw size={14} /> Retry Comparison
            </button>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-red-50/80 border border-red-200 text-red-900 space-y-2">
          <div className="font-bold flex items-center gap-2 text-sm text-red-950">
            <AlertCircle size={18} className="text-red-600 shrink-0" />
            Comparison Engine Error
          </div>
          <p className="text-xs text-red-900 leading-relaxed font-medium">
            {error || 'No valid analyzed video data available. Please load or select a video analysis job in Traffic Intelligence first.'}
          </p>
        </div>
      </div>
    );
  }

  const activeResult = data;
  if (!activeResult || !activeResult.fixedResults || !activeResult.adaptiveResults) {
    return null;
  }

  const { metadata, fixedResults, adaptiveResults } = activeResult;

  // Helper for computing percentage change and direction from RAW values before rounding
  const computeChange = (fixedVal, adaptiveVal, lowerIsBetter = false) => {
    if (typeof fixedVal !== 'number' || typeof adaptiveVal !== 'number' || fixedVal === 0) {
      return { pctStr: 'N/A', isImprovement: false, isDeterioration: false, isUnchanged: true, textLabel: 'N/A' };
    }

    const diff = adaptiveVal - fixedVal;
    const pct = (diff / fixedVal) * 100;
    const absPctStr = `${Math.abs(pct).toFixed(1)}%`;
    const formattedPct = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

    if (Math.abs(pct) < 0.05) {
      return { pctStr: '0.0%', isImprovement: false, isDeterioration: false, isUnchanged: true, textLabel: '0.0% (Unchanged)' };
    }

    let isImprovement = false;
    let isDeterioration = false;

    if (lowerIsBetter) {
      isImprovement = diff < 0;
      isDeterioration = diff > 0;
    } else {
      isImprovement = diff > 0;
      isDeterioration = diff < 0;
    }

    const statusText = isImprovement ? 'Improved' : isDeterioration ? 'Deteriorated' : 'Unchanged';
    const directionText = diff > 0 ? 'increase' : 'decrease';

    return {
      rawDiff: diff,
      rawPct: pct,
      formattedPct,
      isImprovement,
      isDeterioration,
      isUnchanged: !isImprovement && !isDeterioration,
      textLabel: `${absPctStr} ${directionText} (${statusText})`
    };
  };

  // Helper for formatting average waiting
  const formatAvgWaiting = (val, acceptedArrivals) => {
    if (status === 'RUNNING' && (!acceptedArrivals || acceptedArrivals === 0)) {
      return 'Collecting data';
    }
    if (val === null || val === undefined) {
      return acceptedArrivals === 0 ? 'No arrivals' : 'N/A';
    }
    return `${val.toFixed(2)} s/veh`;
  };

  // 1. Overall Metrics Rows
  const fixedTotalRemaining = (fixedResults.totalVisibleCarsRemaining || 0) + (fixedResults.totalBacklogCarsRemaining || 0);
  const adaptiveTotalRemaining = (adaptiveResults.totalVisibleCarsRemaining || 0) + (adaptiveResults.totalBacklogCarsRemaining || 0);

  const comparisonRows = [
    {
      id: 'averageWaitingAccruedPerAdmitted',
      metric: 'Average waiting accrued (s/vehicle)',
      explanation: 'Primary metric: Total accumulated waiting (veh-s) divided by accepted arrivals. Includes waiting accrued so far by completed departures, visible cars, and upstream backlog.',
      fixed: formatAvgWaiting(fixedResults.averageWaitingAccruedPerAdmitted, fixedResults.totalAcceptedArrivals),
      adaptive: formatAvgWaiting(adaptiveResults.averageWaitingAccruedPerAdmitted, adaptiveResults.totalAcceptedArrivals),
      unit: 's/veh',
      lowerIsBetter: true,
      change: computeChange(fixedResults.averageWaitingAccruedPerAdmitted, adaptiveResults.averageWaitingAccruedPerAdmitted, true)
    },
    {
      id: 'departedVehiclesAvgWaiting',
      metric: 'Departed-vehicles average waiting',
      explanation: 'Secondary metric: Average waiting time of completed departures only.',
      fixed: fixedResults.departedVehiclesAvgWaiting !== null ? `${fixedResults.departedVehiclesAvgWaiting}s (${fixedResults.departedSampleCount} sample)` : 'N/A',
      adaptive: adaptiveResults.departedVehiclesAvgWaiting !== null ? `${adaptiveResults.departedVehiclesAvgWaiting}s (${adaptiveResults.departedSampleCount} sample)` : 'N/A',
      unit: 's',
      lowerIsBetter: true,
      change: computeChange(fixedResults.departedVehiclesAvgWaiting, adaptiveResults.departedVehiclesAvgWaiting, true)
    },
    {
      id: 'acceptedArrivals',
      metric: 'Accepted arrivals',
      explanation: 'Total vehicle arrivals admitted into the intersection or backlog.',
      fixed: fixedResults.totalAcceptedArrivals,
      adaptive: adaptiveResults.totalAcceptedArrivals,
      unit: 'cars',
      lowerIsBetter: false,
      change: computeChange(fixedResults.totalAcceptedArrivals, adaptiveResults.totalAcceptedArrivals, false)
    },
    {
      id: 'completedDepartures',
      metric: 'Completed departures',
      explanation: 'Vehicles that successfully crossed the exit threshold.',
      fixed: fixedResults.totalDepartures,
      adaptive: adaptiveResults.totalDepartures,
      unit: 'cars',
      lowerIsBetter: false,
      change: computeChange(fixedResults.totalDepartures, adaptiveResults.totalDepartures, false)
    },
    {
      id: 'totalAccumulatedWaitSec',
      metric: 'Total accumulated waiting time',
      explanation: 'Time-integrated sum of stopped vehicle seconds across visible cars and backlog.',
      fixed: `${(fixedResults.totalAccumulatedWaitSec || 0).toLocaleString()} veh-s`,
      adaptive: `${(adaptiveResults.totalAccumulatedWaitSec || 0).toLocaleString()} veh-s`,
      unit: 'veh-s',
      lowerIsBetter: true,
      change: computeChange(fixedResults.totalAccumulatedWaitSec, adaptiveResults.totalAccumulatedWaitSec, true)
    },
    {
      id: 'timeWeightedAvgStoppedQueue',
      metric: 'Time-weighted average stopped queue',
      explanation: 'Mean number of stopped vehicles including backlog over simulation duration.',
      fixed: `${fixedResults.timeWeightedAvgStoppedQueue} vehicles`,
      adaptive: `${adaptiveResults.timeWeightedAvgStoppedQueue} vehicles`,
      unit: 'vehicles',
      lowerIsBetter: true,
      change: computeChange(fixedResults.timeWeightedAvgStoppedQueue, adaptiveResults.timeWeightedAvgStoppedQueue, true)
    },
    {
      id: 'maxStoppedQueue',
      metric: 'Maximum stopped queue',
      explanation: 'Peak instantaneous stopped vehicle count (visible + backlog).',
      fixed: `${fixedResults.maxStoppedQueue} vehicles`,
      adaptive: `${adaptiveResults.maxStoppedQueue} vehicles`,
      unit: 'vehicles',
      lowerIsBetter: true,
      change: computeChange(fixedResults.maxStoppedQueue, adaptiveResults.maxStoppedQueue, true)
    },
    {
      id: 'totalRemainingVehicles',
      metric: 'Total remaining vehicles (visible + backlog)',
      explanation: 'Vehicles remaining on visible road or in backlog at scenario end.',
      fixed: `${fixedTotalRemaining} vehicles (${fixedResults.totalVisibleCarsRemaining} vis + ${fixedResults.totalBacklogCarsRemaining} back)`,
      adaptive: `${adaptiveTotalRemaining} vehicles (${adaptiveResults.totalVisibleCarsRemaining} vis + ${adaptiveResults.totalBacklogCarsRemaining} back)`,
      unit: 'vehicles',
      lowerIsBetter: true,
      change: computeChange(fixedTotalRemaining, adaptiveTotalRemaining, true)
    }
  ];

  // 2. Per-Approach Trade-Off Data
  const approaches = ['N', 'E', 'S', 'W'];
  const approachNames = { N: 'North', E: 'East', S: 'South (Video)', W: 'West' };

  const approachTradeOffs = approaches.map(dir => {
    const fApp = (fixedResults.perApproach && fixedResults.perApproach[dir]) || {};
    const aApp = (adaptiveResults.perApproach && adaptiveResults.perApproach[dir]) || {};
    const change = computeChange(fApp.accumulatedWaitSec, aApp.accumulatedWaitSec, true);

    return {
      dir,
      name: approachNames[dir],
      fixedDepartures: fApp.departures || 0,
      adaptiveDepartures: aApp.departures || 0,
      fixedWaitSec: fApp.accumulatedWaitSec || 0,
      adaptiveWaitSec: aApp.accumulatedWaitSec || 0,
      change
    };
  });

  // Dynamic Narrative Generation
  const improvedDirs = approachTradeOffs.filter(a => a.change.isImprovement).map(a => `${a.name} (${a.change.formattedPct})`);
  const deterioratedDirs = approachTradeOffs.filter(a => a.change.isDeterioration).map(a => `${a.name} (${a.change.formattedPct})`);
  const unchangedDirs = approachTradeOffs.filter(a => a.change.isUnchanged).map(a => `${a.name} (${a.change.formattedPct})`);

  let dynamicTradeOffText = '';
  if (improvedDirs.length > 0) {
    dynamicTradeOffText += `Adaptive control reduced waiting time on ${improvedDirs.join(', ')}. `;
  }
  if (unchangedDirs.length > 0) {
    dynamicTradeOffText += `${unchangedDirs.join(', ')} remained unchanged. `;
  }
  if (deterioratedDirs.length > 0) {
    dynamicTradeOffText += `On ${deterioratedDirs.join(', ')}, waiting time increased because adaptive control dynamically prioritized heavy queue approaches over light demand.`;
  }

  const completionTimeStr = metadata.completionTime || metadata.timestamp ? new Date(metadata.completionTime || metadata.timestamp).toLocaleString() : 'N/A';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
      
      {/* ── Section Header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 size={14} /> Computed Simulation Comparison
            </span>

            {/* Status Badges */}
            {status === 'COMPLETED' && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Completed
              </span>
            )}
            {status === 'RUNNING' && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                <Clock size={12} /> Previous run (updating...)
              </span>
            )}
            {status === 'STALE' && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
                <AlertCircle size={12} /> Stale Inputs
              </span>
            )}
            {status === 'FAILED' && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold flex items-center gap-1">
                <AlertCircle size={12} /> Run Error
              </span>
            )}

            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-medium">
              Run ID: {metadata.runId || 'N/A'}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
            Computed simulation comparison — identical traffic inputs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {metadata.scenarioLabel || 'Short-run comparison (~159s clip; full Fixed cycle takes ~196s including clearance)'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onRerun && (
            <button
              onClick={() => onRerun?.()}
              disabled={status === 'RUNNING'}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <RefreshCw size={14} className={status === 'RUNNING' ? 'animate-spin' : ''} />
              {status === 'RUNNING' ? 'Computing...' : 'Rerun Comparison'}
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 font-mono">
            <Database size={15} className="text-indigo-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Fingerprint</span>
              <span className="font-bold text-slate-800">{(metadata.timelineFingerprint || '').slice(0, 16)}...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert if rerun failed but previous data is displayed */}
      {status === 'FAILED' && error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between gap-2 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>Rerun failed: {error}</span>
          </div>
        </div>
      )}

      {/* ── 1. Overall Metrics Comparison Table ─────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Layers size={16} className="text-blue-600" />
          Overall Session Comparison
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px] text-slate-500">
                <th className="py-3.5 px-4">Metric</th>
                <th className="py-3.5 px-4 bg-slate-100/50">Fixed (45s Baseline)</th>
                <th className="py-3.5 px-4 bg-indigo-50/50">Adaptive (Heuristic)</th>
                <th className="py-3.5 px-4">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {comparisonRows.map(row => {
                const c = row.change;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{row.metric}</div>
                      {row.explanation && (
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{row.explanation}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 bg-slate-50/30 font-mono text-slate-700">{row.fixed}</td>
                    <td className="py-3.5 px-4 bg-indigo-50/20 font-mono font-bold text-indigo-950">{row.adaptive}</td>
                    <td className="py-3.5 px-4">
                      {c.isUnchanged && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                          <Minus size={12} /> {c.textLabel}
                        </span>
                      )}
                      {c.isImprovement && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                          <ArrowDownRight size={14} className="text-emerald-600" /> {c.textLabel}
                        </span>
                      )}
                      {c.isDeterioration && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                          <ArrowUpRight size={14} className="text-amber-600" /> {c.textLabel}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. Per-Direction Trade-Offs Section ───────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-indigo-600" />
            Per-Approach Trade-Off Analysis
          </h3>
          <span className="text-[11px] text-slate-500 italic">
            Visible trade-offs preserved
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px] text-slate-500">
                <th className="py-3 px-4">Approach</th>
                <th className="py-3 px-4">Fixed Departures</th>
                <th className="py-3 px-4">Adaptive Departures</th>
                <th className="py-3 px-4">Fixed Wait (veh-s)</th>
                <th className="py-3 px-4">Adaptive Wait (veh-s)</th>
                <th className="py-3 px-4">Waiting Time Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium font-mono">
              {approachTradeOffs.map(app => {
                const c = app.change;
                return (
                  <tr key={app.dir} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                        {app.dir}
                      </span>
                      <span>{app.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{app.fixedDepartures}</td>
                    <td className="py-3 px-4 font-bold text-indigo-900">{app.adaptiveDepartures}</td>
                    <td className="py-3 px-4 text-slate-700">{(app.fixedWaitSec || 0).toLocaleString()}s</td>
                    <td className="py-3 px-4 font-bold text-indigo-900">{(app.adaptiveWaitSec || 0).toLocaleString()}s</td>
                    <td className="py-3 px-4 font-sans">
                      {c.isUnchanged && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[11px]">
                          0.0% (Unchanged)
                        </span>
                      )}
                      {c.isImprovement && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                          {c.formattedPct} (Improved)
                        </span>
                      )}
                      {c.isDeterioration && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                          {c.formattedPct} (Deteriorated)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-indigo-900">
            <Cpu size={14} /> Controller Trade-Off Observation
          </div>
          <p className="text-[11px] leading-relaxed text-indigo-900">
            {dynamicTradeOffText || 'Identical traffic simulation complete.'}
          </p>
        </div>
      </div>

      {/* ── 3. Scenario Details & Mandatory Notice ────────────── */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Info size={14} /> Scenario Parameters & Provenance
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Scenario Duration</span>
            <span className="font-semibold text-slate-800">{metadata.actualDurationSec || 158.63}s</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Random Seed</span>
            <span className="font-mono font-semibold text-slate-800">Seed {metadata.randomSeed || 42}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Completion Time</span>
            <span className="font-semibold text-slate-800">{completionTimeStr}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Initial Conditions</span>
            <span className="font-semibold text-slate-800">Empty Roads (0 Visible / 0 Backlog)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">South Approach</span>
            <span className="font-semibold text-blue-700">Video Arrival Events</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">N / E / W Approaches</span>
            <span className="font-semibold text-slate-800">Generated Schedule (Seed 42)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Fixed Plan</span>
            <span className="font-mono text-slate-700">{metadata.fixedPlanLabel || 'Uniform Fixed Baseline — 45s per direction'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Sub-step Delta</span>
            <span className="font-mono text-slate-700">max 0.05s</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <ShieldAlert size={15} className="text-amber-600" /> Short-Run Scenario Scope Notice
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
            This short-run comparison covers approximately 159 seconds. A full uniform Fixed signal cycle takes 196 seconds (4 × 45s green + 4 × 4s clearance). Short scenarios reflect specific phase boundary conditions and do not generalize to long-term network traffic operations.
          </p>
        </div>
      </div>

    </div>
  );
};
