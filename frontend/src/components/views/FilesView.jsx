import React from 'react';
import { Image as ImageIcon, FileText, Download } from 'lucide-react';

export default function FilesView() {
  const files = [
    { id: 1, name: 'Q3_Report.pdf', type: 'doc', sender: 'Sarah C.', project: 'Alpha', size: '2.4 MB' },
    { id: 2, name: 'Hero_Banner.png', type: 'img', sender: 'Design Team', project: 'Website Redesign', size: '4.1 MB' },
    { id: 3, name: 'API_Specs.docx', type: 'doc', sender: 'Backend Lead', project: 'Alpha', size: '1.1 MB' },
    { id: 4, name: 'Logo_Final.svg', type: 'img', sender: 'Design Team', project: 'Branding', size: '0.8 MB' }
  ];

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50 h-full overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        
        <div className="flex justify-between items-end mb-8 shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Smart Asset Hub</h2>
            <p className="text-slate-500 font-medium">All attachments from all your projects, auto-organized.</p>
          </div>
          
          <div className="flex gap-4">
            <select className="bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl px-4 py-2 outline-none focus:border-indigo-500 shadow-sm">
              <option>All Projects</option>
              <option>Project Alpha</option>
              <option>Website Redesign</option>
            </select>
            <select className="bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl px-4 py-2 outline-none focus:border-indigo-500 shadow-sm">
              <option>All Senders</option>
              <option>Sarah C.</option>
              <option>Design Team</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map(file => (
              <div key={file.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="aspect-square bg-slate-50 flex items-center justify-center relative">
                  {file.type === 'img' ? (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  ) : (
                    <FileText className="w-12 h-12 text-slate-300" />
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform shadow-lg">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm truncate mb-1" title={file.name}>{file.name}</h4>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                    <span className="truncate">{file.sender}</span>
                    <span>{file.size}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
