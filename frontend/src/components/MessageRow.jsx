import React from 'react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function MessageRow({ message, isMe, showSender }) {
  const formattedTime = format(new Date(message.timestamp), 'HH:mm');
  const firstLetter = message.sender.charAt(0).toUpperCase();

  return (
    <div className="w-full flex px-6 py-1 hover:bg-gray-50/50 transition-colors">
      {/* Avatar or Spacer */}
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {showSender ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-indigo-500">
            {firstLetter}
          </div>
        ) : (
          <div className="w-8 h-8"></div>
        )}
      </div>

      {/* Message Content Area */}
      <div className={clsx(
        "flex-1 max-w-3xl",
        isMe && "bg-blue-50/50 rounded-r-lg rounded-bl-lg px-4 py-2 -ml-4",
        !isMe && "py-0.5"
      )}>
        {showSender && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">{message.sender}</span>
            <span className="text-xs text-gray-400">{formattedTime}</span>
          </div>
        )}
        
        <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </div>
      </div>
    </div>
  );
}
