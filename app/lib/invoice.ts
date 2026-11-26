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

  // Lays the receipt out on `doc` and returns where the content ends. Run once on a tall scratch
  // page to measure, then on a page cut to that height, so nothing is ever clipped.
  const draw = (doc: InstanceType<typeof jsPDF>) => {
    let y = 10;
    const wrap = (text: string, width: number) => doc.splitTextToSize(text, width) as string[];
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
    for (const a of CAFE_ADDRESS ? wrap(CAFE_ADDRESS, W - 2 * M) : []) {
      doc.text(a, W / 2, y, { align: "center" });
      y += LH;
    }
    y += 1;
    line();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("INVOICE", M, y);
    doc.setFontSize(8);
    doc.text(order.paidAt ? "SUDAH DIBAYAR" : "BELUM DIBAYAR", right, y, { align: "right" });
    y += 5;
    row("No.", order.invoiceNumber);
    row("Tanggal", formatDateTime(order.createdAt));
    if (order.paidAt) row("Dibayar", formatDateTime(order.paidAt));
    row("Pelanggan", order.customerName);
    row("Meja", String(order.tableNumber));
    row("Pembayaran", PAYMENT_LABEL[order.paymentMethod]);
    y += 1;
    line();

    for (const it of order.orderItems) {
      doc.setFont("helvetica", "bold");
      const name = wrap(it.menuItems?.name ?? "Menu dihapus", W - 2 * M - 22);
      doc.text(name, M, y);
      doc.text(rupiah(it.priceAtOrder * it.quantity), right, y, { align: "right" });
      y += name.length * LH;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90);
      doc.text(`${it.quantity} × ${rupiah(it.priceAtOrder)}`, M, y);
      y += LH;
      for (const n of it.note ? wrap(`Catatan: ${it.note}`, W - 2 * M) : []) {
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
    return y;
  };

  const end = draw(new jsPDF({ unit: "mm", format: [W, 2000] }));
  const doc = new jsPDF({ unit: "mm", format: [W, Math.max(end + 8, 100)] });
  draw(doc);
  doc.save(`${order.invoiceNumber}.pdf`);
}
