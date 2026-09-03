/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, ArrowDown, Filter } from 'lucide-react';
import { EventLogItem } from '../types';

interface EventLogProps {
  logs: EventLogItem[];
  onClearLogs: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'warning' | 'plan' | 'info'>('all');
  const [autoScroll, setAutoScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      // Local element scroll only - strictly avoids window.scroll / scrollIntoView
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'warning') return l.type === 'warning' || l.type === 'error';
    if (filter === 'plan') return l.type === 'plan' || l.type === 'success';
    return l.type === 'info';
  });

  const getLogStyle = (type: EventLogItem['type']) => {
    switch (type) {
      case 'warning':
      case 'error':
        return 'text-red-300 bg-red-950/20 border-l-2 border-red-500';
      case 'plan':
        return 'text-cyan-300 bg-cyan-950/20 border-l-2 border-cyan-500';
      case 'success':
        return 'text-green-300 bg-green-950/20 border-l-2 border-green-500 font-semibold';
      case 'info':
      default:
        return 'text-gray-300 border-l-2 border-[#333]';
    }
  };

  return (
    <div id="event-log-container" className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Autonomous System Event Log</h3>
            <p className="text-[10px] text-gray-500 font-mono">Chronological Telemetry, Actuator & Planner Traces</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-Scroll Toggle Button */}
          <button
            id="btn-toggle-autoscroll"
            onClick={() => setAutoScroll((prev) => !prev)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              autoScroll
                ? 'bg-green-950/40 text-green-400 border-green-500/40'
                : 'bg-[#111] text-gray-400 hover:text-gray-200 border-[#262626]'
            }`}
            title="Toggle terminal inner auto-scroll (never shifts the browser viewport)"
          >
            <ArrowDown className={`w-3 h-3 ${autoScroll ? 'text-green-400 animate-bounce' : 'text-gray-500'}`} />
            <span>AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex items-center gap-1 bg-[#050505] p-1 rounded border border-[#222] text-[10px] font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded uppercase tracking-wider font-bold transition-colors ${filter === 'all' ? 'bg-green-600 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-2 py-0.5 rounded uppercase tracking-wider font-bold transition-colors ${filter === 'warning' ? 'bg-red-600 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Alerts
            </button>
            <button
              onClick={() => setFilter('plan')}
              className={`px-2 py-0.5 rounded uppercase tracking-wider font-bold transition-colors ${filter === 'plan' ? 'bg-cyan-600 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Planner
            </button>
          </div>

          <button
            onClick={onClearLogs}
            className="p-1.5 rounded bg-[#0D0D0D] hover:bg-[#1A1A1A] border border-[#222] text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={containerRef}
        className="bg-black rounded border border-[#262626] p-2.5 h-44 overflow-y-auto font-mono text-xs flex flex-col gap-1.5 shadow-inner"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-600 italic text-center py-6 text-xs font-mono">No events logged for current filter</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`px-2 py-1 rounded text-[11px] leading-relaxed transition-all ${getLogStyle(log.type)}`}>
              <span className="text-gray-600 mr-2">[{log.timestamp}]</span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
