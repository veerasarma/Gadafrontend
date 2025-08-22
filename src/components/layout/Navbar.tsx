import { useState,useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { 
  Bell, Home, User, Users, LogOut, Menu, Search, MessageCircle, X ,Currency, Wallet,Box,Bookmark,Calendar,Clock,FileText,CalendarCheck,Video,Tag,Settings,ChevronDown,ChevronUp,CircleDollarSign,UserPlus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { encodeId } from '@/lib/idCipher';
import { stripUploads } from '@/lib/url';
import {
  fetchTransactions,
  Transaction,
  initializePayment,
  fetchBalance
} from "@/services/paymentService";
import NotificationBell from '@/components/notifications/NotificationBell';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

// -------------------- NEW: types for search results --------------------
type PersonHit = { id: number|string; username: string; fullName: string; avatar?: string|null; };
type PostHit = { id: number|string; snippet: string; author: { id: number|string; username: string; avatar?: string|null } };
type TagHit = { id: number|string; tag: string; count: number };

type SuggestPayload = {
  top: Array<{ kind: 'user'|'post'|'tag'; data: any }>;
  users: PersonHit[];
  posts: PostHit[];
  tags: TagHit[];
};

// Simple helper
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

// -------------------- /NEW --------------------

export function Navbar() {
  const { user,accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [loadingTx, setLoadingTx] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [balance, setBalance] = useState({user_wallet_balance:0,user_points:0});

  const headers = useAuthHeader(accessToken);

  // -------------------- NEW: search dropdown state --------------------
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SuggestPayload | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement|null>(null);
  const inputRef = useRef<HTMLInputElement|null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  // NEW: stable headers ref + last-query guard
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);
  const lastQueryRef = useRef<string>('');

  // close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(e.target as Node)) return;
      if (inputRef.current && inputRef.current.contains(e.target as Node)) return;
      setOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  // -------------------- /NEW --------------------

  useEffect(() => {
    if (!accessToken) return;
    setLoadingTx(true);
    fetchBalance(headers)
      .then(setBalance)
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [accessToken]);

  // -------------------- NEW: debounced suggest fetch (loop-proof) --------------------
  useEffect(() => {
    const q = searchQuery.trim();

    // clear pending debounce + abort in-flight
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (q.length < 2) {
      setResults(null);
      setOpen(!!q); // keep box closed unless user starts typing
      setBusy(false);
      lastQueryRef.current = '';
      return;
    }

    // same-query guard: avoid refiring for identical text (re-renders etc.)
    if (lastQueryRef.current === q) {
      return;
    }

    setBusy(true);
    setOpen(true);

    debounceRef.current = window.setTimeout(async () => {
      try {
        // record the query we're about to fire
        lastQueryRef.current = q;

        abortRef.current = new AbortController();
        const res = await fetch(
          `${API_BASE_URL.replace(/\/+$/,'')}/api/search/suggest?q=${encodeURIComponent(q)}`,
          {
            headers: headersRef.current,   // <- stable headers
            signal: abortRef.current.signal
          }
        );
        if (!res.ok) throw new Error('search failed');

        // if user typed something else since scheduling, ignore this response
        if (lastQueryRef.current !== q) return;

        const payload: SuggestPayload = await res.json();
        setResults(payload);
        setActiveIndex(-1);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('[search]', e);
        }
      } finally {
        if (lastQueryRef.current === q) setBusy(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
    // IMPORTANT: depend on text + token only (NOT on `headers` object identity)
  }, [searchQuery, accessToken]);
  // -------------------- /NEW --------------------

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setOpen(false);
    setActiveIndex(-1);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // -------------------- NEW: keyboard nav --------------------
  const flatList = (() => {
    if (!results) return [];
    // Order in dropdown: Top (0..n), People, Posts, Hashtags
    const top = results.top.map(r => ({ group:'Top', kind:r.kind, data:r.data }));
    const u = results.users.map(d => ({ group:'People', kind:'user', data:d }));
    const p = results.posts.map(d => ({ group:'Posts', kind:'post', data:d }));
    const t = results.tags.map(d => ({ group:'Hashtags', kind:'tag', data:d }));
    return [...top, ...u, ...p, ...t];
  })();

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && flatList[activeIndex]) {
        const item = flatList[activeIndex];
        handleNavigate(item.kind as any, item.data);
      } else {
        handleSearch(e as any);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };
  // -------------------- /NEW --------------------

  // -------------------- NEW: navigate helper --------------------
  function handleNavigate(kind: 'user'|'post'|'tag', data: any) {
    setOpen(false);
    setActiveIndex(-1);
    if (kind === 'user') {
      navigate(`/profile/${encodeId(String(data.id))}`);
    } else if (kind === 'post') {
      navigate(`/posts/${data.id}`); // adjust if your route differs
    } else if (kind === 'tag') {
      navigate(`/hashtag/${encodeURIComponent(data.tag)}`);
    }
  }
  // -------------------- /NEW --------------------

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getInitials = (name: string) => initials(name);

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and search bar */}
          <div className="flex items-center flex-1">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <h1 className="text-[#1877F2] text-2xl font-bold"></h1>
              <img 
                src={API_BASE_URL+'/uploads/gadalogo.png'} 
                alt="Gada" 
                className="h-10 w-auto" 
                onError={(e) => {
                  // Optional fallback
                  (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                }}
              />
            </Link>
            
            {/* Desktop search bar */}
            <div className="hidden md:block ml-6 w-full max-w-md relative" ref={dropdownRef}>
              <form onSubmit={handleSearch} className="flex">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search people, posts, #hashtags"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="pl-10 w-full bg-gray-100 border-none rounded-full focus-visible:ring-[#1877F2]"
                  />
                </div>
              </form>

              {/* -------------------- NEW: dropdown -------------------- */}
              {open && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {/* Busy/empty states */}
                  {busy && (
                    <div className="p-4 text-sm text-gray-500">Searching…</div>
                  )}
                  {!busy && (!results || (results.users.length + results.posts.length + results.tags.length + results.top.length === 0)) && (
                    <div className="p-4 text-sm text-gray-500">No results</div>
                  )}

                  {!busy && results && (
                    <div className="max-h-[70vh] overflow-y-auto">
                      {/* Top */}
                      {results.top.length > 0 && (
                        <div>
                          <div className="px-4 pt-3 pb-1 text-xs uppercase text-gray-500">Top</div>
                          {results.top.map((r, i) => {
                            const flatIdx = i; // first section
                            return (
                              <button
                                key={`top-${i}`}
                                onMouseEnter={() => setActiveIndex(flatIdx)}
                                onClick={() => handleNavigate(r.kind as any, r.data)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${activeIndex===flatIdx?'bg-gray-50':''}`}
                              >
                                {r.kind === 'user' && (
                                  <>
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage src={API_BASE_URL+'/uploads/'+stripUploads(r.data.avatar||'')} />
                                      <AvatarFallback>{initials(r.data.fullName||r.data.username)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-sm font-medium">{r.data.fullName || r.data.username}</div>
                                      <div className="text-xs text-gray-500">@{r.data.username}</div>
                                    </div>
                                  </>
                                )}
                                {r.kind === 'post' && (
                                  <>
                                    <div className="h-7 w-7 rounded bg-blue-100 flex items-center justify-center text-blue-600 text-xs">Post</div>
                                    <div className="text-sm line-clamp-2" dangerouslySetInnerHTML={{__html: r.data.snippet}} />
                                  </>
                                )}
                                {r.kind === 'tag' && (
                                  <>
                                    <div className="h-7 w-7 rounded bg-purple-100 flex items-center justify-center text-purple-600 text-xs">#</div>
                                    <div className="text-sm">
                                      #{r.data.tag} <span className="text-xs text-gray-500 ml-1">{r.data.count} posts</span>
                                    </div>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* People */}
                      {results.users.length > 0 && (
                        <div>
                          <div className="px-4 pt-3 pb-1 text-xs uppercase text-gray-500">People</div>
                          {results.users.map((u, i) => {
                            const flatIdx = results.top.length + i;
                            return (
                              <button
                                key={`u-${u.id}`}
                                onMouseEnter={() => setActiveIndex(flatIdx)}
                                onClick={() => handleNavigate('user', u)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${activeIndex===flatIdx?'bg-gray-50':''}`}
                              >
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={API_BASE_URL+'/uploads/'+stripUploads(u.avatar||'')} />
                                  <AvatarFallback>{initials(u.fullName||u.username)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{u.fullName || u.username}</div>
                                  <div className="text-xs text-gray-500">@{u.username}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Posts */}
                      {results.posts.length > 0 && (
                        <div>
                          <div className="px-4 pt-3 pb-1 text-xs uppercase text-gray-500">Posts</div>
                          {results.posts.map((p, i) => {
                            const flatIdx = results.top.length + results.users.length + i;
                            return (
                              <button
                                key={`p-${p.id}`}
                                onMouseEnter={() => setActiveIndex(flatIdx)}
                                onClick={() => handleNavigate('post', p)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-3 ${activeIndex===flatIdx?'bg-gray-50':''}`}
                              >
                                <Avatar className="h-7 w-7 mt-0.5">
                                  <AvatarImage src={API_BASE_URL+'/uploads/'+stripUploads(p.author?.avatar||'')} />
                                  <AvatarFallback>{initials(p.author?.username||'U')}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm line-clamp-2" dangerouslySetInnerHTML={{__html: p.snippet}} />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Hashtags */}
                      {results.tags.length > 0 && (
                        <div>
                          <div className="px-4 pt-3 pb-1 text-xs uppercase text-gray-500">Hashtags</div>
                          {results.tags.map((t, i) => {
                            const flatIdx = results.top.length + results.users.length + results.posts.length + i;
                            return (
                              <button
                                key={`t-${t.id}`}
                                onMouseEnter={() => setActiveIndex(flatIdx)}
                                onClick={() => handleNavigate('tag', t)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${activeIndex===flatIdx?'bg-gray-50':''}`}
                              >
                                <div className="h-7 w-7 rounded bg-purple-100 flex items-center justify-center text-purple-600 text-xs">#</div>
                                <div className="text-sm">#{t.tag} <span className="text-xs text-gray-500 ml-1">{t.count} posts</span></div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* -------------------- /NEW -------------------- */}
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="p-2 text-gray-600 hover:text-[#1877F2] hover:bg-gray-100 rounded-full">
              <Home className="h-6 w-6" />
            </Link>
            <Link to="/friends" className="p-2 text-gray-600 hover:text-[#1877F2] hover:bg-gray-100 rounded-full">
              <Users className="h-6 w-6" />
            </Link>
            <Link to="/messages" className="p-2 text-gray-600 hover:text-[#1877F2] hover:bg-gray-100 rounded-full">
              <MessageCircle className="h-6 w-6" />
            </Link>

            <NotificationBell />
            
            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={API_BASE_URL+'/uploads/'+stripUploads(user.profileImage)} alt={user.username} />
                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link to={`/profile/${encodeId((user.id.toString()))}`}>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <Link to="/points">
                  <DropdownMenuItem className="cursor-pointer">
                    <Currency className="mr-2 h-4 w-4" /> Points <span className="badge bg-light text-primary">{ balance.user_points}</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <Link to="/wallet">
                  <DropdownMenuItem className="cursor-pointer">
                    <Wallet className="mr-2 h-4 w-4" /> Wallet <span className="badge bg-light text-primary">₦{ balance.user_wallet_balance}</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col h-screen overflow-y-auto p-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  {/* <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetTrigger> */}
                </div>
                
                {/* Mobile search */}
                <form onSubmit={handleSearch} className="my-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search people, posts, #hashtags"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="pl-10 w-full bg-gray-100 border-none rounded-full focus-visible:ring-[#1877F2]"
                  />
                  </div>
                </form>
                
                {/* Mobile navigation links */}
                <div className="flex flex-col space-y-2">
                  <Link to="/" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <Home className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Home</span>
                  </Link>
                  <Link to={`/profile/${user.id}`} className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <User className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Profile</span>
                  </Link>
                  <Link to="/friends" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <Users className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>People</span>
                  </Link>
                  <Link to="/wallet" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <Wallet className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Wallet <span className="badge bg-light text-primary">₦{ balance.user_wallet_balance}</span></span>
                  </Link>

                  <Link to="/points" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <Currency className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Points<span className="badge bg-light text-primary">{ balance.user_points}</span></span> 
                  </Link>
                  <Link to="/saved" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <Bookmark className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Saved</span>
                  </Link>
                  <Link to="/packages" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <CircleDollarSign className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Packages</span>
                  </Link>
                  <Link to="/memories" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <Clock className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Memories</span>
                  </Link>
                  <Link to="/representative" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <UserPlus className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Representative</span>
                  </Link>
                  <Link to="/messages" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <MessageCircle className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Messages</span>
                  </Link>
                  <Link to="/pages" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <FileText className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Pages</span>
                  </Link>
                  <Link to="/scheduled" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <Calendar className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Scheduled</span>
                  </Link>
                  <Link to="/notifications" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    {/* <Bell className="h-5 w-5 mr-3 text-[#1877F2]" /> */}
                    <span>Notifications</span>
                  </Link>
                  
                  <div className="pt-2 mt-2 border-t">
                    <Button 
                      onClick={handleLogout} 
                      variant="ghost"
                      className="flex items-center w-full justify-start p-2 hover:bg-gray-100 rounded-md"
                    >
                      <LogOut className="h-5 w-5 mr-3 text-red-500" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
