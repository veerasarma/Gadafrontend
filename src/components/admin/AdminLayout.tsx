// src/pages/admin/AdminLayout.tsx
import { useEffect, useMemo, useState } from "react";
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
  CircleDollarSign,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Tags,
  Group,
  FolderTree,
  Calendar,
  CreditCard,
  Wallet,
  ChartLine,
  Package,
} from "lucide-react";

/** Flat items + multiple grouped menus with children */
const nav = [
  { to: "/admin/", label: "Dashboard", icon: Gauge },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/posts", label: "Posts", icon: Newspaper },
  { to: "/admin/representatives", label: "Representatives", icon: LandPlot },
  { to: "/admin/banktransfers", label: "Bank Transfers", icon: Landmark },
  {
    to: "/admin/earningspayments",
    label: "Earning-Payments",
    icon: CircleDollarSign,
  },

  {
    label: "Earnings",
    icon: ChartLine,
    children: [
      { to: "/admin/earnings/packages", label: "Earnings", icon: ChartLine },
    ],
  },
  {
    label: "Pages",
    icon: BookOpen,
    children: [
      { to: "/admin/pages", label: "Pages", icon: BookOpen },
      { to: "/admin/page-categories", label: "Pages Categories", icon: Tags },
    ],
  },
  {
    label: "Wallet",
    icon: Wallet,
    children: [
      {
        to: "/admin/payment-requests",
        label: "Payment requests",
        icon: Wallet,
      },
      { to: "/admin/wallet-settings", label: "Wallet settings", icon: Tags },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      {
        to: "/admin/settings/payments",
        label: "Payment setttings",
        icon: CreditCard,
      },
      {
        to: "/admin/settings/points",
        label: "Points setttings",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Groups",
    icon: Group,
    children: [
      { to: "/admin/groups", label: "Groups", icon: Group },
      {
        to: "/admin/group-categories",
        label: "Group Categories",
        icon: FolderTree,
      },
    ],
  },
  {
    label: "Events",
    icon: Calendar,
    children: [
      { to: "/admin/events", label: "Events", icon: Calendar },
      {
        to: "/admin/events-categories",
        label: "Events Categories",
        icon: FolderTree,
      },
    ],
  },
  {
    label: "Pros",
    icon: Package,
    children: [
      { to: "/admin/packages", label: "Packages", icon: Package },
      { to: "/admin/subscribers", label: "Subscribers", icon: FolderTree },
    ],
  },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile drawer

  /** Build a quick lookup of which grouped menu is "active" for current URL */
  const groupActivity = useMemo(() => {
    const map = new Map<string, boolean>();
    nav.forEach((item: any) => {
      if (item.children?.length) {
        const active = item.children.some(
          (c: any) => pathname === c.to || pathname.startsWith(`${c.to}/`)
        );
        map.set(item.label, active);
      }
    });
    return map;
  }, [pathname]);

  /** Maintain open/closed state per group (independent) */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-open the group that matches current path; preserve others
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      groupActivity.forEach((active, label) => {
        if (active) next[label] = true;
      });
      return next;
    });
  }, [groupActivity]);

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const ItemButton = ({
    active,
    children,
    onClick,
  }: {
    active?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <Button
      variant={active ? "default" : "ghost"}
      className="w-full justify-start"
      onClick={onClick}
    >
      {children}
    </Button>
  );

  const Sidebar = (
    <nav className="p-4 space-y-2">
      {nav.map((item: any) => {
        // grouped item
        if (item.children?.length) {
          const Icon = item.icon;
          const label = item.label as string;
          const groupActive = !!groupActivity.get(label);
          const open = !!openGroups[label];

          return (
            <div key={label} className="space-y-1">
              <ItemButton
                active={groupActive}
                onClick={() => toggleGroup(label)}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">{label}</span>
                {open ? (
                  <ChevronDown className="h-4 w-4 opacity-70" />
                ) : (
                  <ChevronRight className="h-4 w-4 opacity-70" />
                )}
              </ItemButton>

              {open && (
                <div className="ml-6 space-y-1">
                  {item.children.map((child: any) => {
                    const CIcon = child.icon || BookOpen;
                    const active =
                      pathname === child.to ||
                      pathname.startsWith(`${child.to}/`);
                    return (
                      <Link
                        key={child.to}
                        to={child.to}
                        onClick={() => setDrawerOpen(false)}
                        className="block"
                      >
                        <ItemButton active={active}>
                          <CIcon className="h-4 w-4 mr-2" />
                          {child.label}
                        </ItemButton>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // flat item
        const Icon = item.icon;
        const active =
          pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setDrawerOpen(false)}
            className="block"
          >
            <ItemButton active={active}>
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </ItemButton>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop left rail */}
        <aside className="hidden md:block w-64 border-r bg-white">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            {Sidebar}
          </div>
        </aside>

        {/* Mobile drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
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
