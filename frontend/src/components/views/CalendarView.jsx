import React, { useState, useEffect } from 'react';
import { Calendar, Video, Clock, Loader2 } from 'lucide-react';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function CalendarView({ token }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${backendUrl}/api/calendar`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-slate-50/50"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-slate-100">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Daily Briefing</h2>
            <p className="text-slate-500 font-medium">Your schedule for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-500">
              No meetings scheduled for today.
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 justify-between items-center relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-3xl"></div>
                
                <div className="flex-1 pl-4">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 font-bold text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {event.time}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {event.attendees.map((att, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600" title={att}>
                          {att.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-500 ml-2">
                      {event.attendees.length} Attendees
                    </span>
                  </div>
                </div>

                <a 
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    event.platform === 'meet' 
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Join {event.platform === 'meet' ? 'Google Meet' : 'Zoom'}
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
