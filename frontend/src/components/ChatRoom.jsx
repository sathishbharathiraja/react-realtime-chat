import React, { useRef, useEffect, useState } from 'react';
import { Send, LogOut, Copy, Check, Paperclip, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
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
      // Create a unique file name
      const ext = file.name.split('.').pop();
      const uniqueFilename = `${crypto.randomUUID()}.${ext}`;
      const storageRef = ref(storage, `uploads/${roomId}/${uniqueFilename}`);

      // Upload file directly to Firebase Storage
      await uploadBytes(storageRef, file);

      // Get the public download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Send message with Firebase Storage URL
      onSendMessage(inputText, downloadUrl);
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
    <div className="flex flex-col w-full max-w-5xl h-[90vh] glass-panel-heavy rounded-2xl overflow-hidden relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      
      {/* Header */}
      <div className="grid grid-cols-3 items-center px-6 py-4 bg-black/40 backdrop-blur-md border-b border-white/5 z-10">
        <div className="flex items-center gap-3 justify-start">
          <div className="bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)] flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-semibold opacity-70">Room</span>
            <span className="font-mono text-sm tracking-wider">{roomId}</span>
          </div>
          <button 
            onClick={handleCopyCode}
            className="p-1.5 text-gray-500 hover:text-cyan-400 bg-white/5 hover:bg-cyan-500/10 rounded-md transition-all duration-300"
            title="Copy Access Code"
          >
            {copied ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="relative flex h-2 w-2">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              {isConnected ? 'Secure Link Active' : 'Offline'}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 truncate max-w-sm font-medium tracking-wide">
            {roomUsers.length > 0 ? roomUsers.map(u => typeof u === 'object' ? u.displayName : u).join(', ') : 'Awaiting connections...'}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button onClick={onLeave} className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all duration-300">
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 px-4 bg-transparent custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="w-16 h-16 mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-2xl opacity-50">⚡</span>
            </div>
            <p className="text-sm font-medium tracking-wide">Secure channel initialized.</p>
            <p className="text-xs opacity-60 mt-1">Share code {roomId} to begin transmission.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 3 * 60 * 1000);

            return (
              <div key={msg.id} data-id={msg.id} ref={el => { if (el && observerRef.current && !isMe && (!msg.readBy || !msg.readBy.includes(user.id))) observerRef.current.observe(el); }} className={!isConsecutive && index > 0 ? 'mt-6' : 'mt-1'}>
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
        const typingText = othersTyping.length === 1 ? `${othersTyping[0]} is transmitting` : othersTyping.length === 2 ? `${othersTyping[0]} and ${othersTyping[1]} are transmitting` : `${othersTyping[0]} and ${othersTyping.length - 1} others are transmitting`;
        return (
          <div className="absolute bottom-[88px] left-8 px-4 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-cyan-400 flex items-center gap-2 z-20 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
            <span>{typingText}</span>
          </div>
        );
      })()}

      {/* Input Area */}
      <div className="p-5 bg-black/40 backdrop-blur-xl border-t border-white/5 relative z-10">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">
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
            className="flex-shrink-0 p-3.5 text-gray-400 bg-white/5 hover:bg-white/10 hover:text-cyan-400 border border-white/10 rounded-xl transition-all duration-300 disabled:opacity-50"
            title="Attach Data"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Initialize transmission..."
            disabled={!isConnected || uploading}
            className="flex-1 px-6 py-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] outline-none transition-all text-[15px]"
          />
          <button
            type="submit"
            disabled={!isConnected || (!inputText.trim() && !uploading)}
            className="flex-shrink-0 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center min-w-[80px] group/send"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5 group-hover/send:translate-x-1 transition-transform" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
