// src/pages/admin/settings/PointsSettings.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { getPointsSettings, savePointsSettings, type PointsSettings } from "@/services/adminSettingsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const numberField = (v: any) => (v === "" || v === null || v === undefined ? 0 : Number(v));

export default function PointsSettingsPage() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [data, setData] = useState<PointsSettings | null>(null);
  const [working, setWorking] = useState(false);

  const load = async () => {
    try {
      const s = await getPointsSettings(headers);
      setData(s);
    } catch (e: any) {
      toast.error("Failed to load points settings", { description: e?.message });
    }
  };

  useEffect(() => { if (ready) load(); }, [ready]);

  const save = async () => {
    if (!data) return;
    setWorking(true);
    try {
      await savePointsSettings(headers, data);
      toast.success("Points settings saved");
      await load();
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setWorking(false);
    }
  };

  if (!data) {
    return <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-6 md:p-7">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-6 md:p-7">
        <h1 className="text-[28px] leading-8 font-extrabold text-slate-900 mb-6">Settings › Points System</h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Column 1 – Toggles */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Enable & Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Points System Enabled</Label>
                  <p className="text-xs text-slate-500">Allow users to earn, hold, and use points.</p>
                </div>
                <Switch
                  checked={data.points_enabled}
                  onCheckedChange={(v) => setData({ ...data, points_enabled: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Points Transfer Enabled</Label>
                  <p className="text-xs text-slate-500">Allow users to transfer points (P2P).</p>
                </div>
                <Switch
                  checked={data.points_money_transfer_enabled}
                  onCheckedChange={(v) => setData({ ...data, points_money_transfer_enabled: v })}
                />
              </div>

              <div>
                <Label className="font-medium">Minimum Withdrawal (points)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_min_withdrawal}
                  onChange={(e) => setData({ ...data, points_min_withdrawal: numberField(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum point balance required to request withdrawal.</p>
              </div>
            </CardContent>
          </Card>

          {/* Column 2 – Limits */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Daily/Monthly Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="font-medium">Limit (Pro users)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_limit_pro}
                  onChange={(e) => setData({ ...data, points_limit_pro: numberField(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Max points a Pro user can earn/spend per period.</p>
              </div>

              <div>
                <Label className="font-medium">Limit (Regular users)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_limit_user}
                  onChange={(e) => setData({ ...data, points_limit_user: numberField(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Max points a regular user can earn/spend per period.</p>
              </div>

              <div>
                <Label className="font-medium">Points per 1 Currency Unit</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.points_per_currency}
                  onChange={(e) => setData({ ...data, points_per_currency: numberField(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Conversion rate (e.g., points per ₦1).</p>
              </div>
            </CardContent>
          </Card>

          {/* Column 3 – Earning Rules */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Earning Rules</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Per Post</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_per_post}
                  onChange={(e) => setData({ ...data, points_per_post: numberField(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Per Post View</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_per_post_view}
                  onChange={(e) => setData({ ...data, points_per_post_view: numberField(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Per Post Reaction</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_per_post_reaction}
                  onChange={(e) => setData({ ...data, points_per_post_reaction: numberField(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Per Post Comment</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_per_post_comment}
                  onChange={(e) => setData({ ...data, points_per_post_comment: numberField(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Per Comment</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_per_comment}
                  onChange={(e) => setData({ ...data, points_per_comment: numberField(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Per Reaction</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_per_reaction}
                  onChange={(e) => setData({ ...data, points_per_reaction: numberField(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Per Follow</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.points_per_follow}
                  onChange={(e) => setData({ ...data, points_per_follow: numberField(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button disabled={working} onClick={save}>{working ? "Saving…" : "Save Changes"}</Button>
          <Button variant="secondary" disabled={working} onClick={() => load()}>Reset</Button>
        </div>
      </div>
    </div>
  );
}
