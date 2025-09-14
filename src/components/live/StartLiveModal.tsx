import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { startLive } from "@/services/liveService";
import { toast } from "sonner";

export default function StartLiveModal({
  open, onOpenChange, onStarted
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStarted: (data: { postId: number; channel: string; uid: number; token?: string }) => void;
}) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState<"public"|"friends"|"only_me">("public");
  const [thumb, setThumb] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function handleStart() {
    setBusy(true);
    try {
      const j = await startLive({ title, privacy, videoThumbnail: thumb }, headers);
      toast.success("Live started");
      onStarted(j);
      onOpenChange(false);
    } catch (e:any) {
      toast.error(e?.message || "Could not start live");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v)=>!busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Go Live</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="My live stream…" />
          </div>
          <div>
            <Label>Privacy</Label>
            <select
              className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
              value={privacy}
              onChange={e=>setPrivacy(e.target.value as any)}
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="only_me">Only me</option>
            </select>
          </div>
          <div>
            <Label>Thumbnail URL (optional)</Label>
            <Input value={thumb} onChange={e=>setThumb(e.target.value)} placeholder="/photos/2025/01/thumbnail.png" />
          </div>
          <p className="text-xs text-slate-500">
            After starting, the post will appear in the feed with a LIVE badge. You can plug in your streaming SDK (Agora) using the
            returned channel & uid.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleStart} disabled={busy}>{busy ? "Starting…" : "Start Live"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
