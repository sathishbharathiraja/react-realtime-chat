import React, { useState, useEffect } from 'react';
import { Calendar, Video, Clock, Loader2, CheckCircle, ClipboardList, User, Plus } from 'lucide-react';
import AssignTaskModal from '../AssignTaskModal';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function CalendarView({ token }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (!token) return;
    
    // Fetch Calendar Events
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

    // Fetch All Users for assignment dropdown
    fetch(`${backendUrl}/api/users/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAllUsers(data))
      .catch(err => console.error(err));
      
  }, [token]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-slate-50/50"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await fetch(`${backendUrl}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== taskId));
      }
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-slate-100">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Daily Briefing</h2>
              <p className="text-slate-500 font-medium">Your schedule for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAssignTaskOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            Assign Task
          </button>
        </div>

        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-500">
              No meetings or tasks scheduled for today.
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 justify-between items-center relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl ${event.type === 'task' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                
                <div className="flex-1 pl-4">
                  <div className={`flex items-center gap-3 mb-2 font-bold text-sm ${event.type === 'task' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {event.type === 'task' ? <ClipboardList className="w-4 h-4" /> : <Clock className="w-4 h-4 text-slate-400" />}
                    {event.time}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{event.title}</h3>
                  
                  {event.type === 'task' ? (
                    <div className="flex flex-col gap-1">
                      {event.description && <p className="text-sm text-slate-600 mb-2">{event.description}</p>}
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <User className="w-4 h-4 text-slate-400" />
                        {event.direction === 'outgoing' 
                          ? `Assigned to ${event.assignee}` 
                          : `Assigned by ${event.assigner}`}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {event.attendees?.map((a, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {a[0]}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-slate-500 font-medium">{event.attendees?.length || 0} Attendees</span>
                    </div>
                  )}
                </div>

                {event.type === 'task' ? (
                  <button 
                    onClick={() => handleCompleteTask(event.id)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-semibold"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {event.direction === 'outgoing' ? 'Mark Done (Manager)' : 'Complete Task'}
                  </button>
                ) : (
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
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <AssignTaskModal 
        isOpen={isAssignTaskOpen} 
        onClose={() => setIsAssignTaskOpen(false)} 
        roomUsers={allUsers} 
        currentUserId={null}
        onSubmit={async (taskData) => {
          try {
            const res = await fetch(`${backendUrl}/api/tasks`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({ ...taskData })
            });
            if (res.ok) {
              const newTask = await res.json();
              // If we assigned it to ourselves, add it to the calendar immediately
              // But normally we're assigning it to others. We could refresh or just show a success message.
              alert(`Task assigned to ${allUsers.find(u => u._id === taskData.assignedTo)?.displayName}!`);
            }
          } catch (err) {
            console.error('Failed to assign task:', err);
          }
        }}
      />
    </div>
  );
}
