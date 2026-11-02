import { QRCodeCanvas } from "qrcode.react";

/** TEMPORARY (Deewali): QR code for a public greeting page, with a PNG download. Remove after Deewali. */
export default function ShowcaseQrCard({ id, name, url, color }: { id: string; name: string; url: string; color: string }) {
  const download = () => {
    const c = document.getElementById(`qr-${id}`) as HTMLCanvasElement | null;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${name} QR.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  return (
    <section className="px-5 pt-5 pb-5 bg-white border-b border-[#E6E0D2] font-sans">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-5">
        <div className="p-3 bg-white rounded-xl border border-[#E6E0D2] shadow-sm">
          <QRCodeCanvas id={`qr-${id}`} value={url} size={160} level="M" marginSize={2} fgColor={color} />
        </div>
        <div className="text-center sm:text-left min-w-0">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500">For verification only</p>
          <h3 className="text-lg font-semibold mt-1" style={{ color }}>Scan to open the {name} greeting page</h3>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 mt-1 break-all hover:underline block">{url}</a>
          <p className="text-xs text-gray-500 mt-1">Opens a separate public page (no login, no live data from the app).</p>
          <button onClick={download} className="mt-3 px-4 py-2 rounded-full text-white text-xs" style={{ background: color }}>
            ⬇ Download QR image
          </button>
        </div>
      </div>
    </section>
  );
}
