import React, { useRef, useEffect, useState } from 'react';
import { Send, LogOut, Copy, Check, Paperclip, MessageSquare } from 'lucide-react';
import MessageRow from './MessageRow';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function ChatRoom({ roomId, user, messages, typingUsers, roomUsers = [], onSendMessage, onTyping, onMarkAsRead, isConnected, onLeave }) {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Intersection Observer for Read Receipts
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const msgId = entry.target.getAttribute('data-id');
          if (msgId) {
            const msg = messages.find(m => m.id === msgId);
            // If the message exists and we haven't read it yet
            if (msg && (!msg.readBy || !msg.readBy.includes(user.id))) {
              onMarkAsRead(msgId);
            }
          }
        }
      });
    }, { threshold: 0.5 });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [messages, user.id, onMarkAsRead]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() || uploading) {
      if (!uploading) {
        onSendMessage(inputText);
        setInputText('');
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();

      // Send message with local upload URL
      onSendMessage(inputText, data.url);
      setInputText('');
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-indigo-700">
            <div className="p-1.5 bg-indigo-600 rounded-md text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">CorpChat</span>
          </div>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500 uppercase">Room:</span>
            <span className="font-mono text-sm font-bold text-gray-900 tracking-wider">{roomId}</span>
          </div>
          <button 
            onClick={handleCopyCode}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Copy Access Code"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end justify-center">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="relative flex h-2 w-2">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
            </div>
            <div className="text-xs text-gray-400 truncate max-w-xs font-medium">
              {roomUsers.length > 0 ? roomUsers.map(u => typeof u === 'object' ? u.displayName : u).join(', ') : 'Waiting for others...'}
            </div>
          </div>
          
          <button onClick={onLeave} className="flex items-center justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Leave Room">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 px-8 bg-white custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Welcome to the chat!</p>
            <p className="text-xs mt-1">Share the code {roomId} to invite others.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 3 * 60 * 1000);

            return (
              <div key={msg.id} data-id={msg.id} ref={el => { if (el && observerRef.current && !isMe && (!msg.readBy || !msg.readBy.includes(user.id))) observerRef.current.observe(el); }} className={!isConsecutive && index > 0 ? 'mt-4' : 'mt-1'}>
                <MessageRow message={msg} isMe={isMe} showSender={!isConsecutive} currentUserId={user.id} roomUsers={roomUsers} />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {(() => {
        const othersTyping = typingUsers.filter(u => u !== user.displayName);
        if (othersTyping.length === 0) return null;
        const typingText = othersTyping.length === 1 ? `${othersTyping[0]} is typing...` : othersTyping.length === 2 ? `${othersTyping[0]} and ${othersTyping[1]} are typing...` : `${othersTyping[0]} and ${othersTyping.length - 1} others are typing...`;
        return (
          <div className="absolute bottom-[88px] left-8 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-500 shadow-sm flex items-center gap-2 z-20 animate-fade-in">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
            <span>{typingText}</span>
          </div>
        );
      })()}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-6xl mx-auto w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || uploading}
            className="flex-shrink-0 p-3 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 rounded-xl transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={!isConnected || uploading}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-[15px]"
          />
          <button
            type="submit"
            disabled={!isConnected || (!inputText.trim() && !uploading)}
            className="flex-shrink-0 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
