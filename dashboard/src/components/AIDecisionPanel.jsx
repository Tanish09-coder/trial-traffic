import React from 'react';
import { Cpu, Layers, AlertCircle, Clock } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const AIDecisionPanel = () => {
  const { state, strategy, setStrategy, useMock } = useSimulation();
  const {
    signal,
    pending_signal,
    phase,
    signal_timer,
    active_green_duration,
    pending_green_duration,
    phase_remaining_sec,
    phase_label,
    clearance_status,
    decision,
    queued_pcus,
    stopped_queues
  } = state || {};

  const stagedStrategy = state.staged_strategy || strategy;
  const isStaged = stagedStrategy !== strategy;

  return (
    <div className="bg-[#18181B]/95 backdrop-blur-md border border-gray-800 rounded-xl p-4 shadow-xl text-white select-none">
      {/* Header & Strategy Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-gray-100">Signal Optimization Strategy</h3>
            <p className="text-[11px] text-gray-400">Configurable adaptive demand heuristic</p>
          </div>
        </div>

        {/* Fixed / Adaptive Toggle */}
        <div className="flex items-center bg-gray-900/90 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setStrategy('fixed')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${strategy === 'fixed'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Fixed Plan
          </button>
          <button
            onClick={() => setStrategy('adaptive')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${strategy === 'adaptive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Adaptive Heuristic
          </button>
        </div>
      </div>

      {/* Staging warning if strategy changed mid-cycle */}
      {isStaged && (
        <div className="mb-3 text-[11px] bg-amber-950/60 border border-amber-800 text-amber-300 px-2.5 py-1.5 rounded-md flex items-center space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Strategy change to <strong>{stagedStrategy}</strong> staged; applying at next phase boundary.</span>
        </div>
      )}

      {/* Extended Clearance status warning */}
      {clearance_status && (
        <div className="mb-3 text-[11px] bg-red-950/80 border border-red-800 text-red-200 px-2.5 py-1.5 rounded-md flex items-center space-x-1.5 animate-pulse">
          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
          <span>{clearance_status}</span>
        </div>
      )}

      {/* Backend mode warning */}
      {!useMock && (
        <div className="mb-3 text-[11px] bg-blue-950/60 border border-blue-800 text-blue-300 px-2.5 py-1.5 rounded-md flex items-center space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Backend mode active. Local heuristic strategy controls are disabled.</span>
        </div>
      )}

      {/* Live Phase & Controller Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-gray-900/60 p-2 rounded-lg border border-gray-800/80">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Signal</span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="text-base font-extrabold text-emerald-400">{signal || 'N'}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${phase === 'GREEN' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                phase === 'YELLOW' ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse' :
                  'bg-red-950 text-red-300 border border-red-800'
              }`}>
              {phase}
            </span>
          </div>
        </div>

        <div className="bg-gray-900/60 p-2 rounded-lg border border-gray-800/80">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{phase_label || 'Remaining'}</span>
          <div className="text-base font-extrabold text-gray-100 mt-0.5">
            {clearance_status ? (
              <span className="text-amber-400 text-xs">Clearing...</span>
            ) : (
              <span>{phase_remaining_sec ?? 0}s <span className="text-xs text-gray-400 font-normal">/ {active_green_duration || 30}s green</span></span>
            )}
          </div>
        </div>

        <div className="bg-gray-900/60 p-2 rounded-lg border border-gray-800/80">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Next Pending</span>
          <div className="text-base font-extrabold text-cyan-400 mt-0.5">
            {pending_signal || signal || 'N'} <span className="text-xs text-gray-400 font-normal">({pending_green_duration || 30}s)</span>
          </div>
        </div>

        <div className="bg-gray-900/60 p-2 rounded-lg border border-gray-800/80">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Strategy Mode</span>
          <div className="text-xs font-bold text-gray-200 mt-1 capitalize">
            {strategy}
          </div>
        </div>
      </div>

      {/* Approach Demand Breakdown */}
      <div className="mb-3 bg-gray-900/40 p-2.5 rounded-lg border border-gray-800/60">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">Approach Demand (PCUs / Visible Stopped + Upstream Backlog)</span>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {['N', 'S', 'E', 'W'].map(dir => {
            const backlog = state?.backlog_queues?.[dir] || 0;
            const visibleStopped = state?.visible_stopped_queues?.[dir] !== undefined
              ? state.visible_stopped_queues[dir]
              : Math.max(0, (stopped_queues?.[dir] || 0) - backlog);
            return (
              <div key={dir} className={`p-1 rounded ${signal === dir ? 'bg-emerald-950/70 border border-emerald-700/60' : 'bg-gray-900/80'}`}>
                <div className="font-bold text-gray-300">{dir}</div>
                <div className="font-mono text-emerald-400 font-semibold">{queued_pcus?.[dir] ?? 0} PCU</div>
                <div className="text-[10px] text-gray-400">
                  ({visibleStopped} visible stopped{backlog > 0 ? ` + ${backlog} backlog` : ''})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Allocation Formula Snapshot Explanation */}
      {decision?.allocationExplanation && (
        <div className="mb-2 text-xs bg-indigo-950/60 border border-indigo-800/80 rounded-lg p-2 text-indigo-200 flex items-start space-x-2">
          <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-200">Allocation Snapshot: </span>
            <span className="text-indigo-200 font-mono">{decision.allocationExplanation}</span>
          </div>
        </div>
      )}

      {/* Decision Reason */}
      {decision?.reason && (
        <div className="text-xs bg-gray-900/80 border border-gray-800/90 rounded-lg p-2 text-gray-300 flex items-start space-x-2">
          <Layers className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-200">Recommendation Reason: </span>
            <span className="text-gray-300">{decision.reason}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDecisionPanel;
