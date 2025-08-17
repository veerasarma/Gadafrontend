// src/components/ui/Sidebar1.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Box,
  Bookmark,
  Calendar,
  Clock,
  Users,
  FileText,
  CalendarCheck,
  Video,
  Tag,
  Settings,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Wallet,
  UserPlus
} from 'lucide-react';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  route?: string;
}

const mainItems: SidebarItem[] = [
  { name: "News Feed", icon: Home, route: "/" },
  { name: "Mine", icon: Box }, // has submenu
  { name: "Saved", icon: Bookmark, route: "/saved" },
  { name: "Scheduled", icon: Calendar, route: "/scheduled" },
  { name: "Memories", icon: Clock, route: "/memories" },
  { name: "Packages", icon: CircleDollarSign, route: "/packages" },
];

const mineSubmenu: SidebarItem[] = [
  { name: "Popular", icon: FileText, route: "/mine/popular" },
  { name: "My Offers", icon: Tag, route: "/mine/offers" },
  { name: "My Blogs", icon: FileText, route: "/mine/blogs" },
];

const exploreItems: SidebarItem[] = [
  { name: 'People', icon: Users, route: '/friends' },
  { name: 'Representative', icon: UserPlus, route: '/representative' },
  { name: 'Wallet', icon: Wallet, route: '/wallet' },
  { name: 'Pages', icon: FileText, route: '/pages' },
  { name: 'Groups', icon: Users, route: '/groups' },
  { name: 'Events', icon: CalendarCheck, route: '/events' },
  { name: 'Reels', icon: Video, route: '/reels' },
  { name: 'Watch', icon: Video, route: '/watch' },
  { name: 'Blogs', icon: FileText, route: '/blogs' },
  { name: 'Offers', icon: Tag, route: '/offers' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState<string>(
    window.location.pathname
  );
  const [mineOpen, setMineOpen] = useState<boolean>(false);

  const handleClick = (item: SidebarItem) => {
    if (item.name === "Mine") {
      setMineOpen((open) => !open);
      return;
    }
    if (item.route) {
      navigate(item.route);
      setActivePath(item.route);
      // close submenu if navigating away
      if (mineOpen) setMineOpen(false);
    }
  };

  const renderItem = (item: SidebarItem) => {
    const isActive = item.route === activePath;
    const Icon = item.icon;
    return (
      <button
        key={item.name}
        onClick={() => handleClick(item)}
        className={`
          flex items-center w-full text-left px-3 py-2 rounded-lg
          transition-colors duration-150
          ${
            isActive
              ? "bg-purple-100 text-purple-700"
              : "text-gray-600 hover:bg-gray-100"
          }
        `}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
        <span className="ml-3 flex-1">{item.name}</span>
        {item.name === "Mine" &&
          (mineOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          ))}
      </button>
    );
  };

  return (
    <aside className="hidden lg:flex lg:w-64 bg-white p-4 border-r border-gray-200 h-full flex-col rounded-lg shadow">
      {/* Main Section */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
          Main
        </h3>
        <ul className="space-y-1">
          {mainItems.map((item) => (
            <li key={item.name}>
              {renderItem(item)}
              {item.name === "Mine" && mineOpen && (
                <ul className="mt-1 space-y-1 pl-8">
                  {mineSubmenu.map((sub) => (
                    <li key={sub.name}>
                      <button
                        onClick={() => {
                          handleClick(sub);
                        }}
                        className={`
                          flex items-center w-full text-left px-2 py-1 rounded-lg transition-colors duration-150
                          ${
                            sub.route === activePath
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-600 hover:bg-gray-100"
                          }
                        `}
                      >
                        <sub.icon className="w-4 h-4" aria-hidden="true" />
                        <span className="ml-2 text-sm">{sub.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Explore Section */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
          Explore
        </h3>
        <ul className="space-y-1">
          {exploreItems.map((item) => (
            <li key={item.name}>{renderItem(item)}</li>
          ))}
        </ul>
      </div>

      {/* Settings at Bottom */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center w-full text-left p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-150"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          <span className="ml-3 text-sm font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
