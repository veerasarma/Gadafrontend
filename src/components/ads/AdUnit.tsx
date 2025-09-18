// AdUnit.tsx
import { useEffect } from "react";

export default function AdUnit() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-YOUR_ID"
      data-ad-slot="YOUR_SLOT_ID"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
