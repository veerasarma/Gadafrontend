import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { fetchReportCategories, submitReport } from "@/services/reportsService";
import { toast } from "sonner";

type Category = {
  category_id: number;
  category_parent_id: number;
  category_name: string;
  category_description: string;
  category_order: number;
};

export default function ReportPostModal({
  postId,
  open,
  onOpenChange,
}: {
  postId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [cats, setCats] = useState<Category[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open || cats) return;
    (async () => {
      try {
        const j = await fetchReportCategories(headers);
        setCats(Array.isArray(j?.data) ? j.data : []);
      } catch {
        toast.error("Failed to load reasons");
      }
    })();
  }, [open, cats, headers]);

  function reset() {
    setSelected(null);
    setReason("");
  }

  async function handleSubmit() {
    if (!selected) {
      toast.error("Please choose a reason");
      return;
    }
    setBusy(true);
    try {
      await submitReport({ nodeId: postId, nodeType: "post", categoryId: selected, reason }, headers);
      toast.success("Thanks, we’ve received your report.");
      onOpenChange(false);
      reset();
    } catch {
      toast.error("Could not submit report");
    } finally {
      setBusy(false);
    }
  }

  const topCats = useMemo(
    () => (cats || []).filter(c => c.category_parent_id === 0).sort((a,b) => a.category_order - b.category_order),
    [cats]
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Report post</DialogTitle>
          <DialogDescription>
            Tell us what’s wrong. Reports are anonymous to the post author.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Reason</Label>
            <ScrollArea className="h-[220px] rounded border">
              <RadioGroup value={selected ? String(selected) : ""} onValueChange={(v) => setSelected(Number(v))} className="p-3">
                {topCats.map(c => (
                  <div key={c.category_id} className="flex items-start gap-3 py-2">
                    <RadioGroupItem id={`cat-${c.category_id}`} value={String(c.category_id)} />
                    <label htmlFor={`cat-${c.category_id}`} className="cursor-pointer">
                      <div className="font-medium">{c.category_name}</div>
                      {c.category_description && (
                        <div className="text-xs text-slate-500">{c.category_description}</div>
                      )}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          </div>

          <div>
            <Label htmlFor="report-reason" className="mb-2 block">Additional details (optional)</Label>
            <Textarea
              id="report-reason"
              placeholder="Add context for our team"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[90px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
