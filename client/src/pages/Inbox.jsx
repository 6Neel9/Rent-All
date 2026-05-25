import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axiosInstance from '../api/axiosInstance';
import { Send, MessageSquare, Inbox as InboxIcon, User, RefreshCw } from 'lucide-react';

export default function Inbox() {
  const { user } = useAuth();
  const socket = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messageEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axiosInstance.get('/messages/conversations');
      setConversations(res.data.data);
      
      // Auto-select conversation from query param if provided
      const activeParam = searchParams.get('active');
      if (activeParam) {
        const found = res.data.data.find(c => c.id === activeParam);
        if (found) {
          handleSelectConversation(found);
        }
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setSearchParams({ active: conversation.id });
    setMessagesLoading(true);

    try {
      // 1. Fetch message history
      const res = await axiosInstance.get(`/messages/${conversation.id}`);
      setMessages(res.data.data);

      // 2. Mark thread as read
      await axiosInstance.put(`/messages/conversations/${conversation.id}/read`);
      
      // Update local conversation list read state
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id 
            ? { ...c, messages: c.messages.map(m => m.senderId !== user.id ? { ...m, isRead: true } : m) }
            : c
        )
      );
    } catch (err) {
      console.warn('Failed to load message history:', err.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Socket listener for new messages
  useEffect(() => {
    if (socket) {
      const handleIncomingMessage = (newMsg) => {
        // 1. Check if the message belongs to the current active chat
        if (activeConversation && newMsg.conversationId === activeConversation.id) {
          setMessages((prev) => [...prev, newMsg]);
          
          // Acknowledge read status to server
          axiosInstance.put(`/messages/conversations/${activeConversation.id}/read`).catch(() => {});
        } else {
          // Increment unread status or update threads list
          fetchConversations();
        }
      };

      socket.on('message', handleIncomingMessage);

      return () => {
        socket.off('message', handleIncomingMessage);
      };
    }
  }, [socket, activeConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeConversation) return;

    const messageContent = typedMessage;
    setTypedMessage('');

    try {
      const recipientId = activeConversation.renterId === user.id 
        ? activeConversation.hostId 
        : activeConversation.renterId;

      const res = await axiosInstance.post('/messages', {
        listingId: activeConversation.listingId,
        conversationId: activeConversation.id,
        recipientId,
        content: messageContent
      });

      setMessages((prev) => [...prev, res.data.data]);
    } catch (err) {
      console.warn('Failed to send message:', err.message);
    }
  };

  // Get display name of participant
  const getParticipant = (conversation) => {
    const isRenter = conversation.renterId === user.id;
    return isRenter ? conversation.host : conversation.renter;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden flex h-[75vh]">
        
        {/* Left Panel: Conversation Threads */}
        <div className="w-80 border-r border-slate-100 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800">Inbox</h2>
            <button onClick={fetchConversations} className="text-slate-400 hover:text-primary-600 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <InboxIcon className="h-8 w-8 mx-auto text-slate-300" />
                <p>No messages yet</p>
              </div>
            ) : (
              conversations.map((c) => {
                const partner = getParticipant(c);
                const lastMsg = c.messages?.[c.messages.length - 1];
                const hasUnread = lastMsg && !lastMsg.isRead && lastMsg.senderId !== user.id;
                const isActive = activeConversation?.id === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConversation(c)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-colors ${
                      isActive ? 'bg-primary-50 text-slate-800' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-100 bg-slate-100 shrink-0">
                      {partner?.avatarUrl ? (
                        <img src={partner.avatarUrl} alt={partner.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-primary-600 text-xs">
                          {partner?.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate">{partner?.fullName}</span>
                        {hasUnread && <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5 uppercase tracking-wider">{c.listing?.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-1">{lastMsg?.content || 'Started chat'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Stream */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          {activeConversation ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-100 bg-slate-100">
                  {getParticipant(activeConversation)?.avatarUrl ? (
                    <img src={getParticipant(activeConversation).avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-primary-600 text-xs">
                      {getParticipant(activeConversation)?.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{getParticipant(activeConversation)?.fullName}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Item: {activeConversation.listing?.title}</p>
                </div>
              </div>

              {/* Message History list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary-600 border-t-transparent"></div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = m.senderId === user.id;

                    return (
                      <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                          isSelf 
                            ? 'bg-primary-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                        }`}>
                          <p>{m.content}</p>
                          <span className={`block text-[9px] mt-1 text-right ${isSelf ? 'text-primary-200' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Chat Input panel */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white shadow hover:bg-primary-700 active:scale-95 transition-all"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-16 w-16 text-slate-200 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No active conversation</h3>
              <p className="text-xs text-slate-400 mt-1">Select a conversation thread from the list to start messaging.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
