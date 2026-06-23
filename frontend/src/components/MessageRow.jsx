import React from 'react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageRow({ message, isMe, showSender, currentUserId, roomUsers }) {
  const formattedTime = format(new Date(message.timestamp), 'HH:mm');
  const senderName = message.senderName || message.sender || 'Unknown';
  const firstLetter = senderName.charAt(0).toUpperCase();

  // Calculate read status for 'isMe' messages
  let readStatus = null; // null | 'sent' | 'read'
  if (isMe) {
    readStatus = 'sent';
    // If readBy contains someone other than the sender
    if (message.readBy && message.readBy.some(id => id !== currentUserId)) {
      readStatus = 'read';
    }
  }

  return (
    <div className="w-full flex px-6 py-1 hover:bg-white/5 transition-colors group/row">
      <div className="flex-shrink-0 mr-4 mt-0.5">
        {showSender ? (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            {firstLetter}
          </div>
        ) : (
          <div className="w-9 h-9"></div>
        )}
      </div>

      <div className={clsx(
        "flex-1 max-w-3xl relative",
        isMe ? "bg-gradient-to-br from-cyan-600/90 to-blue-700/90 backdrop-blur-md rounded-2xl rounded-bl-sm px-5 py-3 -ml-4 shadow-[0_4px_20px_rgba(6,182,212,0.15)] border border-white/10 text-white" : "py-0.5"
      )}>
        {showSender && (
          <div className="flex items-baseline gap-3 mb-1.5">
            <span className="text-[13px] font-bold text-gray-200 tracking-wide">{senderName}</span>
            <span className="text-[10px] text-gray-500 font-mono tracking-widest">{formattedTime}</span>
          </div>
        )}
        
        {message.mediaUrl && (
          <div className="mb-3">
            {message.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
              <img src={message.mediaUrl} alt="attachment" className="max-w-sm rounded-xl border border-white/10 shadow-lg object-cover" />
            ) : (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-black/60 transition-colors border border-white/5 text-sm font-medium">
                View Secured Data
              </a>
            )}
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          <div className={clsx(
            "text-[15px] leading-relaxed whitespace-pre-wrap break-words tracking-wide",
            isMe ? "text-white" : "text-gray-300"
          )}>
            {message.text}
          </div>
          
          {isMe && (
            <div className="flex-shrink-0 mb-0.5 ml-2" title={readStatus === 'read' ? 'Read' : 'Delivered'}>
              {readStatus === 'read' ? (
                <CheckCheck className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.8)]" />
              ) : (
                <Check className="w-4 h-4 text-white/50" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
