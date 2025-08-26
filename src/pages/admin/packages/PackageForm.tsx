// src/pages/admin/packages/PackageForm.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader,useAuthHeaderupload } from "@/hooks/useAuthHeader";
import { getPackage, createPackage, updatePackage, type PackageRow } from "@/services/adminPackagesService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Period = "day" | "month" | "year";

export default function PackageForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { accessToken } = useAuth();
  const headers = useAuthHeaderupload(accessToken);
//   const headers1 = useAuthHeaderupload(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<PackageRow>({
    package_id: 0,
    name: "",
    price: "",
    period_num: 30,
    period: "day",
    color: "#000000",
    icon: "",
    package_permissions_group_id: 0,
    allowed_blogs_categories: 0,
    allowed_videos_categories: 0,
    allowed_products: 0,
    verification_badge_enabled: "0",
    boost_posts_enabled: "0",
    boost_posts: 0,
    boost_pages_enabled: "0",
    boost_pages: 0,
    custom_description: "",
    package_order: 0,
    paypal_billing_plan: "",
    stripe_billing_plan: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [keepIcon, setKeepIcon] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !ready) return;
    (async () => {
      try {
        const data = await getPackage(headers, Number(id));
        setForm({
          ...data,
          verification_badge_enabled: data.verification_badge_enabled === "1" || data.verification_badge_enabled === true,
          boost_posts_enabled: data.boost_posts_enabled === "1" || data.boost_posts_enabled === true,
          boost_pages_enabled: data.boost_pages_enabled === "1" || data.boost_pages_enabled === true,
        } as any);
      } catch (e: any) {
        toast.error("Failed to load package", { description: e?.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, ready]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        // booleans to literal "true"/"false" are fine; server maps to "1"/"0"
        if (k === "package_id") return;
        if (k === "icon") return;
        fd.append(k, String(v ?? ""));
      });
      fd.set("verification_badge_enabled", (form.verification_badge_enabled as any) ? "true" : "false");
      fd.set("boost_posts_enabled", (form.boost_posts_enabled as any) ? "true" : "false");
      fd.set("boost_pages_enabled", (form.boost_pages_enabled as any) ? "true" : "false");

      if (isEdit) fd.set("keep_icon", keepIcon ? "true" : "false");
      if (file && (!isEdit || !keepIcon)) fd.append("icon", file);

      if (isEdit) {
        await updatePackage(headers, Number(id), fd);
        toast.success("Package updated");
      } else {
        const r = await createPackage(headers, fd);
        toast.success("Package created");
        navigate(`/admin/packages/${r.id}/edit`, { replace: true });
        return;
      }
      navigate("/admin/packages");
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Package" : "Add New Package"}</CardTitle>
          <CardDescription>Configure a subscription package for the Pro System.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-sm text-gray-500 py-12 text-center">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>

                <div>
                  <Label>Price (NGN)</Label>
                  <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>

                <div>
                  <Label>Paid Every</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={form.period_num}
                      onChange={(e) => setForm({ ...form, period_num: Number(e.target.value || 1) })}
                      className="w-28"
                    />
                    <Select value={form.period} onValueChange={(v: Period) => setForm({ ...form, period: v })}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Color</Label>
                  <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>

                <div className="md:col-span-2">
                  <Label>Icon</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" ref={fileRef} accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    {isEdit && form.icon && (
                      <div className="flex items-center gap-2">
                        <img
                          src={`${import.meta.env.VITE_ASSETS_BASE_URL ?? ""}/${form.icon}`}
                          className="h-12 w-12 rounded object-cover border"
                        />
                        <div className="flex items-center gap-2">
                          <Switch checked={keepIcon} onCheckedChange={setKeepIcon} id="keepicon" />
                          <Label htmlFor="keepicon">Keep current</Label>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Perfect size: 60×60 – 180×180px</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Permissions Group ID</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.package_permissions_group_id}
                    onChange={(e) => setForm({ ...form, package_permissions_group_id: Number(e.target.value || 0) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Maps to your permissions groups table.</p>
                </div>

                <div>
                  <Label>Blogs Categories Allowed</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.allowed_blogs_categories}
                    onChange={(e) => setForm({ ...form, allowed_blogs_categories: Number(e.target.value || 0) })}
                  />
                </div>

                <div>
                  <Label>Videos Categories Allowed</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.allowed_videos_categories}
                    onChange={(e) => setForm({ ...form, allowed_videos_categories: Number(e.target.value || 0) })}
                  />
                </div>

                <div>
                  <Label>Market Products Allowed</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.allowed_products}
                    onChange={(e) => setForm({ ...form, allowed_products: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Verification Badge Enabled</Label>
                      <p className="text-xs text-gray-500">Enable verification badge with this package</p>
                    </div>
                    <Switch
                      checked={!!form.verification_badge_enabled}
                      onCheckedChange={(v) => setForm({ ...form, verification_badge_enabled: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Boost Posts Enabled</Label>
                      <p className="text-xs text-gray-500">Enable “boost posts” feature</p>
                    </div>
                    <Switch
                      checked={!!form.boost_posts_enabled}
                      onCheckedChange={(v) => setForm({ ...form, boost_posts_enabled: v })}
                    />
                  </div>

                  <div>
                    <Label>Posts Boosts (max)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.boost_posts}
                      onChange={(e) => setForm({ ...form, boost_posts: Number(e.target.value || 0) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Boost Pages Enabled</Label>
                      <p className="text-xs text-gray-500">Enable “boost pages” feature</p>
                    </div>
                    <Switch
                      checked={!!form.boost_pages_enabled}
                      onCheckedChange={(v) => setForm({ ...form, boost_pages_enabled: v })}
                    />
                  </div>

                  <div>
                    <Label>Pages Boosts (max)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.boost_pages}
                      onChange={(e) => setForm({ ...form, boost_pages: Number(e.target.value || 0) })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Custom Description</Label>
                <Textarea
                  rows={4}
                  value={form.custom_description ?? ""}
                  onChange={(e) => setForm({ ...form, custom_description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Order</Label>
                  <Input type="number" min={0} value={form.package_order}
                         onChange={(e) => setForm({ ...form, package_order: Number(e.target.value || 0) })} />
                </div>
                <div>
                  <Label>PayPal Billing Plan (optional)</Label>
                  <Input value={form.paypal_billing_plan ?? ""} onChange={(e) => setForm({ ...form, paypal_billing_plan: e.target.value })} />
                </div>
                <div>
                  <Label>Stripe Billing Plan (optional)</Label>
                  <Input value={form.stripe_billing_plan ?? ""} onChange={(e) => setForm({ ...form, stripe_billing_plan: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
                <Button type="button" variant="secondary" onClick={() => navigate("/admin/packages")}>Cancel</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
