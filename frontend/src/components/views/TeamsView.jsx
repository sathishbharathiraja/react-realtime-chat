import React from 'react';
import { Pin, Link as LinkIcon, Clock } from 'lucide-react';

export default function TeamsView() {
  return (
    <div className="flex-1 flex h-full bg-white overflow-hidden">
      
      {/* Left Column: Placeholder for Real-Time Chat Engine */}
      <div className="flex-1 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Project Alpha</h2>
          <p className="text-sm text-slate-500 font-medium">8 Members • Marketing Campaign</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
          [ Real-Time Chat Engine Mounts Here ]
        </div>
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="w-full h-12 bg-slate-100 rounded-xl flex items-center px-4 text-slate-400 font-medium text-sm">
            Type a message to the team...
          </div>
        </div>
      </div>

      {/* Right Column: Persistent Pin Board */}
      <div className="w-80 bg-white flex flex-col overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Pin className="w-5 h-5 text-indigo-500" /> Pin Board
          </h3>
        </div>

        <div className="p-6 space-y-8">
          {/* Project Status */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Current Status</h4>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Blocked</span>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">Waiting on final copy approval from Legal before we can launch the ad set.</p>
            </div>
          </div>

          {/* Important Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Resources</h4>
            <div className="space-y-2">
              <a href="#" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all group">
                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">Figma Designs</div>
                  <div className="text-[11px] text-slate-400 font-medium">figma.com/file/123</div>
                </div>
              </a>
            </div>
          </div>

          {/* Deadlines */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming Deadlines</h4>
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
              <Clock className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-sm font-bold text-slate-800">Legal Approval</div>
                <div className="text-xs text-red-600 font-semibold">Today, 5:00 PM</div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
