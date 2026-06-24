import React, { useRef, useEffect, useState } from 'react';
import { Send, LogOut, Copy, Check, Paperclip, MessageSquare, Video, Phone, Users, Type, Smile, PlusCircle, Search, Loader2, Info, ClipboardList } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import MessageRow from './MessageRow';
import AssignTaskModal from './AssignTaskModal';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function ChatRoom({ roomId, title, user, messages, typingUsers, roomUsers = [], conversation, token, onSendMessage, onTyping, onMarkAsRead, onStartCall, isConnected, onLeave, onConversationUpdated }) {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  
  // Group Info Panel State
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const isGroup = conversation?.isGroup;
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Handle typing status
  useEffect(() => {
    if (inputText) {
      if (!typingTimeoutRef.current) {
        onTyping(true);
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 1000);
    }
  }, [inputText, onTyping]);

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      if (!uploading && inputText.trim()) {
        onSendMessage(inputText);
        setInputText('');
      }
      onTyping(false);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
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

  const onEmojiClick = (emojiObject) => {
    setInputText(prev => prev + emojiObject.emoji);
  };

  const handleFormatText = () => {
    const input = inputRef.current;
    if (!input) return;
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selectedText = inputText.substring(start, end);
    
    if (selectedText) {
      const before = inputText.substring(0, start);
      const after = inputText.substring(end);
      // Toggle bold if already bold, else make bold
      if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
        setInputText(before + selectedText.slice(2, -2) + after);
      } else {
        setInputText(before + `**${selectedText}**` + after);
      }
    } else {
      setInputText(prev => prev + '**bold text**');
    }
    input.focus();
  };

  const handleCallClick = (isVideo) => {
    if (onStartCall) {
      onStartCall(roomId, isVideo);
    } else {
      alert('1-to-1 WebRTC Calls module is not fully initialized. Please use the Calls tab for team huddles.');
    }
  };

  const handleSearchUsers = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`${backendUrl}/api/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (targetUserId) => {
    if (!conversation) return;
    try {
      const res = await fetch(`${backendUrl}/api/conversations/${conversation._id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        setSearchQuery('');
        setSearchResults([]);
        if (onConversationUpdated) onConversationUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full w-full bg-white relative rounded-r-[24px] overflow-hidden">
      
      {/* Main Chat Column */}
      <div className="flex flex-col h-full flex-1 min-w-0 bg-white">
        {/* Header */}
        <div 
          className={`h-[72px] bg-white/80 backdrop-blur-md flex items-center justify-between px-6 border-b border-slate-100 z-10 sticky top-0 shrink-0 ${isGroup ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
          onClick={() => isGroup && setShowGroupInfo(!showGroupInfo)}
        >
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex shrink-0 items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">
                {(title || roomId).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-[15px] text-slate-800 tracking-tight truncate block">{title || `Room: ${roomId}`}</span>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                  <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="truncate">{isConnected ? 'Connected' : 'Reconnecting...'}</span>
                  {roomUsers.length > 2 && (
                    <>
                      <span className="text-slate-300 shrink-0">•</span>
                      <span className="truncate">{roomUsers.length} Members</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button 
              onClick={() => handleCallClick(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all shadow-sm"
              title="Video Call"
            >
              <Video className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleCallClick(false)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all shadow-sm"
              title="Voice Call"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <button onClick={onLeave} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Leave">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
              <MessageSquare className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId?.uid === user.id || msg.senderId === user.id;
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
      <div className="p-4 bg-white shrink-0 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 mb-2 z-50" ref={emojiPickerRef}>
            <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col max-w-6xl mx-auto w-full border border-gray-300 rounded-md shadow-sm focus-within:border-[#464eb8] transition-colors bg-white">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />
          <textarea
            ref={inputRef}
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
              <button type="button" onClick={handleFormatText} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Format Text (Bold)"><Type className="w-4 h-4" /></button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Attach file"><Paperclip className="w-4 h-4" /></button>
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Emoji"><Smile className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <button type="button" onClick={() => setIsAssignTaskOpen(true)} className="p-1.5 hover:bg-indigo-50 rounded text-indigo-600 flex items-center gap-1 transition-colors" title="Assign Task">
                <ClipboardList className="w-4 h-4" />
                <span className="text-xs font-semibold">Assign</span>
              </button>
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

      {/* Right Sidebar: WhatsApp Style Group Info Panel */}
      {showGroupInfo && isGroup && (
        <div className="w-80 bg-white flex-shrink-0 flex flex-col h-full border-l border-slate-100 z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
          <div className="h-[72px] border-b border-slate-100 flex items-center px-6 shrink-0 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-500" /> Group Info
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-white">
            
            {/* Add Member Component */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Participant</h4>
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchUsers}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium placeholder-slate-400 text-sm"
                  placeholder="Search to add..."
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                  </div>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm mb-4">
                  {searchResults.map(u => {
                    const isAlreadyMember = roomUsers.some(p => p._id === u._id);
                    return (
                      <div key={u._id} className="flex items-center justify-between p-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shadow-sm shrink-0 text-xs">
                            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-full object-cover" /> : (u.alias || u.displayName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate">{u.alias || u.displayName}</div>
                            <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                          </div>
                        </div>
                        {isAlreadyMember ? (
                          <span className="text-[10px] font-bold text-slate-400 px-2 shrink-0">Joined</span>
                        ) : (
                          <button 
                            onClick={() => handleAddMember(u._id)}
                            className="text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors shrink-0"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Member List */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Group Members ({roomUsers.length})</h4>
              <div className="space-y-2">
                {roomUsers.map(p => (
                  <div key={p._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shadow-sm shrink-0 text-sm border border-slate-200">
                      {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full rounded-full object-cover" /> : (p.alias || p.displayName || p.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                        {p.alias || p.displayName}
                        {p.email === user.email && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                      </div>
                      <div className="text-xs text-slate-500 font-medium truncate">{p.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      <AssignTaskModal 
        isOpen={isAssignTaskOpen} 
        onClose={() => setIsAssignTaskOpen(false)} 
        roomUsers={roomUsers} 
        currentUserId={user.id}
        onSubmit={async (taskData) => {
          try {
            const res = await fetch(`${backendUrl}/api/tasks`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({ ...taskData, conversationId: id })
            });
            if (res.ok) {
              const assignedUser = roomUsers.find(u => u._id === taskData.assignedTo);
              // Send an automated message saying a task was assigned
              socket.emit('sendMessage', {
                conversationId: id,
                text: `📝 **Assigned Task:** "${taskData.title}" to @${assignedUser?.displayName || 'user'}`,
                sender: user.id
              });
            }
          } catch (err) {
            console.error('Failed to assign task:', err);
          }
        }}
      />
    </div>
  );
}
