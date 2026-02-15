import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/supabase/client';
import { ChatRoom, Message } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useChat() {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    const subscriptionRef = useRef<RealtimeChannel | null>(null);

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUser(user.id);
        };
        fetchUser();
    }, []);

    // Fetch Chat Rooms
    useEffect(() => {
        if (!currentUser) return;

        const fetchRooms = async () => {
            setIsLoadingRooms(true);
            try {
                const { data, error } = await supabase
                    .from('chat_rooms')
                    .select(`
                        *,
                        client:client_id(id, username, profile_pic),
                        freelancer:freelancer_id(id, username, profile_pic),
                        service:service_id(title)
                    `)
                    .or(`client_id.eq.${currentUser},freelancer_id.eq.${currentUser}`);

                if (error) throw error;

                // Process rooms to get last message for each (this is a simple approach, optimized later if needed)
                const roomsWithDetails = await Promise.all(data.map(async (room) => {
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('room_id', room.id)
                        .order('sent_at', { ascending: false })
                        .limit(1)
                        .single();

                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('room_id', room.id)
                        .eq('is_read', false)
                        .neq('sender_id', currentUser);

                    return {
                        ...room,
                        last_message: lastMsg,
                        unread_count: count || 0
                    };
                }));

                // Sort by last message date
                const sortedRooms = roomsWithDetails.sort((a, b) => {
                    const dateA = new Date(a.last_message?.sent_at || a.created_at).getTime();
                    const dateB = new Date(b.last_message?.sent_at || b.created_at).getTime();
                    return dateB - dateA;
                });

                setChatRooms(sortedRooms as ChatRoom[]);
            } catch (error) {
                console.error('Error fetching chat rooms:', error);
            } finally {
                setIsLoadingRooms(false);
            }
        };

        fetchRooms();
    }, [currentUser]);

    // Fetch Messages when room is selected
    useEffect(() => {
        if (!selectedRoomId) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('room_id', selectedRoomId)
                    .order('sent_at', { ascending: true });

                if (error) throw error;
                setMessages(data as Message[]);

                // Mark messages as read
                if (currentUser) {
                    await supabase
                        .from('messages')
                        .update({ is_read: true })
                        .eq('room_id', selectedRoomId)
                        .neq('sender_id', currentUser)
                        .eq('is_read', false);

                    // Update local state for unread count
                    setChatRooms(prevRooms => prevRooms.map(room => {
                        if (room.id === selectedRoomId) {
                            return { ...room, unread_count: 0 };
                        }
                        return room;
                    }));
                }

            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();

        // Real-time Subscription
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        const channel = supabase
            .channel(`room:${selectedRoomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${selectedRoomId}`
            }, (payload) => {
                const newMessage = payload.new as Message;
                setMessages(prev => [...prev, newMessage]);

                // Update last message in room list
                setChatRooms(prevRooms => prevRooms.map(room => {
                    if (room.id === selectedRoomId) {
                        return {
                            ...room,
                            last_message: newMessage,
                            // If it's not my message, I might want to increment unread, but since I am ON this room, it should probably be read immediately or handled by the fetch above. 
                            // For simplicity in this view, we assume open room = read.
                        };
                    }
                    return room;
                }));
            })
            .subscribe();

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };

    }, [selectedRoomId, currentUser]);

    // Subscribe to GLOBAL messages for sidebar updates (unread counts on other rooms)
    useEffect(() => {
        if (!currentUser) return;

        const globalChannel = supabase
            .channel(`user_chats:${currentUser}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, async (payload) => {
                const newMessage = payload.new as Message;
                // We need to check if this message belongs to one of our rooms
                // This is a bit inefficient without filtering by my rooms, but RLS should restrict what I receive updates for if set up correctly for row level security on subscriptions.
                // However, standar subscriptions often get all public events unless filtered. 
                // A better way is to rely on client-side filtering if volume is low, or multiple subscriptions.
                // For now, let's just re-fetch rooms or update if we find the room in our list.

                setChatRooms(prevRooms => prevRooms.map(room => {
                    if (room.id === newMessage.room_id) {
                        const isCurrentRoom = room.id === selectedRoomId;
                        return {
                            ...room,
                            last_message: newMessage,
                            unread_count: isCurrentRoom ? room.unread_count : (room.unread_count || 0) + 1
                        };
                    }
                    return room;
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(globalChannel);
        }
    }, [currentUser, selectedRoomId])

    const sendMessage = async (text: string) => {
        if (!selectedRoomId || !currentUser || !text.trim()) return;

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    room_id: selectedRoomId,
                    sender_id: currentUser,
                    message_text: text,
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return {
        chatRooms,
        messages,
        selectedRoomId,
        setSelectedRoomId,
        isLoadingRooms,
        isLoadingMessages,
        currentUser,
        sendMessage
    };
}
