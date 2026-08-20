import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Send, 
  AlertCircle, 
  Loader2, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  Search,
  RefreshCw,
  Plus,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Message {
  id: string;
  user_id: string;
  sender_role: 'customer' | 'admin' | 'concierge';
  body: string;
  created_at: string;
  updated_at?: string;
}

interface CustomerThread {
  user_id: string;
  email?: string;
  full_name?: string;
  last_message?: string;
  last_message_at?: string;
}

interface CustomerProfile {
  id: string;
  full_name?: string;
  email?: string;
}

export default function AdminMessages() {
  const { user } = useAuth();
  
  // State: Threads & Active Customer
  const [threads, setThreads] = useState<CustomerThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  
  // State: Conversation Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State: CRUD Edit & Delete for Individual Messages
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // State: Custom Confirmation Modals
  const [confirmDeleteMessageId, setConfirmDeleteMessageId] = useState<string | null>(null);
  const [confirmDeleteThreadUserId, setConfirmDeleteThreadUserId] = useState<string | null>(null);

  // State: Start New Thread Modal
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState<CustomerProfile[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [newChatUserId, setNewChatUserId] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [startingChat, setStartingChat] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch customer conversation threads
  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const { data: msgData, error: msgErr } = await supabase
        .from('messages')
        .select('user_id, body, created_at')
        .order('created_at', { ascending: false });

      if (msgErr) throw msgErr;

      if (msgData) {
        const threadMap = new Map<string, CustomerThread>();
        
        msgData.forEach((msg) => {
          if (!threadMap.has(msg.user_id)) {
            threadMap.set(msg.user_id, {
              user_id: msg.user_id,
              last_message: msg.body,
              last_message_at: msg.created_at,
            });
          }
        });

        const threadList = Array.from(threadMap.values());
        const userIds = threadList.map((t) => t.user_id);

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);

          if (profiles) {
            const profileMap = new Map(profiles.map((p) => [p.id, p]));
            threadList.forEach((t) => {
              const prof = profileMap.get(t.user_id);
              if (prof) {
                t.full_name = prof.full_name;
                t.email = prof.email;
              }
            });
          }
        }

        setThreads(threadList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customer conversations.');
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Subscribe to active thread messages
  useEffect(() => {
    if (!selectedUserId) return;

    setLoadingMessages(true);

    supabase
      .from('messages')
      .select('*')
      .eq('user_id', selectedUserId)
      .order('created_at', { ascending: true })
      .then(({ data, error: fetchErr }) => {
        if (fetchErr) setError('Unable to load message thread.');
        else setMessages((data as Message[]) ?? []);
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      });

    const channel = supabase
      .channel(`admin_chat:${selectedUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${selectedUserId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `user_id=eq.${selectedUserId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? (payload.new as Message) : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `user_id=eq.${selectedUserId}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUserId, scrollToBottom]);

  const handleSelectThread = (userId: string) => {
    setSelectedUserId(userId);
    setMobileShowChat(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !input.trim() || sending) return;

    setSending(true);
    setError(null);
    const body = input.trim();
    setInput('');

    const { error: sendErr } = await supabase.from('messages').insert({
      user_id: selectedUserId,
      sender_role: 'admin',
      body,
    });

    if (sendErr) {
      setError('Failed to send response. Please try again.');
      setInput(body);
    } else {
      setThreads((prev) =>
        prev.map((t) =>
          t.user_id === selectedUserId
            ? { ...t, last_message: body, last_message_at: new Date().toISOString() }
            : t
        )
      );
    }
    setSending(false);
  };

  const handleOpenNewChatModal = async () => {
    setIsNewChatOpen(true);
    setLoadingCustomers(true);
    try {
      const { data, error: custErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });

      if (custErr) throw custErr;
      setAllCustomers((data as CustomerProfile[]) || []);
    } catch (err: any) {
      setError('Could not fetch registered customer list.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleStartNewThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatUserId || !newChatMessage.trim() || startingChat) return;

    setStartingChat(true);
    setError(null);
    const body = newChatMessage.trim();

    const { error: insertErr } = await supabase.from('messages').insert({
      user_id: newChatUserId,
      sender_role: 'admin',
      body,
    });

    if (insertErr) {
      setError('Failed to start new thread: ' + insertErr.message);
    } else {
      setIsNewChatOpen(false);
      setNewChatUserId('');
      setNewChatMessage('');
      await fetchThreads();
      handleSelectThread(newChatUserId);
    }
    setStartingChat(false);
  };

  const handleUpdateMessage = async (id: string) => {
    if (!editInput.trim()) return;

    try {
      setActionLoadingId(id);
      setError(null);

      const { error: updateErr } = await supabase
        .from('messages')
        .update({ body: editInput.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateErr) throw updateErr;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, body: editInput.trim() } : m))
      );
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update message.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeDeleteMessage = async () => {
    if (!confirmDeleteMessageId) return;
    const id = confirmDeleteMessageId;
    setConfirmDeleteMessageId(null);

    try {
      setActionLoadingId(id);
      setError(null);

      const { error: deleteErr } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;

      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete message.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeDeleteThread = async () => {
    if (!confirmDeleteThreadUserId) return;
    const userId = confirmDeleteThreadUserId;
    setConfirmDeleteThreadUserId(null);

    try {
      setError(null);
      const { error: deleteThreadErr } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', userId);

      if (deleteThreadErr) throw deleteThreadErr;

      setThreads((prev) => prev.filter((t) => t.user_id !== userId));
      if (selectedUserId === userId) {
        setSelectedUserId(null);
        setMessages([]);
        setMobileShowChat(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete thread.');
    }
  };

  const activeThread = threads.find((t) => t.user_id === selectedUserId);

  const filteredThreads = threads.filter(
    (t) =>
      t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full space-y-4 text-slate-800">
      <PageHeader
        title="Concierge Live Chat Desk"
        subtitle="Manage, edit, delete, and initiate live customer inquiries and concierge messages"
      />

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-semibold text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Admin Messaging Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row h-[calc(100vh-220px)] min-h-[500px] max-h-[800px] overflow-hidden">
        
        {/* Left Sidebar: Threads List */}
        <div 
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 h-full shrink-0 ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 border-b border-slate-200 space-y-2.5 shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Conversations</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleOpenNewChatModal}
                  className="p-1.5 bg-[#17b5b1] text-white rounded-lg hover:bg-[#109491] transition-colors flex items-center gap-1 text-xs px-2.5 font-semibold shadow-xs"
                  title="Start New Thread"
                >
                  <Plus size={14} />
                  <span>New Chat</span>
                </button>
                <button
                  onClick={fetchThreads}
                  className="p-1.5 text-slate-400 hover:text-[#17b5b1] hover:bg-slate-100 rounded-lg transition-colors"
                  title="Refresh threads"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#17b5b1] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingThreads ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#17b5b1]" />
                <span>Loading chats...</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No customer conversations found.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.user_id === selectedUserId;
                return (
                  <div
                    key={thread.user_id}
                    className={`group relative flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-white border-l-4 border-l-[#f26b5e] shadow-xs'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectThread(thread.user_id)}
                      className="w-full p-3.5 text-left flex items-start gap-3 min-w-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-teal-50 text-[#17b5b1] flex items-center justify-center font-bold text-xs shrink-0 border border-teal-100">
                        {thread.full_name ? thread.full_name.charAt(0).toUpperCase() : <User size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {thread.full_name || thread.email || `Customer ${thread.user_id.slice(0, 6)}`}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatTime(thread.last_message_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{thread.last_message || 'No messages'}</p>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteThreadUserId(thread.user_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 mr-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
                      title="Delete Conversation Thread"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Conversation */}
        <div 
          className={`flex-1 flex flex-col h-full bg-white min-w-0 ${
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <MessageSquare size={40} className="mb-3 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">No conversation selected</p>
              <p className="text-xs max-w-xs mt-1">Select a customer thread or start a new chat to manage messages.</p>
            </div>
          ) : (
            <>
              {/* Active Header */}
              <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                    title="Back to threads"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-teal-50 text-[#17b5b1] flex items-center justify-center font-bold text-sm shrink-0 border border-teal-100">
                    {activeThread?.full_name ? activeThread.full_name.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {activeThread?.full_name || activeThread?.email || `Customer ${selectedUserId.slice(0, 8)}`}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">ID: {selectedUserId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setConfirmDeleteThreadUserId(selectedUserId)}
                    className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                  >
                    <Trash2 size={12} />
                    <span className="hidden sm:inline">Delete Thread</span>
                  </button>
                </div>
              </div>

              {/* Chat Bubble List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 size={18} className="animate-spin text-[#17b5b1]" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <MessageSquare size={32} className="text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No messages in this chat</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.sender_role === 'admin' || m.sender_role === 'concierge';
                    const isEditing = editingId === m.id;
                    const isLoading = actionLoadingId === m.id;

                    return (
                      <div
                        key={m.id}
                        className={`group flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-end gap-2 max-w-[88%] sm:max-w-[75%] relative">
                          {!isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-teal-50 text-[#17b5b1] flex items-center justify-center text-xs shrink-0 mb-1 border border-teal-100">
                              <User size={13} />
                            </div>
                          )}

                          {isEditing ? (
                            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#f26b5e] shadow-md w-full">
                              <input
                                type="text"
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="flex-1 px-3 py-1 text-xs text-slate-800 focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateMessage(m.id)}
                                disabled={isLoading}
                                className="p-1 text-[#17b5b1] hover:bg-teal-50 rounded-lg transition-colors"
                                title="Save"
                              >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`relative p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isAdmin
                                  ? 'bg-[#17b5b1] text-white rounded-br-xs shadow-xs'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                              }`}
                            >
                              <span>{m.body}</span>

                              {/* Hover Action Controls */}
                              {isAdmin && !isEditing && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 absolute -top-3 right-2 bg-white border border-slate-200 rounded-md p-0.5 shadow-md z-10">
                                  <button
                                    onClick={() => {
                                      setEditingId(m.id);
                                      setEditInput(m.body);
                                    }}
                                    className="p-1 text-slate-500 hover:text-[#17b5b1] hover:bg-teal-50 rounded-xs transition-colors"
                                    title="Edit Message"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteMessageId(m.id)}
                                    disabled={isLoading}
                                    className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xs transition-colors disabled:opacity-50"
                                    title="Delete Message"
                                  >
                                    {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-[#17b5b1] text-white flex items-center justify-center text-xs shrink-0 mb-1 shadow-xs">
                              <ShieldCheck size={13} />
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 px-9">
                          {formatTime(m.created_at)}
                          {m.updated_at && <span className="ml-1 italic">(edited)</span>}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSend} className="border-t border-slate-200 p-3 bg-white flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#17b5b1] focus:bg-white transition-all"
                  placeholder="Type an admin reply..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="bg-[#17b5b1] hover:bg-[#109491] text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0 shadow-xs"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Reply</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* MODAL 1: Custom Delete Thread Confirmation */}
      {confirmDeleteThreadUserId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Delete Entire Conversation?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete all messages for this customer? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteThreadUserId(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteThread}
                className="flex-1 px-4 py-2 text-xs font-semibold bg-[#f26b5e] hover:bg-[#d95346] text-white rounded-xl transition-colors shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Custom Delete Single Message Confirmation */}
      {confirmDeleteMessageId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Delete Message?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This message will be permanently deleted from the thread.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteMessageId(null)}
                className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteMessage}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-[#f26b5e] hover:bg-[#d95346] text-white rounded-xl transition-colors shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Start New Customer Conversation */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Start New Customer Thread</h3>
              <button
                onClick={() => setIsNewChatOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartNewThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Customer</label>
                {loadingCustomers ? (
                  <div className="p-2.5 text-xs text-slate-400 flex items-center gap-2 border border-slate-200 rounded-xl">
                    <Loader2 size={14} className="animate-spin text-[#17b5b1]" />
                    <span>Loading customers...</span>
                  </div>
                ) : (
                  <select
                    value={newChatUserId}
                    onChange={(e) => setNewChatUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#17b5b1] focus:bg-white focus:outline-hidden"
                  >
                    <option value="">-- Choose a customer --</option>
                    {allCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.full_name || cust.email || cust.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Concierge Message</label>
                <textarea
                  rows={3}
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Welcome! How can our concierge desk assist you today?"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#17b5b1] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startingChat || !newChatUserId || !newChatMessage.trim()}
                  className="px-4 py-2 text-xs font-bold bg-[#17b5b1] hover:bg-[#109491] text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {startingChat && <Loader2 size={14} className="animate-spin" />}
                  <span>Start Conversation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}