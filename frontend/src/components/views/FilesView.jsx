import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, FileText, Download, Loader2 } from 'lucide-react';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function FilesView({ token }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('all');
  const [senderFilter, setSenderFilter] = useState('all');

  useEffect(() => {
    if (!token) return;
    fetch(`${backendUrl}/api/files`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFiles(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  // Extract unique senders and projects for filters
  const uniqueSenders = [...new Set(files.map(f => f.senderId?.displayName))].filter(Boolean);
  const uniqueProjects = [...new Set(files.map(f => f.conversationId?.isGroup ? f.conversationId.name : 'Direct Messages'))];

  const filteredFiles = files.filter(f => {
    const senderMatch = senderFilter === 'all' || f.senderId?.displayName === senderFilter;
    const projName = f.conversationId?.isGroup ? f.conversationId.name : 'Direct Messages';
    const projectMatch = projectFilter === 'all' || projName === projectFilter;
    return senderMatch && projectMatch;
  });

  const getFileExtension = (url) => url.split('.').pop().toLowerCase();
  const isImage = (url) => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(getFileExtension(url));
  const getFileName = (url) => url.split('/').pop();

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-slate-50/50"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50 h-full overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        
        <div className="flex justify-between items-end mb-8 shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Smart Asset Hub</h2>
            <p className="text-slate-500 font-medium">All attachments from all your projects, auto-organized.</p>
          </div>
          
          <div className="flex gap-4">
            <select 
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl px-4 py-2 outline-none focus:border-indigo-500 shadow-sm"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select 
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl px-4 py-2 outline-none focus:border-indigo-500 shadow-sm"
            >
              <option value="all">All Senders</option>
              {uniqueSenders.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText className="w-16 h-16 mb-4 text-slate-300" />
              <p>No files found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFiles.map(file => {
                const img = isImage(file.mediaUrl);
                const name = getFileName(file.mediaUrl);
                const senderName = file.senderId?.displayName || 'Unknown';

                return (
                  <div key={file._id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden">
                      {img ? (
                        <img src={file.mediaUrl} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-12 h-12 text-slate-300" />
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <a href={file.mediaUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform shadow-lg">
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100">
                      <h4 className="font-bold text-slate-800 text-sm truncate mb-1" title={name}>{name}</h4>
                      <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                        <span className="truncate">{senderName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
