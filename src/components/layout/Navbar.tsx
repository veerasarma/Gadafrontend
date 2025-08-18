import { useState,useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { 
  Bell, Home, User, Users, LogOut, Menu, Search, MessageCircle, X ,Currency, Wallet
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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
import NotificationBell from '@/components/notifications/NotificationBell';


export function Navbar() {
  const { user,accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [loadingTx, setLoadingTx] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [balance, setBalance] = useState({user_wallet_balance:0,user_points:0});

  const headers = useAuthHeader(accessToken);
  useEffect(() => {
    if (!accessToken) return;
    setLoadingTx(true);
      const result = fetchBalance(headers)
      .then(setBalance)
      .catch(console.error)
      .finally(() => setLoadingTx(false));

  }, [accessToken]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Would normally search for users/content
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return null;
  }

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
                    console.warn('[IMG ERROR]', src);
                    // Optional: show placeholder on error
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                  }}
                />
              
            </Link>
            
            {/* Desktop search bar */}
            <div className="hidden md:block ml-6 w-full max-w-md">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search Smedia"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-gray-100 border-none rounded-full focus-visible:ring-[#1877F2]"
                  />
                </div>
              </form>
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
            {/* <Link to="/notifications" className="p-2 text-gray-600 hover:text-[#1877F2] hover:bg-gray-100 rounded-full">
              <Bell className="h-6 w-6" />
            </Link> */}

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
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
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
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                </div>
                
                {/* Mobile search */}
                <form onSubmit={handleSearch} className="my-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search Smedia"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full bg-gray-100 border-none rounded-lg focus-visible:ring-[#1877F2]"
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
                    <span>Friends</span>
                  </Link>
                  <Link to="/messages" className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                    <MessageCircle className="h-5 w-5 mr-3 text-[#1877F2]" />
                    <span>Messages</span>
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