import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, AtSign, ListTodo } from 'lucide-react';

export default function ActivityView() {
  const [activities, setActivities] = useState([
    { id: 1, type: 'urgent', text: 'Server outage reported in production.', sender: 'DevOps Alert', time: '10 mins ago' },
    { id: 2, type: 'mention', text: 'Can you review the Q3 marketing assets?', sender: 'Sarah Connor', time: '1 hour ago' },
    { id: 3, type: 'task', text: 'Update the staging environment.', sender: 'Tech Lead', time: '2 hours ago' }
  ]);

  const handleResolve = (id) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'mention': return <AtSign className="w-5 h-5 text-indigo-500" />;
      case 'task': return <ListTodo className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50">
      <div className="max-w-4xl w-full mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Action Inbox</h2>
        <p className="text-slate-500 mb-8 font-medium">Clear out your actionable items to maintain inbox zero.</p>
        
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Inbox Zero!</h3>
            <p className="text-slate-500 mt-2">You have no pending urgent actions or mentions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div className={`p-3 rounded-xl ${
                  activity.type === 'urgent' ? 'bg-red-50' : 
                  activity.type === 'mention' ? 'bg-indigo-50' : 'bg-amber-50'
                }`}>
                  {getIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-slate-800">{activity.sender}</span>
                    <span className="text-xs text-slate-400 font-medium">{activity.time}</span>
                  </div>
                  <p className="text-slate-600 font-medium truncate">{activity.text}</p>
                </div>
                
                <button 
                  onClick={() => handleResolve(activity.id)}
                  className="px-4 py-2 bg-slate-50 hover:bg-green-50 text-slate-600 hover:text-green-600 rounded-xl font-semibold text-sm transition-colors border border-slate-200 hover:border-green-200"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
