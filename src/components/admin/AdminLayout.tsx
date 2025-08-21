import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Gauge,
  Users,
  Settings,
  Newspaper,
  LandPlot,
  Landmark,
} from "lucide-react";

const nav = [
  { to: "/admin", label: "Dashboard", icon: Gauge },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/posts", label: "Posts", icon: Newspaper },
  { to: "/admin/representatives", label: "Representatives", icon: LandPlot },
  { to: "/admin/banktransfers", label: "Bank Transfers", icon: Landmark },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const Sidebar = (
    <nav className="p-4 space-y-2">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        return (
          <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
            <Button
              variant={active ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop left rail */}
        <aside className="hidden md:block w-64 border-r bg-white">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            {Sidebar}
          </div>
        </aside>

        {/* Mobile drawer */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden fixed top-16 left-2 z-20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            {Sidebar}
          </SheetContent>
        </Sheet>

        {/* Main */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
