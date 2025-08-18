import * as React from 'react';
import {
  Crown, TrendingUp, UserPlus, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProItem = { id: string | number; name: string; avatar: string };
type Tag = { tag: string; count: number };
type Suggestion = { id: string | number; name: string; avatar: string; mutual: number };

export type RightSidebarProps = {
  proUsers?: ProItem[];
  proPages?: ProItem[];
  trending?: Tag[];
  suggestions?: Suggestion[];
  onAddFriend?: (id: Suggestion['id']) => void;
  onUpgradeClick?: () => void;
  onSeeAllSuggestions?: () => void;
};
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
const sampleUsers: ProItem[] = [
  { id: 1, name: 'Chibuzor Okafor', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png' },
  { id: 2, name: 'Ajibo Chima', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png' },
  { id: 3, name: 'Anthonia Adoyi', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png' },
];

const samplePages: ProItem[] = [
  { id: 'p1', name: 'STAGES', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png' },
  { id: 'p2', name: 'Movie World', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png' },
  { id: 'p3', name: 'EBUKABEST PAGE', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png' },
];

const sampleTags: Tag[] = [
  { tag: '#movieworld', count: 15 },
  { tag: '#space', count: 5 },
  { tag: '#gada', count: 4 },
  { tag: '#science', count: 6 },
  { tag: '#Fact', count: 4 },
  { tag: '#sports', count: 3 },
  { tag: '#AFDA', count: 4 },
  { tag: '#Beauty', count: 5 },
  { tag: '#Cosmetic', count: 3 },
];

const sampleSuggestions: Suggestion[] = [
  { id: 's1', name: 'Kafilat Ojeleye', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png', mutual: 1 },
  { id: 's2', name: 'Genoveva Nietzsche', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png', mutual: 1 },
  { id: 's3', name: 'Ebhohon Rowland', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png', mutual: 1 },
  { id: 's4', name: 'Purity Alaiga', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png', mutual: 2 },
  { id: 's5', name: 'Queen Sophia', avatar: API_BASE_URL+'/uploads//profile/defaultavatar.png', mutual: 1 },
];

function SectionShell({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn('bg-white rounded-2xl shadow-sm border p-4', className)}>
      {children}
    </section>
  );
}

function HorizontalChips({ items, title, cta, onCta }: {
  items: ProItem[];
  title: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <SectionShell className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {cta && (
          <button
            type="button"
            onClick={onCta}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {cta}
          </button>
        )}
      </div>

      <div className="flex gap-5 overflow-x-auto pb-1 hide-scrollbar">
        {items.map(item => (
          <div key={item.id} className="min-w-[84px] flex flex-col items-center">
            <div className="h-20 w-20 rounded-full shadow ring-2 ring-white overflow-hidden">
              <img
                src={item.avatar}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-2 text-center text-sm font-medium text-gray-900 line-clamp-1">
              {item.name}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function TrendingCard({ tags }: { tags: Tag[] }) {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5" />
        <h3 className="text-base font-semibold">Trending</h3>
      </div>

      <ul className="space-y-4">
        {tags.map(t => (
          <li key={t.tag} className="flex items-center justify-between">
            <div className="text-lg font-semibold">{t.tag}</div>
            <div className="text-sm/5 opacity-90">{t.count} Posts</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GadasharesCard() {
  return (
    <SectionShell className="p-5">
      <h3 className="text-lg font-semibold">Gadashares</h3>
      {/* Add your content here later */}
      <div className="mt-2 h-14 rounded-xl bg-gray-50" />
    </SectionShell>
  );
}

function SuggestionsCard({
  list,
  onAdd,
  onSeeAll,
}: {
  list: Suggestion[];
  onAdd?: (id: Suggestion['id']) => void;
  onSeeAll?: () => void;
}) {
  return (
    <SectionShell className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Suggested Friends</h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
        >
          See All <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <ul className="divide-y">
        {list.map(s => (
          <li key={s.id} className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={s.avatar}
                alt={s.name}
                className="h-12 w-12 rounded-full object-cover bg-gray-100"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                <div className="text-xs text-gray-500">{s.mutual} mutual {s.mutual === 1 ? 'friend' : 'friends'}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => onAdd?.(s.id)}
              aria-label={`Add ${s.name}`}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

export default function RightSidebar({
  proUsers = sampleUsers,
  proPages = samplePages,
  trending = sampleTags,
  suggestions = sampleSuggestions,
  onAddFriend,
  onUpgradeClick,
  onSeeAllSuggestions,
}: RightSidebarProps) {
  return (
    <div className="sticky top-20 space-y-6">
      {/* Pro Users */}
      <HorizontalChips
        items={proUsers}
        title="Pro Users"
        cta="Upgrade"
        onCta={onUpgradeClick}
      />

      {/* Pro Pages */}
      <HorizontalChips
        items={proPages}
        title="Pro Pages"
        cta="Upgrade"
        onCta={onUpgradeClick}
      />

      {/* Trending */}
      <TrendingCard tags={trending} />

      {/* Gadashares */}
      <GadasharesCard />

      {/* Suggestions */}
      <SuggestionsCard
        list={suggestions}
        onAdd={onAddFriend}
        onSeeAll={onSeeAllSuggestions}
      />
    </div>
  );
}
