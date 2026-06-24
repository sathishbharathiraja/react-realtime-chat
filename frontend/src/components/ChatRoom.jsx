import React, { useRef, useEffect, useState } from 'react';
import { Send, LogOut, Copy, Check, Paperclip, MessageSquare, Video, Phone, Users, Type, Smile, PlusCircle } from 'lucide-react';
import MessageRow from './MessageRow';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function ChatRoom({ roomId, title, user, messages, typingUsers, roomUsers = [], onSendMessage, onTyping, onMarkAsRead, onStartCall, isConnected, onLeave }) {
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
      <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 z-10 shrink-0 h-14">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {(title || roomId).charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-[15px] text-gray-900 tracking-tight">{title || `Room: ${roomId}`}</span>
              <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                <span>Chat</span>
                <span>•</span>
                <span>{roomUsers.length} Members</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-semibold text-gray-500 h-full mt-2">
            <div className="border-b-2 border-[#464eb8] text-[#464eb8] pb-3 px-1 cursor-pointer">Chat</div>
            <div className="pb-3 px-1 hover:text-gray-700 cursor-pointer">Files</div>
            <div className="pb-3 px-1 hover:text-gray-700 cursor-pointer">+</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 mr-2">
            {roomUsers.slice(0,3).map((u, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                {(typeof u === 'object' ? u.displayName : u).charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 text-gray-400">
            <Video className="w-5 h-5 cursor-pointer hover:text-gray-700" onClick={() => onStartCall(roomId, true)} />
            <Phone className="w-4 h-4 cursor-pointer hover:text-gray-700" onClick={() => onStartCall(roomId, false)} />
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button onClick={onLeave} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors" title="Leave">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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
            const isMe = msg.senderId?._id === user.id || msg.senderId === user.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isConsecutive = prevMsg && (prevMsg.senderId?._id || prevMsg.senderId) === (msg.senderId?._id || msg.senderId) && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 3 * 60 * 1000);

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

      {/* Input Area (Teams Style Composer) */}
      <div className="p-4 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col max-w-6xl mx-auto w-full border border-gray-300 rounded-md shadow-sm focus-within:border-[#464eb8] transition-colors bg-white">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a new message"
            disabled={!isConnected || uploading}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="flex-1 px-4 py-3 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:ring-0 outline-none resize-none text-[15px] min-h-[44px]"
          />
          
          <div className="flex items-center justify-between px-2 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-md">
            <div className="flex items-center gap-1 text-gray-500">
              <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Format"><Type className="w-4 h-4" /></button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Attach file"><Paperclip className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Emoji"><Smile className="w-4 h-4" /></button>
            </div>
            <button
              type="submit"
              disabled={!isConnected || (!inputText.trim() && !uploading)}
              className="flex-shrink-0 p-1.5 bg-[#464eb8] text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center"
              title="Send (Enter)"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
