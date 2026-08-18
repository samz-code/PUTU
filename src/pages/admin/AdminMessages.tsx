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
  AlertTriangle
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

  // State: Custom Confirmation Modals (Replacing Native Browser Confirm)
  const [confirmDeleteMessageId, setConfirmDeleteMessageId] = useState<string | null>(null);
  const [confirmDeleteThreadUserId, setConfirmDeleteThreadUserId] = useState<string | null>(null);

  // State: CRUD Modal to Start a New Thread / Customer Search
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

  // READ: Fetch unique customer conversation threads
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
        if (threadList.length > 0 && !selectedUserId) {
          setSelectedUserId(threadList[0].user_id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customer conversations.');
    } finally {
      setLoadingThreads(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // READ & SUBSCRIBE: Fetch active thread messages
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

  // CREATE: Send Reply
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

  // CREATE: Open New Thread
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
      setSelectedUserId(newChatUserId);
    }
    setStartingChat(false);
  };

  // UPDATE: Edit Message
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

  // DELETE: Confirmed Message Delete
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

  // DELETE: Confirmed Thread Delete
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 text-[#332219]">
      <PageHeader
        title="Concierge Live Chat Desk"
        subtitle="Manage, edit, delete, and initiate live customer inquiries and concierge messages"
      />

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] flex items-center justify-between text-xs sm:text-sm shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-semibold text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Admin Messaging Layout */}
      <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-2xs grid grid-cols-1 md:grid-cols-12 h-[75vh] max-h-[750px] overflow-hidden">
        
        {/* Left Sidebar: Threads List */}
        <div className="md:col-span-4 border-r border-[#EBE5DF] flex flex-col bg-[#FAF8F5]/60 h-full">
          <div className="p-3.5 border-b border-[#EBE5DF] space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-[#332219]">Conversations</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleOpenNewChatModal}
                  className="p-1.5 bg-[#0F766E] text-white rounded-lg hover:bg-[#0d645e] transition-colors flex items-center gap-1 text-xs px-2 font-medium shadow-2xs"
                  title="Start New Thread"
                >
                  <Plus size={14} />
                  <span>New Chat</span>
                </button>
                <button
                  onClick={fetchThreads}
                  className="p-1.5 text-slate-400 hover:text-[#0F766E] hover:bg-white rounded-lg transition-colors"
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
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#EBE5DF] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#0F766E]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F5F0EB]">
            {loadingThreads ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#0F766E]" />
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
                        ? 'bg-white border-l-4 border-l-[#F55361] shadow-2xs'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedUserId(thread.user_id)}
                      className="w-full p-3.5 text-left flex items-start gap-3 min-w-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0">
                        {thread.full_name ? thread.full_name.charAt(0).toUpperCase() : <User size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <p className="text-xs font-bold text-[#332219] truncate">
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
                      className="opacity-0 group-hover:opacity-100 p-1.5 mr-2 text-slate-400 hover:text-[#F55361] hover:bg-[#FEE2E2] rounded-lg transition-all"
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
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <MessageSquare size={36} className="mb-2 text-[#0F766E]" />
              <p className="font-semibold text-sm text-[#332219]">No conversation selected</p>
              <p className="text-xs max-w-xs mt-1">Select a customer thread or start a new chat to manage messages.</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b border-[#F5F0EB] bg-[#FAF8F5] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center font-bold text-sm">
                    {activeThread?.full_name ? activeThread.full_name.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#332219]">
                      {activeThread?.full_name || activeThread?.email || `Customer ${selectedUserId.slice(0, 8)}`}
                    </h3>
                    <p className="text-[11px] text-slate-400">User ID: {selectedUserId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDeleteThreadUserId(selectedUserId)}
                    className="text-xs border border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium"
                  >
                    <Trash2 size={12} />
                    <span>Delete Thread</span>
                  </button>
                  <span className="text-xs bg-[#E6F4F1] text-[#0F766E] px-2.5 py-1 rounded-full font-medium">
                    Active Chat
                  </span>
                </div>
              </div>

              {/* Chat Bubble List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAF8F5]/30">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 size={18} className="animate-spin text-[#0F766E]" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <MessageSquare size={28} className="text-slate-300" />
                    <p className="font-semibold text-[#332219] text-sm">No messages in this chat</p>
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
                        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%] relative">
                          {!isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center text-xs shrink-0 mb-1 shadow-2xs">
                              <User size={14} />
                            </div>
                          )}

                          {isEditing ? (
                            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#F55361] shadow-md w-full">
                              <input
                                type="text"
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs text-[#332219] focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateMessage(m.id)}
                                disabled={isLoading}
                                className="p-1 text-[#0F766E] hover:bg-[#E6F4F1] rounded-lg transition-colors"
                                title="Save Changes"
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
                              className={`relative p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isAdmin
                                  ? 'bg-[#0F766E] text-white rounded-br-xs shadow-2xs'
                                  : 'bg-white text-[#332219] border border-[#EBE5DF] rounded-bl-xs shadow-2xs'
                              }`}
                            >
                              {m.body}
                            </div>
                          )}

                          {isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-xs shrink-0 mb-1 shadow-2xs">
                              <ShieldCheck size={14} />
                            </div>
                          )}

                          {/* Message Level Controls */}
                          {isAdmin && !isEditing && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-2xs border border-[#EBE5DF] rounded-lg p-1 shadow-2xs">
                              <button
                                onClick={() => {
                                  setEditingId(m.id);
                                  setEditInput(m.body);
                                }}
                                className="p-1 text-slate-500 hover:text-[#0F766E] hover:bg-[#E6F4F1] rounded-md transition-colors"
                                title="Edit Message"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteMessageId(m.id)}
                                disabled={isLoading}
                                className="p-1 text-slate-500 hover:text-[#F55361] hover:bg-[#FEE2E2] rounded-md transition-colors disabled:opacity-50"
                                title="Delete Message"
                              >
                                {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
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
              <form onSubmit={handleSend} className="border-t border-[#EBE5DF] p-3 bg-white flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 bg-[#FAF8F5] border border-[#EBE5DF] rounded-xl text-xs sm:text-sm text-[#332219] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition-all"
                  placeholder="Type an admin reply..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="bg-[#0F766E] hover:bg-[#0d645e] text-white px-4 sm:px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0 shadow-2xs"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Reply</span>
                      <Send size={15} />
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#EBE5DF] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#F55361] flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#332219]">Delete Entire Conversation?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete all messages for this customer? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteThreadUserId(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-[#EBE5DF] hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteThread}
                className="flex-1 px-4 py-2 text-xs font-semibold bg-[#F55361] hover:bg-[#e04351] text-white rounded-xl transition-colors shadow-2xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Custom Delete Single Message Confirmation */}
      {confirmDeleteMessageId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#EBE5DF] space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#F55361] flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#332219]">Delete Message?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This message will be permanently deleted from the thread.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteMessageId(null)}
                className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-[#EBE5DF] hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteMessage}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-[#F55361] hover:bg-[#e04351] text-white rounded-xl transition-colors shadow-2xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Start New Customer Conversation */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#EBE5DF]">
            <div className="flex items-center justify-between border-b border-[#F5F0EB] pb-3">
              <h3 className="font-serif font-bold text-base text-[#332219]">Start New Customer Thread</h3>
              <button
                onClick={() => setIsNewChatOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartNewThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#332219] mb-1">Select Customer</label>
                {loadingCustomers ? (
                  <div className="p-3 text-xs text-slate-400 flex items-center gap-2 border rounded-xl">
                    <Loader2 size={14} className="animate-spin text-[#0F766E]" />
                    <span>Loading customers...</span>
                  </div>
                ) : (
                  <select
                    value={newChatUserId}
                    onChange={(e) => setNewChatUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EBE5DF] rounded-xl focus:ring-1 focus:ring-[#0F766E] focus:outline-hidden"
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
                <label className="block text-xs font-bold text-[#332219] mb-1">Initial Concierge Message</label>
                <textarea
                  rows={3}
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Welcome! How can our concierge desk assist you today?"
                  required
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EBE5DF] rounded-xl focus:ring-1 focus:ring-[#0F766E] focus:outline-hidden"
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
                  className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#0d645e] text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs"
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