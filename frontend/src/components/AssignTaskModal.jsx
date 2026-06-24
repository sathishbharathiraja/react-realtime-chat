import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, User, AlignLeft } from 'lucide-react';

export default function AssignTaskModal({ isOpen, onClose, onSubmit, roomUsers, currentUserId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const assignableUsers = roomUsers.filter(u => u._id !== currentUserId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo || !dueDate) return;
    
    // Prevent past dates
    const selectedDate = new Date(dueDate);
    if (selectedDate < new Date()) {
      alert("Due date must be in the future!");
      return;
    }
    
    setLoading(true);
    await onSubmit({ title, description, assignedTo, dueDate });
    setLoading(false);
    
    // Reset
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Assign a Task</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Task Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="E.g., Review Q3 Marketing Deck" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Assign To
            </label>
            <select 
              required
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">Select team member...</option>
              {assignableUsers.map(u => (
                <option key={u._id} value={u._id}>{u.displayName} ({u.email})</option>
              ))}
            </select>
            {assignableUsers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No other members in this group to assign to.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              Due Date & Time
            </label>
            <input 
              type="datetime-local" 
              required
              min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-slate-400" />
              Description (Optional)
            </label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details, links, or instructions..." 
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading || !title.trim() || !assignedTo || !dueDate}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
