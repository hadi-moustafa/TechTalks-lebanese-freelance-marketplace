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
import Link from 'next/link';

export default function ClientChatPage() {
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
    const [searchQuery, setSearchQuery] = useState('');
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

    const filteredRooms = chatRooms.filter(room => {
        if (!searchQuery) return true;
        const contact = getContact(room);
        return contact?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/client" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex bg-white max-w-7xl w-full mx-auto shadow-sm">
                {/* Sidebar - Chat List */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-gray-50/50 ${selectedRoomId && !isMobileListVisible ? 'hidden md:flex' : 'flex'}`}>

                    {/* Search */}
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search chats..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all text-gray-900 font-medium placeholder-gray-500"
                            />
                            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {isLoadingRooms ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="animate-spin text-blue-500" size={24} />
                            </div>
                        ) : filteredRooms.length === 0 ? (
                            <div className="text-center p-4 text-gray-500 mt-10">
                                {searchQuery ? 'No conversations found.' : 'No conversations yet. Contact a freelancer from a service page to start chatting.'}
                            </div>
                        ) : (
                            filteredRooms.map((room) => {
                                const contact = getContact(room);
                                return (
                                    <button
                                        key={room.id}
                                        onClick={() => {
                                            setSelectedRoomId(room.id);
                                            setIsMobileListVisible(false);
                                        }}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${selectedRoomId === room.id
                                            ? 'bg-blue-50 shadow-md ring-1 ring-blue-100'
                                            : 'hover:bg-white hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-blue-700 bg-blue-100 font-bold text-lg">
                                                {contact?.profile_pic ? (
                                                    <img src={contact.profile_pic} alt={contact.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    contact?.username?.[0] || '?'
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className={`font-bold truncate ${room.unread_count && room.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {contact?.username || 'Unknown User'}
                                                </h3>
                                                <span className={`text-xs ${room.unread_count && room.unread_count > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                                    {room.last_message && format(new Date(room.last_message.sent_at), 'HH:mm')}
                                                </span>
                                            </div>
                                            <p className={`text-sm truncate ${room.unread_count && room.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                                {room.last_message?.sender_id === currentUser && <span className="text-gray-400 font-normal">You: </span>}
                                                {room.last_message?.message_text || 'No messages yet'}
                                            </p>
                                            {room.service?.title && (
                                                <p className="text-xs text-blue-600 mt-1 truncate bg-blue-50 px-2 py-0.5 rounded-md inline-block">
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
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex justify-center items-center font-bold overflow-hidden">
                                        {getContact(selectedRoom)?.profile_pic ? (
                                            <img src={getContact(selectedRoom)?.profile_pic || ''} alt={getContact(selectedRoom)?.username} className="w-full h-full object-cover" />
                                        ) : (
                                            getContact(selectedRoom)?.username?.[0] || '?'
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{getContact(selectedRoom)?.username}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-400">
                                <button className="hover:text-gray-600 p-2 rounded-full"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                            {isLoadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin text-blue-500" size={24} />
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                                <div
                                                    className={`px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe
                                                        ? 'bg-blue-600 text-white rounded-br-none'
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
                                                        <span className={msg.is_read ? 'text-blue-500' : 'text-gray-300'}>
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
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none text-gray-900 font-medium placeholder-gray-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 shadow-sm transition-all transform active:scale-95"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-8 hidden md:flex">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle size={48} className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Conversation</h3>
                        <p className="text-gray-500 max-w-sm">
                            Choose a chat from the sidebar to start communicating with a freelancer.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
