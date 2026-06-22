import React, { useRef, useEffect, useState } from 'react';
import { Send, LogOut, Copy, Check, Users } from 'lucide-react';
import MessageRow from './MessageRow';

export default function ChatRoom({ roomId, displayName, messages, typingUsers, roomUsers = [], onSendMessage, onTyping, isConnected, onLeave }) {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    // Emit typing true
    onTyping(true);

    // Debounce to stop typing after 2 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
      
      // Stop typing immediately when sent
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl h-[90vh] bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="grid grid-cols-3 items-center px-6 py-3 border-b border-gray-200 bg-white shadow-sm z-10">
        {/* Left: Room ID */}
        <div className="flex items-center gap-2 justify-start">
          <h2 className="text-sm font-bold text-gray-900">Room: {roomId}</h2>
          <button 
            onClick={handleCopyCode}
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
            title="Copy Room ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        
        {/* Center: Presence Roster */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-xs text-gray-600 truncate max-w-sm font-medium mt-0.5">
            {roomUsers.length > 0 
              ? roomUsers.map(u => typeof u === 'object' ? u.name : u).join(', ') 
              : 'Just you'}
          </div>
        </div>
        
        {/* Right: Leave Button */}
        <div className="flex justify-end">
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto py-6 bg-white px-2">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No messages yet. Share the code {roomId} to invite others!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === displayName;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            
            // Group messages if they are from the same sender and within 3 minutes
            const isConsecutive = prevMsg && 
              prevMsg.sender === msg.sender &&
              (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 3 * 60 * 1000);

            return (
              <div key={msg.id} className={!isConsecutive && index > 0 ? 'mt-6' : 'mt-1'}>
                <MessageRow 
                  message={msg} 
                  isMe={isMe} 
                  showSender={!isConsecutive} 
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {(() => {
        const othersTyping = typingUsers.filter(u => u !== displayName);
        if (othersTyping.length === 0) return null;

        let typingText = '';
        if (othersTyping.length === 1) {
          typingText = `${othersTyping[0]} is typing...`;
        } else if (othersTyping.length === 2) {
          typingText = `${othersTyping[0]} and ${othersTyping[1]} are typing...`;
        } else {
          typingText = `${othersTyping[0]} and ${othersTyping.length - 1} others are typing...`;
        }

        return (
          <div className="px-6 py-2 bg-white text-xs text-gray-500 italic flex items-center gap-1.5">
            <span>{typingText}</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        );
      })()}

      {/* Input Area */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Message the room..."
            disabled={!isConnected}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-[15px]"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputText.trim()}
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
