import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CmsPage, onBand } from "~/components/cms-shell";
import { CAFE_NAME } from "~/lib/config";
import { ADMIN, requireUser } from "~/lib/session";
import { Icon } from "~/components/icon";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export async function clientLoader() {
  await requireUser(ADMIN);
  return null;
}

const MAX_TABLES = 100;
const tableUrl = (base: string, n: number) => `${base.replace(/\/$/, "")}/?meja=${n}`;

export default function TableQr() {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("10");
  const [base, setBase] = useState("");
  const [codes, setCodes] = useState<{ n: number; svg: string }[]>([]);
  useEffect(() => setBase(window.location.origin), []);

  const a = Number(from);
  const b = Number(to);
  const rangeError =
    !Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b > 1000
      ? "Nomor meja 1 sampai 1000."
      : a > b
        ? "Nomor awal harus lebih kecil dari nomor akhir."
        : b - a + 1 > MAX_TABLES
          ? `Maksimal ${MAX_TABLES} meja sekali buat.`
          : "";
  let baseError = "";
  try {
    if (base) new URL(base);
  } catch {
    baseError = "Alamat tidak valid. Contoh: https://kafe-anda.com";
  }

  // Regenerate as the inputs change; the QR library loads only on this page
  useEffect(() => {
    if (rangeError || baseError || !base) return setCodes([]);
    let stale = false;
    import("qrcode").then(async (QR) => {
      const list = await Promise.all(
        Array.from({ length: b - a + 1 }, async (_, i) => ({
          n: a + i,
          svg: await QR.toString(tableUrl(base, a + i), { type: "svg", margin: 0, errorCorrectionLevel: "M" }),
        })),
      );
      if (!stale) setCodes(list);
    });
    return () => {
      stale = true;
    };
  }, [a, b, base, rangeError, baseError]);

  const downloadPng = async (n: number) => {
    try {
      const QR = await import("qrcode");
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size + 260;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const qr = document.createElement("canvas");
      await QR.toCanvas(qr, tableUrl(base, n), { width: size - 160, margin: 0, errorCorrectionLevel: "M" });
      ctx.drawImage(qr, 80, 80);
      ctx.fillStyle = "#202020";
      ctx.textAlign = "center";
      ctx.font = "700 96px Helvetica, Arial, sans-serif";
      ctx.fillText(`Meja ${n}`, size / 2, size + 90);
      ctx.font = "400 44px Helvetica, Arial, sans-serif";
      ctx.fillStyle = "#4C4C4C";
      ctx.fillText(`Pindai untuk pesan · ${CAFE_NAME}`, size / 2, size + 170);
      const link = document.createElement("a");
      link.download = `qr-meja-${n}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast.error("Gambar QR gagal dibuat. Coba lagi.");
    }
  };

  return (
    <CmsPage
      title="QR meja"
      lead="Setiap QR membuka menu dengan nomor meja terisi. Pelanggan hanya bisa memesan lewat QR ini."
      actions={
        <Button className={onBand} size="sm" onClick={() => window.print()} disabled={!codes.length}>
          <Icon name="print" />
          Cetak semua
        </Button>
      }
    >
      <Card data-print-hide>
        <CardContent className="grid gap-4 md:grid-cols-[8rem_8rem_minmax(0,1fr)] md:items-start">
          <Field data-invalid={!!rangeError}>
            <FieldLabel htmlFor="qr-from">Dari meja</FieldLabel>
            <Input id="qr-from" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))} aria-invalid={!!rangeError} />
          </Field>
          <Field data-invalid={!!rangeError}>
            <FieldLabel htmlFor="qr-to">Sampai meja</FieldLabel>
            <Input id="qr-to" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))} aria-invalid={!!rangeError} />
          </Field>
          <Field data-invalid={!!baseError}>
            <FieldLabel htmlFor="qr-base">Alamat halaman pesan</FieldLabel>
            <Input id="qr-base" type="url" value={base} onChange={(e) => setBase(e.target.value.trim())} aria-invalid={!!baseError} />
            {baseError ? (
              <FieldError>{baseError}</FieldError>
            ) : (
              <FieldDescription>Ganti bila konsol dibuka dari alamat lain dari yang dipakai pelanggan.</FieldDescription>
            )}
          </Field>
          {rangeError && <FieldError className="md:col-span-3">{rangeError}</FieldError>}
        </CardContent>
      </Card>

      {codes.length > 0 && (
        <ul data-print-root className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 print:grid-cols-3 print:gap-3">
          {codes.map(({ n, svg }) => (
            <li
              key={n}
              className="grid justify-items-center gap-3 rounded-2xl bg-white p-5 text-center text-[#202020] shadow-ds-1 break-inside-avoid print:rounded-none print:border print:border-[#BDBDBD] print:shadow-none"
            >
              <span className="type-body-xs text-[#4C4C4C]">{CAFE_NAME}</span>
              <div className="w-full max-w-44 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
              <span className="type-label-l leading-tight">Meja {n}</span>
              <span className="type-body-xs text-[#4C4C4C]">Pindai untuk pesan</span>
              <Button variant="outline" size="xs" data-print-hide onClick={() => downloadPng(n)} className="bg-white text-[#25282A]">
                <Icon name="downloads" />
                PNG
              </Button>
            </li>
          ))}
        </ul>
      )}
    </CmsPage>
  );
}
