import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchFriendRequests,
  sendFriendRequest,
  respondFriendRequest,
  fetchFriends,
  FriendRequest,
  fetchFriendSuggestions,
  User
} from '@/services/friendService';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';


interface FriendContextType {
  friends: User[];
  suggestions: User[];
  requests: FriendRequest[];
  sendRequest: (toUserId: string) => Promise<void>;
  respondRequest: (id: string, action: 'accepted'|'declined') => Promise<void>;
}

const FriendContext = createContext<FriendContextType | null>(null);

export function FriendProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken!);
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    fetchFriends(headers).then(setFriends).catch(console.error);
    fetchFriendRequests(headers).then(setRequests).catch(console.error);
    fetchFriendSuggestions(headers).then(setSuggestions).catch(console.error);
  }, [accessToken]);

  const sendRequest = async (toUserId: string) => {
    const req = await sendFriendRequest(toUserId, headers);
    toast.success('Request sent successfully ');
    fetchFriendSuggestions(headers).then(setSuggestions).catch(console.error);
    setRequests(r => [req, ...r]);
    setSuggestions(s => s.filter(u => u.id !== toUserId));
  };

  const respondRequest = async (id: string, action: 'accepted'|'declined') => {
    const res = await respondFriendRequest(id, action, headers);
    setRequests(r => r.map(req => req.id === id ? { ...req, status: action } : req));
    toast.success('Request '+action+' successfully ');
    if (action === 'accepted') {
      // reload friends list
      const updated = await fetchFriends(headers);
      setFriends(updated);
    }
    fetchFriendSuggestions(headers).then(setSuggestions).catch(console.error);
  };

  return (
    <FriendContext.Provider value={{ friends, requests, suggestions, sendRequest, respondRequest }}>
      {children}
    </FriendContext.Provider>
  );
}

export function useFriends() {
  const ctx = useContext(FriendContext);
  if (!ctx) throw new Error('useFriends must be in FriendProvider');
  return ctx;
}
