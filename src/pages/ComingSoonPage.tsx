// src/pages/ComingSoonPage.tsx
import { Link } from 'react-router-dom';
import { Rocket, ArrowLeft } from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import { Button } from '@/components/ui/button';

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />

      {/* page body */}
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1400px] w-full mx-auto space-x-6">
          {/* Left rail */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto">
            <div className="sticky top-16">
              <Sidebar />
            </div>
          </aside>

          {/* Center card */}
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="rounded-xl shadow-sm border bg-white overflow-hidden">
                {/* Gradient header */}
                <div className="bg-gradient-to-r from-[#7C3AED] via-[#5B6CFA] to-[#1D4ED8] p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-2xl p-3">
                      <Rocket className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">
                        Something exciting is on the way
                      </h1>
                      <p className="text-white/90">
                        We’re polishing the last bits. Stay tuned!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  <div className="rounded-lg border bg-gray-50 px-4 py-3 text-gray-700 flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Launching soon
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link to="/">
                      <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to feed
                      </Button>
                    </Link>
                    <Link to="/help">
                      {/* <Button className="bg-[#1877F2] hover:bg-[#166FE5]">
                        Help Center
                      </Button> */}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* keep grid balance on xl */}
          <aside className="hidden xl:block xl:w-80" />
        </div>
      </div>
    </div>
  );
}
