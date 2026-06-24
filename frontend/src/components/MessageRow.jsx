import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageRow({ message, isMe, showSender, currentUserId, roomUsers }) {
  const formattedTime = format(new Date(message.timestamp), 'HH:mm');
  const senderObj = typeof message.senderId === 'object' ? message.senderId : {};
  const senderName = senderObj.displayName || message.senderName || message.sender || 'Unknown';
  const firstLetter = senderName.charAt(0).toUpperCase();

  const isReadByAll = message.readBy?.length >= roomUsers.length && roomUsers.length > 0;
  const isReadBySome = message.readBy?.length > 1;

  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group mb-4`}>
      {!isMe && showSender && (
        <div 
          className="w-8 h-8 rounded-full bg-indigo-50 flex-shrink-0 flex items-center justify-center text-indigo-600 text-xs font-bold mr-3 mt-auto shadow-sm border border-slate-100"
          title={senderName}
        >
          {firstLetter}
        </div>
      )}
      {(!showSender && !isMe) && <div className="w-11"></div>}

      <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && showSender && (
          <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">{senderName}</span>
        )}
        {isMe && showSender && (
          <span className="text-[11px] font-semibold text-slate-500 mb-1 mr-1">You</span>
        )}
        
        <div 
          className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
            isMe 
              ? 'bg-indigo-600 text-white rounded-br-sm' 
              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm mnc-shadow'
          }`}
        >
          {message.mediaUrl && (
            <img 
              src={message.mediaUrl} 
              alt="attachment" 
              className="max-w-full rounded-xl mb-2 cursor-pointer hover:opacity-95 transition-opacity border border-black/5" 
            />
          )}
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words font-medium">{message.text}</p>
        </div>

        <div className={`flex items-center gap-1.5 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] font-medium text-slate-400">{formattedTime}</span>
          {isMe && (
            <span className={isReadByAll ? 'text-indigo-500' : 'text-slate-400'}>
              {isReadByAll ? <CheckCheck className="w-3.5 h-3.5" /> : (isReadBySome ? <CheckCheck className="w-3.5 h-3.5 opacity-50" /> : <Check className="w-3.5 h-3.5" />)}
            </span>
          )}
        </div>
      </div>

      {isMe && showSender && (
        <div 
          className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 text-xs font-bold ml-3 mt-auto shadow-sm"
          title="You"
        >
          {firstLetter}
        </div>
      )}
      {(showSender && !isMe) && <div className="w-11 hidden"></div> /* placeholder adjusted */}
    </div>
  );
}
