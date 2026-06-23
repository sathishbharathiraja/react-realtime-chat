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
    <div className="w-full flex px-6 py-1 hover:bg-gray-50/50 transition-colors">
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {showSender ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-indigo-500">
            {firstLetter}
          </div>
        ) : (
          <div className="w-8 h-8"></div>
        )}
      </div>

      <div className={clsx(
        "flex-1 max-w-3xl",
        isMe && "bg-blue-50/50 rounded-r-lg rounded-bl-lg px-4 py-2 -ml-4",
        !isMe && "py-0.5"
      )}>
        {showSender && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">{senderName}</span>
            <span className="text-xs text-gray-400">{formattedTime}</span>
          </div>
        )}
        
        {message.mediaUrl && (
          <div className="mb-2">
            {message.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
              <img src={message.mediaUrl} alt="attachment" className="max-w-sm rounded-md border border-gray-200" />
            ) : (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                View Attachment
              </a>
            )}
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </div>
          
          {isMe && (
            <div className="flex-shrink-0 text-gray-400 mb-0.5" title={readStatus === 'read' ? 'Read' : 'Delivered'}>
              {readStatus === 'read' ? (
                <CheckCheck className="w-4 h-4 text-blue-500" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
