import { CAFE_ADDRESS, CAFE_NAME } from "~/lib/config";
import { formatDateTime, PAYMENT_LABEL, rupiah } from "~/lib/format";
import type { Order } from "~/lib/types";

/**
 * Builds a receipt-width (80 mm) PDF invoice in the browser and downloads it.
 * jsPDF (~350 KB) loads only when this runs, so it never weighs on page load.
 */
export async function downloadInvoice(order: Order) {
  const { jsPDF } = await import("jspdf");

  const W = 80;
  const M = 5; // side margin
  const right = W - M;
  const LH = 4.2; // body line height
  const items = order.orderItems;

  // Measure first so the page is exactly as tall as the receipt
  const measure = new jsPDF({ unit: "mm", format: [W, 200] });
  measure.setFontSize(8);
  const wrap = (text: string, width: number) => measure.splitTextToSize(text, width) as string[];
  const itemLines = items.map((it) => ({
    it,
    name: wrap(it.menuItems?.name ?? "Menu dihapus", W - 2 * M - 22),
    note: it.note ? wrap(`Catatan: ${it.note}`, W - 2 * M - 4) : [],
  }));
  const addressLines = CAFE_ADDRESS ? wrap(CAFE_ADDRESS, W - 2 * M) : [];
  const height =
    60 + addressLines.length * LH + itemLines.reduce((h, l) => h + (l.name.length + l.note.length + 1) * LH + 1.5, 0);

  const doc = new jsPDF({ unit: "mm", format: [W, Math.max(height, 100)] });
  let y = 10;

  const line = () => {
    doc.setDrawColor(190);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.line(M, y, right, y);
    doc.setLineDashPattern([], 0);
    y += 4;
  };
  const row = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, M, y);
    doc.text(value, right, y, { align: "right" });
    y += LH;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(CAFE_NAME, W / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const a of addressLines) {
    doc.text(a, W / 2, y, { align: "center" });
    y += LH;
  }
  y += 1;
  line();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INVOICE", M, y);
  doc.setFontSize(8);
  doc.text(order.paidAt ? "LUNAS" : "BELUM DIBAYAR", right, y, { align: "right" });
  y += 5;
  doc.setFontSize(8);
  row("No.", order.invoiceNumber);
  row("Tanggal", formatDateTime(order.createdAt));
  if (order.paidAt) row("Dibayar", formatDateTime(order.paidAt));
  row("Pelanggan", order.customerName);
  row("Meja", String(order.tableNumber));
  row("Pembayaran", PAYMENT_LABEL[order.paymentMethod]);
  y += 1;
  line();

  for (const { it, name, note } of itemLines) {
    doc.setFont("helvetica", "bold");
    doc.text(name, M, y);
    doc.text(rupiah(it.priceAtOrder * it.quantity), right, y, { align: "right" });
    y += name.length * LH;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90);
    doc.text(`${it.quantity} x ${rupiah(it.priceAtOrder)}`, M, y);
    y += LH;
    for (const n of note) {
      doc.text(n, M, y);
      y += LH;
    }
    doc.setTextColor(0);
    y += 1.5;
  }
  line();

  doc.setFontSize(10);
  row("Total", rupiah(order.total), true);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.text("Terima kasih atas kunjungan Anda.", W / 2, y, { align: "center" });

  doc.save(`${order.invoiceNumber}.pdf`);
}
