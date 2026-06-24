import React, { useState } from 'react';
import { Moon, BellOff, Shield, LogOut } from 'lucide-react';

export default function SettingsView({ user, onLogout }) {
  const [quietHours, setQuietHours] = useState(false);
  const [muteAll, setMuteAll] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50">
      <div className="max-w-3xl w-full mx-auto">
        
        <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-200">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold shadow-sm">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{user?.displayName}</h2>
            <p className="text-slate-500 font-medium mt-1">{user?.email}</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-6">Focus Controls</h3>
        <div className="space-y-4 mb-10">
          
          <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Quiet Hours</h4>
                <p className="text-sm text-slate-500 font-medium">Automatically mute notifications from 6 PM to 8 AM.</p>
              </div>
            </div>
            <button 
              onClick={() => setQuietHours(!quietHours)}
              className={`w-12 h-6 rounded-full transition-colors relative ${quietHours ? 'bg-green-500' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${quietHours ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                <BellOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Mute All Notifications</h4>
                <p className="text-sm text-slate-500 font-medium">Pause all desktop and sound alerts temporarily.</p>
              </div>
            </div>
            <button 
              onClick={() => setMuteAll(!muteAll)}
              className={`w-12 h-6 rounded-full transition-colors relative ${muteAll ? 'bg-green-500' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${muteAll ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-6">Account</h3>
        <div className="space-y-4">
          <button onClick={onLogout} className="w-full flex items-center justify-between p-5 bg-white hover:bg-red-50 rounded-2xl border border-slate-100 hover:border-red-100 transition-colors group">
            <div className="flex items-center gap-4 text-red-500">
              <LogOut className="w-5 h-5" />
              <span className="font-bold">Sign Out</span>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
