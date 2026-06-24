import React, { useState, useEffect } from 'react';
import { Moon, BellOff, LogOut, Loader2 } from 'lucide-react';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function SettingsView({ user, onLogout, token }) {
  const [quietHours, setQuietHours] = useState(false);
  const [muteAll, setMuteAll] = useState(false);
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${backendUrl}/api/users/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setQuietHours(data.quietHours || false);
        setMuteAll(data.muteAll || false);
        setAlias(data.alias || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const updateSetting = async (key, value) => {
    const payload = {
      quietHours: key === 'quietHours' ? value : quietHours,
      muteAll: key === 'muteAll' ? value : muteAll
    };
    
    if (key === 'quietHours') setQuietHours(value);
    if (key === 'muteAll') setMuteAll(value);

    try {
      await fetch(`${backendUrl}/api/users/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to update setting', err);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-slate-50/50"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 bg-slate-50/50">
      <div className="max-w-3xl w-full mx-auto">
        
        <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-200">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold shadow-sm overflow-hidden">
            {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user?.displayName?.charAt(0).toUpperCase()}
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
              onClick={() => updateSetting('quietHours', !quietHours)}
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
              onClick={() => updateSetting('muteAll', !muteAll)}
              className={`w-12 h-6 rounded-full transition-colors relative ${muteAll ? 'bg-green-500' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${muteAll ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-6">Account & Profile</h3>
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
            <label className="font-bold text-slate-800">Chat Alias</label>
            <p className="text-sm text-slate-500 font-medium">Set a custom nickname that will appear above your chat bubbles.</p>
            <div className="flex gap-3 mt-1">
              <input 
                type="text" 
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="e.g. Maverick"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
              />
              <button 
                onClick={() => updateSetting('alias', alias)}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>

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
