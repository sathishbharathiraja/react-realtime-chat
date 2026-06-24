import React from 'react';
import { Calendar, Video, Clock } from 'lucide-react';

export default function CalendarView() {
  const meetings = [
    { id: 1, title: 'Daily Standup', time: '10:00 AM - 10:30 AM', attendees: 8, hasLink: true, linkType: 'Google Meet' },
    { id: 2, title: 'Design Review: Q3 Assets', time: '1:00 PM - 2:00 PM', attendees: 3, hasLink: true, linkType: 'Zoom' },
    { id: 3, title: '1:1 with Manager', time: '3:30 PM - 4:00 PM', attendees: 2, hasLink: false }
  ];

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50">
      <div className="max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Daily Briefing</h2>
            <p className="text-slate-500 font-medium">Your schedule for today.</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Today</span>
            <span className="text-2xl font-bold text-indigo-600">October 24</span>
          </div>
        </div>

        <div className="space-y-4">
          {meetings.map(meeting => (
            <div key={meeting.id} className="flex bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
              {/* Time Block */}
              <div className="w-48 bg-slate-50 p-6 flex flex-col justify-center border-r border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 font-bold mb-1">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  {meeting.time.split(' - ')[0]}
                </div>
                <div className="text-xs text-slate-400 font-medium ml-6">
                  to {meeting.time.split(' - ')[1]}
                </div>
              </div>

              {/* Details Block */}
              <div className="flex-1 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{meeting.title}</h3>
                  <p className="text-sm text-slate-500 font-medium">{meeting.attendees} attendees</p>
                </div>
                
                {meeting.hasLink && (
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-sm shadow-indigo-200">
                    <Video className="w-4 h-4" />
                    Join {meeting.linkType}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
