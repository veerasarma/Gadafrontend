import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettingsForm } from '@/components/settings/GeneralSettingsForm';
import { PrivacySettingsForm } from '@/components/settings/PrivacySettingsForm';
import { NotificationSettingsForm } from '@/components/settings/NotificationSettingsForm';
import SecuritySettings from '@/components/settings/SecuritySettings';

const sections = [
  { key: 'general', label: 'General' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Security' },
] as const;

type TabKey = (typeof sections)[number]['key'];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('general');

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />

      {/* page grid */}
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex w-full max-w-[1440px] mx-auto gap-6 min-w-0">
          {/* LEFT: app sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 min-h-0">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <Sidebar />
            </div>
          </aside>

          {/* RIGHT: settings card */}
          <div className="flex-1 min-h-0 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border h-full overflow-hidden flex flex-col">
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as TabKey)}
                className="flex h-full flex-col min-w-0"
              >
                {/* Sticky tabs header (mobile-safe offset) */}
                <div className="sticky z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b">
                  <div className="px-3 sm:px-4 md:px-6">
                    <TabsList
                      aria-label="Settings sections"
                      className="
                        !bg-transparent p-0 h-auto
                        w-full
                        flex flex-wrap sm:flex-nowrap gap-2 items-stretch
                        overflow-x-visible sm:overflow-x-auto hide-scrollbar
                      "
                    >
                      {sections.map((s) => (
                        <TabsTrigger
                          key={s.key}
                          value={s.key}
                          className="
                            rounded-md
                            px-3 md:px-4 py-2
                            text-sm font-medium
                            text-gray-600
                            outline-none ring-0 focus:outline-none
                            focus-visible:ring-0 focus-visible:ring-offset-0
                            data-[state=active]:text-gray-900
                            data-[state=active]:bg-white
                            data-[state=active]:border
                            data-[state=active]:shadow-none
                            whitespace-nowrap
                          "
                        >
                          {s.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 pt-4 sm:pt-6">
                  <TabsContent value="general" className="m-0">
                    <GeneralSettingsForm />
                  </TabsContent>
                  <TabsContent value="privacy" className="m-0">
                    <PrivacySettingsForm />
                  </TabsContent>
                  <TabsContent value="notifications" className="m-0">
                    <NotificationSettingsForm />
                  </TabsContent>
                  <TabsContent value="security" className="m-0">
                    <SecuritySettings />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
