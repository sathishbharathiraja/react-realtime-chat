import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

function FormattedText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\_.*?\_)/g);
  return (
    <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words font-medium">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export default function MessageRow({ message, isMe, showSender, currentUserId, roomUsers }) {
  const formattedTime = format(new Date(message.timestamp), 'HH:mm');
  const senderObj = typeof message.senderId === 'object' ? message.senderId : {};
  const senderName = senderObj.alias || senderObj.displayName || message.senderName || message.sender || 'Unknown';
  const firstLetter = senderName.charAt(0).toUpperCase();

  // Correct isMe calculation by checking Firebase uid vs Mongo's populated senderId.uid
  const actuallyMe = senderObj.uid === currentUserId || isMe;

  const isReadByAll = message.readBy?.length >= roomUsers.length && roomUsers.length > 0;
  const isReadBySome = message.readBy?.length > 1;

  return (
    <div className={`flex w-full ${actuallyMe ? 'justify-end' : 'justify-start'} group mb-4`}>
      {!actuallyMe && showSender && (
        <div 
          className="w-8 h-8 rounded-full bg-indigo-50 flex-shrink-0 flex items-center justify-center text-indigo-600 text-xs font-bold mr-3 mt-auto shadow-sm border border-slate-100"
          title={senderName}
        >
          {firstLetter}
        </div>
      )}
      {(!showSender && !actuallyMe) && <div className="w-11"></div>}

      <div className={`flex flex-col max-w-[70%] ${actuallyMe ? 'items-end' : 'items-start'}`}>
        {!actuallyMe && showSender && (
          <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">{senderName}</span>
        )}
        {actuallyMe && showSender && (
          <span className="text-[11px] font-semibold text-slate-500 mb-1 mr-1">You</span>
        )}
        
        <div 
          className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
            actuallyMe 
              ? 'bg-indigo-600 text-white rounded-br-sm' 
              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm mnc-shadow'
          }`}
        >
          {message.mediaUrl && (
            <img 
              src={message.mediaUrl.startsWith('/') ? `${backendUrl}${message.mediaUrl}` : message.mediaUrl} 
              alt="attachment" 
              className="max-w-[240px] max-h-[240px] rounded-xl object-contain cursor-pointer mb-2 border border-slate-100"
              loading="lazy"
            />
          )}
          <FormattedText text={message.text} />
        </div>

        <div className={`flex items-center gap-1.5 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${actuallyMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] font-medium text-slate-400">{formattedTime}</span>
          {actuallyMe && (
            <span className={isReadByAll ? 'text-indigo-500' : 'text-slate-400'}>
              {isReadByAll ? <CheckCheck className="w-3.5 h-3.5" /> : (isReadBySome ? <CheckCheck className="w-3.5 h-3.5 opacity-50" /> : <Check className="w-3.5 h-3.5" />)}
            </span>
          )}
        </div>
      </div>

      {actuallyMe && showSender && (
        <div 
          className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 text-xs font-bold ml-3 mt-auto shadow-sm"
          title="You"
        >
          {firstLetter}
        </div>
      )}
      {(showSender && !actuallyMe) && <div className="w-11 hidden"></div> /* placeholder adjusted */}
    </div>
  );
}
