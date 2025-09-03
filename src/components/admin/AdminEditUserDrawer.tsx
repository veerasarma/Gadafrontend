// src/components/admin/AdminEditUserDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import {
  adminGetUser,
  adminUpdateProfile,
  adminAdjustBalances,
  // OLD membership helpers used by other tabs (kept)
  adminGetMembership,
  adminGrantPackage,
  adminCancelCurrent,
  type AdminUser,
  // NEW membership summary helpers for this design
  adminGetMembershipSummary,
  adminListPackages,
  adminUnsubscribeUser,
  adminUpdateUserPackage,
} from "@/services/adminUsersService";

function naira(n?: number | null) {
  const v = Number(n ?? 0);
  return `₦${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function fmtDate(d?: string | null) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}
function daysLeft(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  return days;
}

export default function AdminEditUserDrawer({
  userId,
  open,
  onOpenChange,
  onSaved,
}: {
  userId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"profile" | "balances" | "membership">("profile");
  const [u, setU] = useState<AdminUser | null>(null);
  const [membershipRows, setMembershipRows] = useState<any[]>([]); // old table list (kept for reference/debug)

  // editable profile fields
  const [form, setForm] = useState<any>({});

  // --- NEW membership state for the UI you shared ---
  const [summary, setSummary] = useState<{
    active: boolean;
    packageId: number | null;
    packageName: string | null;
    price: number | null;
    period: "Day" | "Month" | "Year" | string | null;
    period_num: number | null;
    subscribedAt: string | null;
    expiresAt: string | null;
    usage: { boostedPostsUsed: number; boostedPagesUsed: number };
    limits: { boostPostsLimit: number; boostPagesLimit: number };
  } | null>(null);

  const [allPackages, setAllPackages] = useState<Array<{
    package_id: number; name: string; price: number; period: string; period_num: number;
  }>>([]);

  const [selectedPkgId, setSelectedPkgId] = useState<string>("");

  useEffect(() => {
    if (!open || !userId) return;
    void load();
  }, [open, userId]);

  async function load() {
    try {
      setLoading(true);
      const user = await adminGetUser(headers, userId!);
      setU(user);
      setForm({
        username: user.username,
        email: user.email,
        phone: user.phone || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        gender: user.gender || "",
        birthdate: user.birthdate ? String(user.birthdate).slice(0, 10) : "",
        bio: user.bio || "",
        website: user.website || "",
      });

      // old list (kept, not rendered in the new design)
      const mem = await adminGetMembership(headers, userId!);
      setMembershipRows(mem);

      // NEW: summary + packages for dropdown
      const [sum, pkgs] = await Promise.all([
        adminGetMembershipSummary(headers, userId!),
        adminListPackages(headers),
      ]);
      console.log(sum, pkgs)
      if(sum.data)
      {
          setSummary(sum.data);
          setSelectedPkgId(sum?.packageId ? String(sum.packageId) : "");
      }
      if(pkgs)
      {
          setAllPackages(pkgs.data || []);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load user");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  // -------- profile actions --------
  async function saveProfile() {
    if (!u) return;
    try {
      await adminUpdateProfile(headers, u.id, form);
      toast.success("Profile updated");
      await load();
      onSaved?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update");
    }
  }

  // -------- balances actions --------
  const [walletDelta, setWalletDelta] = useState<string>("");
  const [pointsDelta, setPointsDelta] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  async function applyBalances() {
    if (!u) return;
    if (!walletDelta && !pointsDelta) return toast.message("Nothing to change");
    try {
      await adminAdjustBalances(headers, u.id, {
        walletDelta: walletDelta ? Number(walletDelta) : 0,
        pointsDelta: pointsDelta ? Number(pointsDelta) : 0,
        reason: reason || "admin adjustment",
      });
      toast.success("Balances updated");
      setWalletDelta("");
      setPointsDelta("");
      setReason("");
      await load();
      onSaved?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update balances");
    }
  }

  // -------- membership actions (new UI) --------
  async function handleUnsubscribe() {
    if (!u) return;
    try {
      await adminUnsubscribeUser(headers, u.id);
      toast.success("User unsubscribed");
      await load();
      onSaved?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to unsubscribe");
    }
  }

  async function saveMembershipChanges() {
    if (!u) return;
    if (!selectedPkgId) {
      toast.message("Please select a package");
      return;
    }
    const targetId = Number(selectedPkgId);
    if (summary?.packageId === targetId) {
      toast.message("No changes to save");
      return;
    }
    try {
      await adminUpdateUserPackage(headers, u.id, { packageId: targetId });
      toast.success("Membership updated");
      await load();
      onSaved?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update membership");
    }
  }

  // progress %s
  const postsPct = useMemo(() => {
    const used = summary?.usage.boostedPostsUsed ?? 0;
    const lim = summary?.limits.boostPostsLimit ?? 0;
    return lim > 0 ? Math.min(100, Math.round((used / lim) * 100)) : 0;
  }, [summary]);
  const pagesPct = useMemo(() => {
    const used = summary?.usage.boostedPagesUsed ?? 0;
    const lim = summary?.limits.boostPagesLimit ?? 0;
    return lim > 0 ? Math.min(100, Math.round((used / lim) * 100)) : 0;
  }, [summary]);

  // -------- UI --------
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden">
        <SheetHeader>
          <SheetTitle>Edit User {u ? `#${u.id}` : ""}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-4 h-[85vh]">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="self-start">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="membership">Membership</TabsTrigger>
            </TabsList>

            {/* PROFILE */}
            <TabsContent value="profile" className="flex-1 overflow-y-auto pr-1">
              {loading && <div className="text-sm text-gray-500">Loading…</div>}
              {!loading && u && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Username</Label>
                      <Input value={form.username || ""} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>First name</Label>
                      <Input value={form.firstName || ""} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                    </div>
                    <div>
                      <Label>Last name</Label>
                      <Input value={form.lastName || ""} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Input value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
                    </div>
                    <div>
                      <Label>Birthdate</Label>
                      <Input type="date" value={form.birthdate || ""} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <textarea
                      className="w-full rounded-md border p-2 text-sm"
                      rows={4}
                      value={form.bio || ""}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Wallet: <b>{naira(u.wallet)}</b> &middot; Points: <b>{u.points.toFixed(0)}</b>
                    </div>
                    <Button onClick={saveProfile}>Save profile</Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* BALANCES */}
            <TabsContent value="balances" className="flex-1 overflow-y-auto pr-1">
              {!u ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border p-3 bg-white">
                    <div className="text-sm mb-2">Current Balances</div>
                    <div className="flex gap-6 text-sm">
                      <div>Wallet: <b>{naira(u.wallet)}</b></div>
                      <div>Points: <b>{u.points.toFixed(0)}</b></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Wallet Δ (±)</Label>
                      <Input type="number" value={walletDelta} onChange={(e) => setWalletDelta(e.target.value)} placeholder="e.g. 1000 or -500" />
                    </div>
                    <div>
                      <Label>Points Δ (±)</Label>
                      <Input type="number" value={pointsDelta} onChange={(e) => setPointsDelta(e.target.value)} placeholder="e.g. 50 or -20" />
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="admin adjustment" />
                    </div>
                  </div>

                  <Button onClick={applyBalances}>Apply</Button>
                </div>
              )}
            </TabsContent>

            {/* MEMBERSHIP – redesigned */}
            <TabsContent value="membership" className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-5">
                <div className="rounded-lg border bg-white p-4">
                  <div className="text-sm font-semibold mb-4">PACKAGE DETAILS</div>

                  {/* Row: Package */}
                  <div className="grid grid-cols-12 gap-3 items-center mb-3">
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-500">Package</div>
                    <div className="col-span-12 sm:col-span-9 text-[15px] font-medium">
                      {summary?.packageName
                        ? `${summary.packageName} (${naira(summary.price)} per ${summary?.period_num ?? 0} ${summary?.period ?? ""})`
                        : "—"}
                    </div>
                  </div>

                  {/* Row: Subscription Date */}
                  <div className="grid grid-cols-12 gap-3 items-center mb-3">
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-500">Subscription Date</div>
                    <div className="col-span-12 sm:col-span-9">{fmtDate(summary?.subscribedAt)}</div>
                  </div>

                  {/* Row: Expiration */}
                  <div className="grid grid-cols-12 gap-3 items-center mb-3">
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-500">Expiration Date</div>
                    <div className="col-span-12 sm:col-span-9">
                      {summary?.expiresAt ? (
                        <>
                          {fmtDate(summary.expiresAt)}{" "}
                          <span className="text-gray-500">
                            (Remaining {daysLeft(summary.expiresAt)} Days)
                          </span>
                        </>
                      ) : "—"}
                    </div>
                  </div>

                  {/* Boosted Posts */}
                  <div className="grid grid-cols-12 gap-3 items-center mb-2">
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-500">Boosted Posts</div>
                    <div className="col-span-12 sm:col-span-9">
                      <div className="text-sm mb-1">
                        {summary?.usage.boostedPostsUsed ?? 0}/{summary?.limits.boostPostsLimit ?? 0}
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#8b5cf6]"
                          style={{ width: `${postsPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Boosted Pages */}
                  <div className="grid grid-cols-12 gap-3 items-center mb-4">
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-500">Boosted Pages</div>
                    <div className="col-span-12 sm:col-span-9">
                      <div className="text-sm mb-1">
                        {summary?.usage.boostedPagesUsed ?? 0}/{summary?.limits.boostPagesLimit ?? 0}
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#8b5cf6]"
                          style={{ width: `${pagesPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleUnsubscribe}
                      disabled={!summary?.active}
                    >
                      Unsubscribe
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="text-sm font-semibold mb-4">UPGRADE PACKAGE</div>

                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 sm:col-span-3 text-sm text-gray-500">Select Package</div>
                    <div className="col-span-12 sm:col-span-9">
                      <select
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        value={selectedPkgId}
                        onChange={(e) => setSelectedPkgId(e.target.value)}
                      >
                        <option value="">— Select —</option>
                        {allPackages.map((p) => (
                          <option key={p.package_id} value={p.package_id}>
                            {p.name} ({naira(p.price)} per {p.period_num} {p.period})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button onClick={saveMembershipChanges}>Save Changes</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
