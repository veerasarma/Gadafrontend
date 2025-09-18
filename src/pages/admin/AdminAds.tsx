import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  adminApproveAd,
  adminDeclineAd,
  adminDeleteAd,
  adminGetAd,
  adminListAds,
  adminToggleActive,
} from "@/services/adminAdsService";
import { stripUploads } from '@/lib/url';

const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

// Optional: a tiny drawer to preview an ad
function ViewDrawer({ open, onOpenChange, ad }: { open: boolean; onOpenChange: (v: boolean) => void; ad: any | null }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[520px] bg-white shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ad Details</h3>
          <button onClick={() => onOpenChange(false)}>✕</button>
        </div>
        {!ad ? (
          <div className="text-sm text-gray-500">No data</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div><span className="font-medium">Title:</span> {ad.campaign_title}</div>
            <div><span className="font-medium">User:</span> {ad.user_name} (#{ad.user_id})</div>
            <div><span className="font-medium">Budget:</span> ₦{Number(ad.campaign_budget).toFixed(2)}</div>
            <div><span className="font-medium">Spend:</span> ₦{Number(ad.campaign_spend).toFixed(2)}</div>
            <div><span className="font-medium">Bidding:</span> {ad.campaign_bidding}</div>
            <div><span className="font-medium">Clicks / Views:</span> {ad.campaign_clicks} / {ad.campaign_views}</div>
            <div><span className="font-medium">Placement:</span> {ad.ads_placement}</div>
            <div><span className="font-medium">Start:</span> {new Date(ad.campaign_start_date).toLocaleString()}</div>
            <div><span className="font-medium">End:</span> {new Date(ad.campaign_end_date).toLocaleString()}</div>
            {ad.ads_image && (
              <div>
                <span className="font-medium block mb-1">Image</span>
                <img src={API_BASE_RAW+'/uploads/'+stripUploads(ad.ads_image)} className="rounded-md max-h-64" />
              </div>
            )}
            {ad.ads_url && (
              <div className="mt-2">
                <a className="text-indigo-600 underline" href={ad.ads_url} target="_blank">Visit target URL</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAds() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewAd, setViewAd] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await adminListAds({ status: tab, page, limit: pageSize, search }, headers);
      if (!res?.ok) throw new Error(res?.error || "Failed to load");
      setRows(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      toast.error(e.message || "Failed to load ads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, pageSize, search, accessToken]);

  return (
    <div className="p-6 space-y-4">
      {/* Tabs + search row */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          placeholder="Search title or user…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="w-full md:w-80"
        />

        <div className="ml-auto flex gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => load()} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-56">By</TableHead>
              <TableHead className="w-32">Budget</TableHead>
              <TableHead className="w-32">Spend</TableHead>
              <TableHead className="w-40">Clicks/Views</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-56">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const active =
                r.campaign_is_active === 1 || r.campaign_is_active === "1";
              const clicks = Number(r.campaign_clicks || 0);
              const views = Number(r.campaign_views || 0);

              return (
                <TableRow key={r.campaign_id}>
                  <TableCell>{r.campaign_id}</TableCell>
                  <TableCell className="whitespace-nowrap truncate">{r.campaign_title}</TableCell>
                  <TableCell className="whitespace-nowrap truncate">{r.user_name}</TableCell>
                  <TableCell>₦{Number(r.campaign_budget).toFixed(2)}</TableCell>
                  <TableCell>₦{Number(r.campaign_spend).toFixed(2)}</TableCell>
                  <TableCell>
                    {clicks > 0 ? `${clicks} Clicks` : `${views} Views`}
                  </TableCell>
                  <TableCell>
                    {active ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-red-50 text-red-700 border border-red-200">
                        Not Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const res = await adminGetAd(r.campaign_id, headers);
                          if (res?.ok) {
                            setViewAd(res.item);
                            setViewOpen(true);
                          } else toast.error(res?.error || "Failed to fetch");
                        }}
                        title="View"
                      >
                        👁
                      </Button>

                      {tab === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={async () => {
                              const rs = await adminApproveAd(r.campaign_id, headers);
                              if (rs?.ok) {
                                toast.success("Approved");
                                load();
                              } else toast.error(rs?.error || "Approve failed");
                            }}
                            title="Approve"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600"
                            onClick={async () => {
                              const rs = await adminDeclineAd(r.campaign_id, headers);
                              if (rs?.ok) {
                                toast.success("Declined");
                                load();
                              } else toast.error(rs?.error || "Decline failed");
                            }}
                            title="Decline"
                          >
                            ✕
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const rs = await adminToggleActive(r.campaign_id, !active, headers);
                              if (rs?.ok) {
                                toast.success(rs.active ? "Activated" : "Paused");
                                // Optimistic update
                                setRows((prev) =>
                                  prev.map((x) =>
                                    x.campaign_id === r.campaign_id ? { ...x, campaign_is_active: rs.active ? "1" : "0" } : x
                                  )
                                );
                              } else toast.error(rs?.error || "Status update failed");
                            }}
                            title={active ? "Pause" : "Activate"}
                          >
                            {active ? "Pause" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600"
                            onClick={async () => {
                              if (!confirm(`Delete "${r.campaign_title}"?`)) return;
                              const rs = await adminDeleteAd(r.campaign_id, headers);
                              if (rs?.ok) {
                                toast.success("Deleted");
                                load();
                              } else toast.error(rs?.error || "Delete failed");
                            }}
                            title="Delete"
                          >
                            🗑
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                  No ads found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages} — {total} ads
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Drawer */}
      <ViewDrawer open={viewOpen} onOpenChange={setViewOpen} ad={viewAd} />
    </div>
  );
}
