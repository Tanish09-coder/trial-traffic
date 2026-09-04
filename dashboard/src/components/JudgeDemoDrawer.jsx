import React from 'react';
import {
  SlidersHorizontal,
  X,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Server
} from 'lucide-react';
import { useTraffic } from '../context/TrafficContext';

export const JudgeDemoDrawer = ({ isOpen, onClose }) => {
  const {
    triggerScenario,
    simulationSpeed,
    setSimulationSpeed,
    systemMode,
    emergencyCorridor
  } = useTraffic();

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'rush_hour_surge',
      title: 'Peak Density Surge (Dadar TT - J2)',
      description: 'Injects severe traffic accumulation (235 PCU). Tests Webster algorithm scaling green phase from 30s to 65s.',
      btnText: 'Inject 235 PCU Surge'
    },
    {
      id: 'emergency_ambulance',
      title: 'Emergency Priority Preemption (J1 → J3)',
      description: 'Dispatches Cardiac Life Support Unit along arterial nodes with continuous green-wave locking.',
      btnText: emergencyCorridor.isActive ? 'Preemption In Progress' : 'Dispatch Emergency Unit',
      disabled: emergencyCorridor.isActive
    },
    {
      id: 'sensor_drop_failsafe',
      title: 'Edge Sensor Disconnect / Failsafe (J4)',
      description: 'Simulates camera sensor failure at Andheri WEH to evaluate automatic fallback to Flash Amber mode.',
      btnText: 'Simulate Sensor Disconnect'
    },
    {
      id: 'toggle_adaptive_mode',
      title: 'Algorithm Comparison Toggle',
      description: `Toggles network between PCU-Adaptive AI and legacy pre-timed cycles. Active: ${systemMode.toUpperCase()}`,
      btnText: `Switch to ${systemMode === 'adaptive' ? 'Fixed Cycle' : 'Adaptive AI'}`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0D111A] border-l border-[#1D2638] h-full flex flex-col justify-between overflow-y-auto">

        {/* Header */}
        <div className="p-5 bg-[#090C12] border-b border-[#1D2638] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-[#141A26] border border-[#243046] text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Simulation & Scenario Testbed
              </h3>
              <p className="text-[11px] text-slate-400">
                Evaluation console for automated test cases
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#141A26] hover:bg-[#1D2638] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1">

          {/* Speed Controls */}
          <div className="p-3.5 rounded-lg bg-[#080B10] border border-[#1D2638] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Simulation Rate:</span>
              <span className="font-mono text-cyan-400">
                {simulationSpeed === 0 ? 'PAUSED' : `${simulationSpeed}x Speed`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { speed: 0, label: 'Pause', icon: Pause },
                { speed: 1, label: '1x Real', icon: Play },
                { speed: 2, label: '2x Fast', icon: FastForward },
                { speed: 5, label: '5x Turbo', icon: FastForward }
              ].map(item => (
                <button
                  key={item.speed}
                  onClick={() => setSimulationSpeed(item.speed)}
                  className={`py-1.5 px-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center space-x-1 ${simulationSpeed === item.speed
                      ? 'bg-[#1E2A3F] text-cyan-300 border border-cyan-500/50'
                      : 'bg-[#101520] text-slate-400 hover:text-slate-200 border border-[#1D2638]'
                    }`}
                >
                  <item.icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Scenarios */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Evaluation Test Scenarios
            </span>

            {scenarios.map(sc => (
              <div
                key={sc.id}
                className="p-3.5 rounded-lg bg-[#080B10] border border-[#1D2638] space-y-1.5"
              >
                <h4 className="text-xs font-semibold text-white">
                  {sc.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {sc.description}
                </p>
                <button
                  onClick={() => triggerScenario(sc.id)}
                  disabled={sc.disabled}
                  className={`w-full mt-2 py-1.5 px-3 rounded text-xs font-medium border transition-colors cursor-pointer ${sc.disabled
                      ? 'bg-slate-800 text-slate-500 border-transparent cursor-not-allowed'
                      : 'bg-[#151D2C] hover:bg-[#1E293B] text-slate-200 border-[#2D3A50]'
                    }`}
                >
                  {sc.btnText}
                </button>
              </div>
            ))}
          </div>

          {/* Reset Action */}
          <button
            onClick={() => triggerScenario('reset_all')}
            className="w-full py-2 px-3 rounded-lg bg-[#141A26] hover:bg-[#1C2536] text-slate-300 text-xs font-medium border border-[#243046] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Intersections to Default</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#090C12] border-t border-[#1D2638] text-[11px] text-slate-500 text-center font-mono">
          SIH PS-25050 Evaluation Framework
        </div>

      </div>
    </div>
  );
};
