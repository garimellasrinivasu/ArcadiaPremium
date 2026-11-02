import { useState } from "react";
import ShowcaseQrCard from "../components/ShowcaseQrCard";

/**
 * Aalaya Arvindham Deewali greeting page, inside the app (temporary, Deewali).
 * Shows the standalone public page (/aalaya-arvindham/) with its QR code on top.
 */
const PAGE = "/aalaya-arvindham/index.html";

export default function AalayaShowcasePage() {
  const [height, setHeight] = useState(2400);
  return (
    <div className="-m-4 md:-m-8 bg-[#F8F6F2]">
      <ShowcaseQrCard id="aalaya" name="Aalaya Arvindham" url="https://arcadiapremium.duckdns.org/aalaya-arvindham/" color="#17252F" />
      <iframe
        src={PAGE}
        title="Aalaya Arvindham · Happy Deewali"
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
