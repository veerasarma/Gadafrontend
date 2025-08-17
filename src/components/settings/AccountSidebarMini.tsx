import { NavLink } from 'react-router-dom';
import { Shield, Bell, UserCog, BadgeCheck, UserRoundX, Link2, Wallet2, Store, Gift, AppWindow, MapPin, Info, Crown, DollarSign, Users, Star } from 'lucide-react';

type Item = {
  label: string;
  icon: React.ComponentType<any>;
  to?: string;
  active?: boolean;
};

const sections: { title: string; items: Item[] }[] = [
  {
    title: 'Account',
    items: [
      { label: 'Account Settings', icon: UserCog },
      { label: 'Edit Profile', icon: UserCog },
      { label: 'Security Settings', icon: Shield },
      { label: 'Notifications', icon: Bell },
      { label: 'Verification', icon: BadgeCheck },
    ],
  },
  {
    title: 'Privacy & Social',
    items: [
      { label: 'Privacy', icon: Shield },
      { label: 'Blocking', icon: UserRoundX },
      { label: 'Connected Accounts', icon: Link2 },
      { label: 'Membership', icon: Crown },
      { label: 'Monetization', icon: DollarSign },
      { label: 'Affiliates', icon: Users },
    ],
  },
  {
    title: 'Points',
    items: [
      { label: 'Points', icon: Star, active: true },
      { label: 'My Points', icon: Gift },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'Marketplace', icon: Store },
      { label: 'Funding', icon: Wallet2 },
      { label: 'Bank Transfers', icon: Wallet2 },
      { label: 'Apps', icon: AppWindow },
      { label: 'Your Addresses', icon: MapPin },
      { label: 'Your Information', icon: Info },
    ],
  },
];

export function AccountSidebarMini() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto">
      {sections.map((sec) => (
        <div key={sec.title} className="mb-5">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">{sec.title}</h4>
          <ul className="space-y-1">
            {sec.items.map((it) => {
              const Icon = it.icon;
              const itemClass =
                it.active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50';
              const content = (
                <div className={`w-full flex items-center gap-2 px-2 py-2 rounded-md ${itemClass}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{it.label}</span>
                </div>
              );

              return (
                <li key={it.label}>
                  {it.to ? (
                    <NavLink to={it.to} className="block">
                      {content}
                    </NavLink>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
