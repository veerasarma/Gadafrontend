import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { toast } from "sonner";
import { getAdsSettings, saveAdsSettings } from "@/services/adminAdsSettingsService";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminAdsSettings() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [form, setForm] = useState<any>({
    ads_enabled: "0",
    ads_approval_enabled: "0",
    ads_author_view_enabled: "0",
    ads_cost_view: "0",
    ads_cost_click: "0",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getAdsSettings(headers);
        if (res?.ok) {
          setForm(res.settings);
        } else toast.error(res?.error || "Failed to load settings");
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveAdsSettings(form, headers);
      if (res?.ok) toast.success("Settings saved");
      else toast.error(res?.error || "Failed to save");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <h2 className="text-2xl font-semibold mb-4">Ads Settings</h2>

      <div className="space-y-4 bg-white p-6 rounded-lg shadow">
        {/* Ads Campaigns */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Ads Campaigns</h3>
            <p className="text-sm text-gray-500">
              Allow users to create ads (enabling will also enable wallet by default).
            </p>
          </div>
          <Switch
            checked={form.ads_enabled === "1"}
            onCheckedChange={(val) => setForm((f: any) => ({ ...f, ads_enabled: val ? "1" : "0" }))}
          />
        </div>

        {/* Approval */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Ads Campaigns Approval System</h3>
            <p className="text-sm text-gray-500">
              Turn the approval system On and Off (if disabled all campaigns will be auto-approved).
            </p>
          </div>
          <Switch
            checked={form.ads_approval_enabled === "1"}
            onCheckedChange={(val) => setForm((f: any) => ({ ...f, ads_approval_enabled: val ? "1" : "0" }))}
          />
        </div>

        {/* Author View */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Ads Author Can See His Ads</h3>
            <p className="text-sm text-gray-500">
              Allow the author of ads to see them (disable = author can’t see own ads).
            </p>
          </div>
          <Switch
            checked={form.ads_author_view_enabled === "1"}
            onCheckedChange={(val) => setForm((f: any) => ({ ...f, ads_author_view_enabled: val ? "1" : "0" }))}
          />
        </div>

        {/* Cost fields */}
        <div>
          <label className="block font-semibold mb-1">Cost by View</label>
          <Input
            type="number"
            value={form.ads_cost_view}
            onChange={(e) => setForm((f: any) => ({ ...f, ads_cost_view: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Cost by Click</label>
          <Input
            type="number"
            value={form.ads_cost_click}
            onChange={(e) => setForm((f: any) => ({ ...f, ads_cost_click: e.target.value }))}
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
