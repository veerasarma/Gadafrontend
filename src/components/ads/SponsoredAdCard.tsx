import { useEffect, useRef, useState } from "react";
import { serveAd, trackClick, trackView, getAudienceHints } from "@/services/adsService";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { Loader2, ExternalLink } from "lucide-react";
import { stripUploads } from '@/lib/url';
type Placement = "newsfeed" | "sidebar";
type AdRow = {
  campaign_id: number;
  campaign_bidding: "click" | "view";
  ads_title: string | null;
  ads_description: string | null;
  ads_image: string | null;
  ads_url: string | null;
  ads_placement: Placement;
};

const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
function useIntersectionOnce<T extends HTMLElement>(rootMargin = "0px") {
  const ref = useRef<T | null>(null);
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isVisible, rootMargin]);
  return { ref, isVisible };
}

export default function SponsoredAdCard({
  placement,
  className = "",
}: {
  placement: Placement;
  className?: string;
}) {
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [ad, setAd] = useState<AdRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);
  const [viewSent, setViewSent] = useState(false);

  // ---- derive audience hints ----
  const [audience, setAudience] = useState<{ country_id?: number; gender?: string; relationship?: string }>({});

  useEffect(() => {
    let mounted = true;

    // 1) Try from context (if your AuthContext exposes user_country_id)
    const fromCtx = user && (user as any).country_id ? { country_id: (user as any).country_id } : {};

    if (fromCtx.country_id) {
      setAudience((s) => ({ ...s, ...fromCtx }));
      return; // enough to serve immediately
    }

    // 2) Fallback to API /whoami
    (async () => {
      try {
        const r = await getAudienceHints(headers);
        if (!mounted) return;
        if (r?.ok) {
          setAudience({
            country_id: r.country_id || undefined,
            gender: r.gender || undefined,
            relationship: r.relationship || undefined,
          });
        }
      } catch {
        // silent
      }
    })();

    return () => { mounted = false; };
  }, [user, accessToken]);

  // ---- fetch ad when hints or placement ready ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const q: any = { placement };
        if (audience.country_id) q.country_id = audience.country_id;
        if (audience.gender) q.gender = audience.gender;
        if (audience.relationship) q.relationship = audience.relationship;

        const res = await serveAd(q, headers);
        if (!mounted) return;
        if (res?.ok && res?.item) {
          setAd(res.item);
          setErr(null);
        } else {
          setAd(null);
          setErr(res?.error || "No ad");
        }
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load ad");
        setAd(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [placement, audience.country_id, audience.gender, audience.relationship, accessToken]);

  // view tracking
  const { ref, isVisible } = useIntersectionOnce<HTMLDivElement>("120px");
  useEffect(() => {
    if (!ad || viewSent || !isVisible) return;
    setViewSent(true);
    trackView(ad.campaign_id, headers).catch(() => {});
  }, [ad, isVisible, viewSent, headers]);

  const onClick = () => {
    if (!ad) return;
    trackClick(ad.campaign_id, headers).catch(() => {});
    if (ad.ads_url) window.open(ad.ads_url, "_blank", "noopener,noreferrer");
  };

  // --- render ---
  if (loading) {
    return (
      <div className={`rounded-2xl border bg-white p-4 flex items-center justify-center ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
      </div>
    );
  }
  if (!ad) return null;

  const isSidebar = placement === "sidebar";

  return (
    <div ref={ref} className={`rounded-2xl border bg-white overflow-hidden ${className}`} role="region" aria-label="Sponsored">
      <div className="px-4 pt-4 flex items-center gap-2 text-sm text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="text-yellow-500">📣</span>
          <span className="font-semibold">Sponsored</span>
        </span>
      </div>

      {ad.ads_image && (
        <div className={`${isSidebar ? "aspect-[16/10]" : "aspect-[16/9]"} w-full bg-gray-100 cursor-pointer`} onClick={onClick}>
          <img src={API_BASE_RAW+'/uploads/'+stripUploads(ad.ads_image)} alt={ad.ads_title || "Sponsored"} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="px-4 py-3">
        {ad.ads_title && (
          <div onClick={onClick} className="font-semibold text-gray-900 hover:underline cursor-pointer line-clamp-2" title={ad.ads_title || ""}>
            {ad.ads_title}
          </div>
        )}
        {ad.ads_description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ad.ads_description}</p>}
        {ad.ads_url && (
          <button onClick={onClick} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple-600 text-white px-4 py-2 hover:bg-purple-700">
            Learn more <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
