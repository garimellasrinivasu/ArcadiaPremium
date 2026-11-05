import { useState } from "react";
import ShowcaseQrCard from "../components/ShowcaseQrCard";

/**
 * Deewali greeting page for a project, inside the app (temporary, Deewali).
 * Shows the standalone public page (/<slug>/) with its QR code on top.
 */
export default function StaticShowcasePage({ slug, name, color }: { slug: string; name: string; color: string }) {
  const [height, setHeight] = useState(2400);
  return (
    <div className="-m-4 md:-m-8 bg-[#F8F6F2]">
      <ShowcaseQrCard id={slug} name={name} url={`https://arcadiapremium.duckdns.org/${slug}/`} color={color} />
      <iframe
        src={`/${slug}/index.html`}
        title={`${name} · Happy Deewali`}
        className="w-full block border-0"
        style={{ height }}
        onLoad={(e) => {
          // Same-origin page: size the frame to its content so the app scrolls, not the frame
          const doc = e.currentTarget.contentDocument;
          if (doc) setHeight(doc.documentElement.scrollHeight + 8);
        }}
      />
    </div>
  );
}
