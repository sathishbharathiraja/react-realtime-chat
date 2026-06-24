import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function ActivityView({ token }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingIds, setResolvingIds] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${backendUrl}/api/activity`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const handleResolve = async (id) => {
    setResolvingIds(prev => [...prev, id]);
    
    try {
      await fetch(`${backendUrl}/api/activity/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => {
        setActivities(prev => prev.filter(a => a._id !== id));
        setResolvingIds(prev => prev.filter(rId => rId !== id));
      }, 300);
    } catch (err) {
      console.error(err);
      setResolvingIds(prev => prev.filter(rId => rId !== id));
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'urgent': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'mention': return <span className="text-indigo-500 font-bold text-lg">@</span>;
      case 'task': return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center bg-slate-50/50"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50 h-full overflow-hidden">
      <div className="max-w-3xl w-full mx-auto flex flex-col h-full">
        <div className="mb-8 shrink-0">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Action Inbox</h2>
          <p className="text-slate-500 font-medium">Clear out your mentions, tasks, and urgent pings.</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 space-y-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <CheckCircle2 className="w-16 h-16 mb-4 text-green-400" />
              <p className="text-lg font-bold text-slate-600">Inbox Zero!</p>
              <p>You're all caught up.</p>
            </div>
          ) : (
            activities.map(item => (
              <div 
                key={item._id} 
                className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 transition-all duration-300 ${resolvingIds.includes(item._id) ? 'opacity-0 scale-95 translate-x-8' : 'opacity-100'}`}
              >
                <div className="mt-1">
                  {item.senderId?.avatarUrl ? (
                    <img src={item.senderId.avatarUrl} className="w-10 h-10 rounded-xl" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                      {item.senderId?.displayName?.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.senderId?.displayName}</span>
                      <span className="text-xs font-medium text-slate-400">in {item.conversationId?.name || 'Direct Message'}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  </div>
                  
                  <p className="text-slate-600 mb-4">{item.text}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm font-medium">
                      {getIcon(item.type)}
                      <span className="capitalize text-slate-600">{item.type}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleResolve(item._id)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
