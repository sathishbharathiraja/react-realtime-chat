import React from 'react';
import { Mic, Headphones, Users } from 'lucide-react';

export default function CallsView() {
  const huddles = [
    { id: 1, team: 'Project Alpha', active: true, users: ['S', 'M', 'J'] },
    { id: 2, team: 'Design Sync', active: false, users: [] },
    { id: 3, team: 'Engineering Leads', active: true, users: ['D', 'A'] }
  ];

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50">
      <div className="max-w-4xl w-full mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Audio Huddles</h2>
        <p className="text-slate-500 mb-8 font-medium">Drop-in voice channels for zero-friction syncs.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {huddles.map(huddle => (
            <div key={huddle.id} className={`p-6 rounded-3xl border transition-all ${
              huddle.active ? 'bg-white border-indigo-100 shadow-[0_10px_40px_rgba(99,102,241,0.08)]' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${huddle.active ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                  <Headphones className="w-6 h-6" />
                </div>
                {huddle.active && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2">{huddle.team}</h3>
              
              <div className="flex items-center justify-between mt-6">
                <div className="flex -space-x-2">
                  {huddle.users.map((initial, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${
                      huddle.active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {initial}
                    </div>
                  ))}
                  {huddle.users.length === 0 && (
                    <span className="text-sm font-medium text-slate-400">Empty room</span>
                  )}
                </div>
                
                <button className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  huddle.active 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                }`}>
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
