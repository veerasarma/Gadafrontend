import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import clsx from "clsx";

type ShareStripProps = {
  url: string;
  text?: string;
  title?: string;
  className?: string;
  /** "sm" makes the chips shorter & tighter */
  size?: "sm" | "md";
  /** Optional: only for Messenger */
  fbAppId?: string;
  fbRedirectUri?: string;
};

export default function ShareStrip({
  url,
  text = "Join me here!",
  title = "Check this out",
  className,
  size = "sm",
  fbAppId,
  fbRedirectUri,
}: ShareStripProps) {
  if (!url) return null;

  const U = encodeURIComponent(url);
  const T = encodeURIComponent(text);
  const TT = encodeURIComponent(title);

  const items: Array<{
    key: string;
    label: string;
    href: string;
    color: string;
    hidden?: boolean;
  }> = [
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${U}`, color: "#1877F2" },
    { key: "x",        label: "X",        href: `https://twitter.com/intent/tweet?url=${U}&text=${T}`,              color: "#000000" },
    { key: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${U}`,         color: "#0A66C2" },
    { key: "whatsapp", label: "WhatsApp", href: `https://api.whatsapp.com/send?text=${T}%20${U}`,                   color: "#25D366" },
    { key: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${U}&text=${T}`,                        color: "#0088CC" },
    { key: "reddit",   label: "Reddit",   href: `https://www.reddit.com/submit?url=${U}&title=${TT}`,               color: "#FF4500" },
    { key: "email",    label: "Email",    href: `mailto:?subject=${TT}&body=${T}%0A%0A${U}`,                        color: "#475569" },
    {
      key: "messenger",
      label: "Messenger",
      href: `https://www.facebook.com/dialog/send?link=${U}&app_id=${encodeURIComponent(
        fbAppId || ""
      )}&redirect_uri=${encodeURIComponent(fbRedirectUri || "")}`,
      color: "#1877F2",
      hidden: !fbAppId || !fbRedirectUri,
    },
  ];

  const canNativeShare = typeof navigator !== "undefined" && !!(navigator as any).share;

  const onNativeShare = async () => {
    try {
      await (navigator as any).share({ title, text, url });
    } catch {/* user cancelled */}
  };

  const chipBase =
    size === "sm"
      ? "h-8 px-2 text-[12px]"
      : "h-9 px-3 text-[13px]";

  return (
    <div className={clsx("flex flex-wrap items-center gap-2", className)}>
      {canNativeShare && (
        <Button
          type="button"
          onClick={onNativeShare}
          className={clsx(chipBase, "rounded-full bg-gray-900 hover:bg-gray-800")}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share…
        </Button>
      )}

      {items.filter(i => !i.hidden).map(i => (
        <a
          key={i.key}
          href={i.href}
          target="_blank"
          rel="noreferrer noopener"
          className={clsx(
            chipBase,
            "inline-flex items-center rounded-full text-white font-medium"
          )}
          style={{ backgroundColor: i.color }}
          aria-label={`Share on ${i.label}`}
          title={`Share on ${i.label}`}
        >
          {i.label}
        </a>
      ))}
    </div>
  );
}
