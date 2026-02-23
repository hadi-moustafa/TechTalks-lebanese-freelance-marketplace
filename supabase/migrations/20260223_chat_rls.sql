-- Enable RLS on chat_rooms
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Allow clients and freelancers to view their own chat rooms
CREATE POLICY "Users can view their own chat rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- Allow clients to insert new chat rooms
CREATE POLICY "Clients can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow room participants to view messages in their rooms
CREATE POLICY "Participants can view messages" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = messages.room_id
    AND (chat_rooms.client_id = auth.uid() OR chat_rooms.freelancer_id = auth.uid())
  )
);

-- Allow participants to insert messages into their rooms
CREATE POLICY "Participants can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = messages.room_id
    AND (chat_rooms.client_id = auth.uid() OR chat_rooms.freelancer_id = auth.uid())
  )
);

-- Allow real-time for messages table
-- We need to enable realtime replication for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
