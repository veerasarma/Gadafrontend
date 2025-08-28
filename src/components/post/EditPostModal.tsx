// src/components/post/EditPostModal.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type Props = {
  open: boolean;
  postId: number | string;
  initialText: string;
  initialPrivacy?: "public" | "friends" | "only_me";
  authKey: string;
  onClose: () => void;
  onSaved: (updatedPost: any) => void;
};

export default function EditPostModal({
  open, postId, initialText, initialPrivacy = "public", authKey, onClose, onSaved
}: Props) {
  const [text, setText] = useState(initialText);
  const [privacy, setPrivacy] = useState<"public"|"friends"|"only_me">(initialPrivacy);
  const [saving, setSaving] = useState(false);

  const disabled = useMemo(() => saving || !text.trim(), [saving, text]);

  async function handleSave() {
    if (disabled) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/posts/edit/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authKey ? { Authorization: authKey } : {}),
        },
        body: JSON.stringify({ text: text.trim(), privacy }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to update");
      toast.success("Post has been updated successfully")
      onSaved(j.post);
      onClose();
    } catch (e) {
      console.error(e);
      // TODO: toast error
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Update your post…"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Privacy</label>
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as any)}
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="only_me">Only me</option>
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={disabled}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}