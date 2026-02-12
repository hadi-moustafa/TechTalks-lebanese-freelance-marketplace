'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Search,
    Send,
    Paperclip,
    MoreVertical,
    Phone,
    Video,
    Smile,
    Check,
    CheckCheck,
    ArrowLeft,
    MessageCircle,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useChat } from '@/hooks/useChat';
import { ChatRoom, Message } from '@/lib/types';

export default function ChatPage() {
    const {
        chatRooms,
        messages,
        selectedRoomId,
        setSelectedRoomId,
        isLoadingRooms,
        isLoadingMessages,
        currentUser,
        sendMessage
    } = useChat();

    const [newMessage, setNewMessage] = useState('');
    const [isMobileListVisible, setIsMobileListVisible] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleMobileView = () => {
        setIsMobileListVisible(!isMobileListVisible);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        await sendMessage(newMessage);
        setNewMessage('');
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const selectedRoom = chatRooms.find(r => r.id === selectedRoomId);

    // Helper to get the other person in the chat
    const getContact = (room: ChatRoom) => {
        if (room.client_id === currentUser) {
            return room.freelancer;
        }
        return room.client;
    };

    return (
        <div className="h-[calc(100vh-theme(spacing.24))] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex">
            {/* Sidebar - Chat List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-gray-50/50 ${selectedRoomId && !isMobileListVisible ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                    <div className="bg-lebanon-red/10 text-lebanon-red text-xs font-bold px-2 py-1 rounded-full">
                        {chatRooms.reduce((acc, room) => acc + (room.unread_count || 0), 0)} New
                    </div>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-lira-green-1k focus:border-lira-green-1k outline-none text-sm transition-all shadow-sm"
                        />
                        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {isLoadingRooms ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-lebanon-green" size={24} />
                        </div>
                    ) : chatRooms.length === 0 ? (
                        <div className="text-center p-4 text-gray-500">No conversations yet.</div>
                    ) : (
                        chatRooms.map((room) => {
                            const contact = getContact(room);
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => {
                                        setSelectedRoomId(room.id);
                                        setIsMobileListVisible(false);
                                    }}
                                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${selectedRoomId === room.id
                                        ? 'bg-white shadow-md ring-1 ring-gray-100'
                                        : 'hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                            {contact?.profile_pic ? (
                                                <img src={contact.profile_pic} alt={contact.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-lira-green-1k text-lebanon-green font-bold text-lg">
                                                    {contact?.username?.[0] || '?'}
                                                </div>
                                            )}
                                        </div>
                                        {/* Online status would need real-time presense which is a bit more complex, omitting for now or keeping static/mocked if needed, but removed purely to be accurate to data */}
                                    </div>

                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`font-bold truncate ${room.unread_count && room.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {contact?.username || 'Unknown User'}
                                            </h3>
                                            <span className={`text-xs ${room.unread_count && room.unread_count > 0 ? 'text-lebanon-green font-bold' : 'text-gray-400'}`}>
                                                {room.last_message && format(new Date(room.last_message.sent_at), 'HH:mm')}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${room.unread_count && room.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                            {room.last_message?.sender_id === currentUser && <span className="text-gray-400 font-normal">You: </span>}
                                            {room.last_message?.message_text || 'No messages yet'}
                                        </p>
                                        {room.service?.title && (
                                            <p className="text-xs text-lebanon-green mt-1 truncate bg-lira-green-1k/50 px-2 py-0.5 rounded-md inline-block">
                                                {room.service.title}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {selectedRoom ? (
                <div className={`flex-1 flex flex-col bg-[#FDFDFD] ${!isMobileListVisible ? 'flex' : 'hidden md:flex'}`}>
                    {/* Chat Header */}
                    <div className="h-16 px-6 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileListVisible(true)} className="md:hidden text-gray-500 hover:text-gray-900">
                                <ArrowLeft size={24} />
                            </button>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    {getContact(selectedRoom)?.profile_pic ? (
                                        <img src={getContact(selectedRoom)?.profile_pic || ''} alt={getContact(selectedRoom)?.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-lira-green-1k text-lebanon-green font-bold">
                                            {getContact(selectedRoom)?.username?.[0] || '?'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{getContact(selectedRoom)?.username}</h3>
                                {/* Online status placeholder */}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-gray-400">
                            <button className="hover:text-lebanon-green hover:bg-lira-green-1k p-2 rounded-full transition-colors"><Phone size={20} /></button>
                            <button className="hover:text-lebanon-green hover:bg-lira-green-1k p-2 rounded-full transition-colors"><Video size={20} /></button>
                            <button className="hover:text-gray-600 p-2 rounded-full"><MoreVertical size={20} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                        {/* Date Divider */}
                        {/* <div className="flex justify-center">
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Today</span>
                        </div> */}
                        {isLoadingMessages ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="animate-spin text-lebanon-green" size={24} />
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.sender_id === currentUser;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div
                                                className={`px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe
                                                    ? 'bg-lebanon-green text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                    }`}
                                            >
                                                {msg.message_text}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                <span className="text-[10px] text-gray-400">
                                                    {format(new Date(msg.sent_at), 'HH:mm')}
                                                </span>
                                                {isMe && (
                                                    <span className={msg.is_read ? 'text-lebanon-green' : 'text-gray-300'}>
                                                        {msg.is_read ? <CheckCheck size={14} /> : <Check size={14} />}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <form onSubmit={handleSendMessage} className="flex gap-4 items-end">
                            <button type="button" className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                <Paperclip size={20} />
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-lebanon-green/20 focus:border-lebanon-green outline-none transition-all resize-none"
                                />
                                <button type="button" className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                    <Smile size={20} />
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-3 bg-lebanon-green text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-lebanon-green shadow-sm shadow-emerald-200 transition-all transform active:scale-95"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-8 hidden md:flex">
                    <div className="w-24 h-24 bg-lira-green-1k rounded-full flex items-center justify-center mb-6">
                        <MessageCircle size={48} className="text-lebanon-green" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Conversation</h3>
                    <p className="text-gray-500 max-w-sm">
                        Choose a chat from the sidebar to start communicating with your clients.
                    </p>
                </div>
            )}
        </div>
    );
}
