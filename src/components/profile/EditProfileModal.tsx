import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type EditableProfile = {
  firstName?: string; lastName?: string; gender?: string; birthdate?: string;
  bio?: string; website?: string;
  workTitle?: string; workPlace?: string; currentCity?: string; hometown?: string;
  socialFacebook?: string; socialTwitter?: string; socialInstagram?: string; socialYoutube?: string; socialLinkedin?: string;
  privacyChat?: "me"|"friends"|"public";
  privacyWall?: "me"|"friends"|"public";
  privacyPhotos?: "me"|"friends"|"public";
};

export default function EditProfileModal({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState<EditableProfile>({
    firstName: "", lastName: "", gender: "", birthdate: "",
    bio: "", website: "",
    workTitle: "", workPlace: "", currentCity: "", hometown: "",
    socialFacebook: "", socialTwitter: "", socialInstagram: "", socialYoutube: "", socialLinkedin: "",
    privacyChat: "public", privacyWall: "friends", privacyPhotos: "public",
  });

  // fetch current editable profile once when opening
  const didLoadRef = useRef(false);
  useEffect(() => {
    if (!open || didLoadRef.current) return;
    didLoadRef.current = true;
    (async () => {
      try {
        setErr(null);
        const r = await fetch(`${API_BASE}/api/profile/me`, { headers });
        if (!r.ok) throw new Error("Failed to load");
        const j = await r.json();
        setForm({
          firstName: j.firstName ?? "",
          lastName: j.lastName ?? "",
          gender: j.gender ?? "",
          birthdate: j.birthdate ?? "",
          bio: j.bio ?? "",
          website: j.website ?? "",
          workTitle: j.workTitle ?? "",
          workPlace: j.workPlace ?? "",
          currentCity: j.currentCity ?? "",
          hometown: j.hometown ?? "",
          socialFacebook: j.socialFacebook ?? "",
          socialTwitter: j.socialTwitter ?? "",
          socialInstagram: j.socialInstagram ?? "",
          socialYoutube: j.socialYoutube ?? "",
          socialLinkedin: j.socialLinkedin ?? "",
          privacyChat: (j.privacyChat ?? "public"),
          privacyWall: (j.privacyWall ?? "friends"),
          privacyPhotos: (j.privacyPhotos ?? "public"),
        });
      } catch (e: any) {
        setErr(e?.message || "Failed to load profile");
      }
    })();
  }, [open, headers]);

  const onChange = (k: keyof EditableProfile) => (e: any) => {
    const v = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: v }));
  };

  async function onSubmit() {
    try {
      setBusy(true);
      setErr(null);
      const r = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || "Update failed");
      }
      toast.success("Profile data has been updated successfully")
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      setErr(e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* BASIC */}
          <TabsContent value="basic" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name">
                <Input value={form.firstName} onChange={onChange("firstName")} />
              </Field>
              <Field label="Last name">
                <Input value={form.lastName} onChange={onChange("lastName")} />
              </Field>
              <Field label="Gender">
                <Input value={form.gender} onChange={onChange("gender")} placeholder="male/female/other" />
              </Field>
              <Field label="Birthdate">
                <Input type="date" value={form.birthdate || ""} onChange={onChange("birthdate")} />
              </Field>
            </div>
            <Field label="Bio">
              <Textarea value={form.bio} onChange={onChange("bio")} rows={4} />
            </Field>
            <Field label="Website">
              <Input value={form.website} onChange={onChange("website")} placeholder="https://…" />
            </Field>
          </TabsContent>

          {/* ABOUT */}
          <TabsContent value="about" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Work title">
                <Input value={form.workTitle} onChange={onChange("workTitle")} />
              </Field>
              <Field label="Work place">
                <Input value={form.workPlace} onChange={onChange("workPlace")} />
              </Field>
              <Field label="Current city">
                <Input value={form.currentCity} onChange={onChange("currentCity")} />
              </Field>
              <Field label="Hometown">
                <Input value={form.hometown} onChange={onChange("hometown")} />
              </Field>
            </div>
          </TabsContent>

          {/* SOCIAL */}
          <TabsContent value="social" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Facebook"><Input value={form.socialFacebook} onChange={onChange("socialFacebook")} /></Field>
              <Field label="Twitter / X"><Input value={form.socialTwitter} onChange={onChange("socialTwitter")} /></Field>
              <Field label="Instagram"><Input value={form.socialInstagram} onChange={onChange("socialInstagram")} /></Field>
              <Field label="YouTube"><Input value={form.socialYoutube} onChange={onChange("socialYoutube")} /></Field>
              <Field label="LinkedIn"><Input value={form.socialLinkedin} onChange={onChange("socialLinkedin")} /></Field>
            </div>
          </TabsContent>

          {/* PRIVACY */}
          <TabsContent value="privacy" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField label="Who can chat with me?" value={form.privacyChat!} onChange={onChange("privacyChat")} />
              <SelectField label="Who can post on my wall?" value={form.privacyWall!} onChange={onChange("privacyWall")} />
              <SelectField label="Who can see my photos?" value={form.privacyPhotos!} onChange={onChange("privacyPhotos")} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={onSubmit} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function SelectField({
  label, value, onChange,
}: {
  label: string; value: "me"|"friends"|"public"; onChange: (e: any) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={onChange as any}
        className="h-9 px-3 rounded-md border border-gray-300 bg-white"
      >
        <option value="me">Only me</option>
        <option value="friends">Friends</option>
        <option value="public">Public</option>
      </select>
    </Field>
  );
}
