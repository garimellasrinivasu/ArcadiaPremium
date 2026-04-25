export default function SaleQuotePage() {
  return (
    <div className="h-full -m-8">
      <iframe
        src="/sale-sheet.html"
        title="Villa Cost Calculator"
        className="w-full border-none"
        style={{ height: "calc(100vh - 100px)" }}
      />
    </div>
  );
}
