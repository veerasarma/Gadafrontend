// src/pages/admin/WalletSettings.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { getWalletSettings, updateWalletSettings, type WalletSettings } from "@/services/adminSettingsService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function WalletSettingsPage() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const authReady = useMemo(() => "Authorization" in headers, [headers]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WalletSettings>({
    wallet_min_withdrawal: null,
    wallet_max_transfer: null,
    wallet_withdrawal_enabled: true,
  });
  const [original, setOriginal] = useState<WalletSettings | null>(null);

  useEffect(() => {
    if (!authReady) return;
    setLoading(true);
    getWalletSettings(headers)
      .then((res) => {
        setData(res);
        setOriginal(res);
      })
      .catch((e) => toast.error("Failed to load wallet settings", { description: String(e) }))
      .finally(() => setLoading(false));
  }, [authReady]);

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(original), [data, original]);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateWalletSettings(headers, data);
      toast.success("Wallet settings saved");
      setOriginal(data);
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    if (original) setData(original);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Settings</CardTitle>
          <CardDescription>Configure withdrawal and transfer limits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
          ) : (
            <>
              {/* Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled" className="text-base">Enable Withdrawals</Label>
                  <p className="text-sm text-gray-500">Turn wallet withdrawals on/off for all users.</p>
                </div>
                <Switch
                  id="enabled"
                  checked={data.wallet_withdrawal_enabled}
                  onCheckedChange={(v) =>
                    setData((d) => ({ ...d, wallet_withdrawal_enabled: !!v }))
                  }
                />
              </div>

              {/* Min withdrawal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min" className="text-base">Minimum Withdrawal (₦)</Label>
                  <Input
                    id="min"
                    type="number"
                    min={0}
                    placeholder="e.g., 1000"
                    value={data.wallet_min_withdrawal ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        wallet_min_withdrawal:
                          e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="mt-2 h-11"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use the app default.</p>
                </div>

                {/* Max transfer */}
                <div>
                  <Label htmlFor="max" className="text-base">Max Transfer (₦)</Label>
                  <Input
                    id="max"
                    type="number"
                    min={0}
                    placeholder="e.g., 500000"
                    value={data.wallet_max_transfer ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        wallet_max_transfer:
                          e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="mt-2 h-11"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to disable the limit.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={onSave} disabled={!dirty || saving} className="h-11">
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="secondary" onClick={onReset} disabled={!dirty} className="h-11">
                  Reset
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
