import * as XLSX from "xlsx";

export type ConvertResult = { blob: Blob; name: string };

/**
 * PDF → XLSX (client-side).
 * Uses pdfjs-dist to extract text per page, then groups text items into rows
 * by Y coordinate and into columns by X-gap heuristic, building a sheet per page.
 */
export async function convertPdfToXlsx(
  file: File,
  onProgress?: (p: number) => void,
): Promise<ConvertResult> {
  const pdfjs = await import("pdfjs-dist");
  // Use a CDN worker matching the installed version
  (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjs as any).version}/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;

  const workbook = XLSX.utils.book_new();
  const totalPages = pdf.numPages as number;

  for (let p = 1; p <= totalPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = (content.items as any[]).map((it) => ({
      str: String(it.str ?? ""),
      x: it.transform[4] as number,
      y: it.transform[5] as number,
      w: (it.width as number) || 0,
    }));

    // Group items into rows by Y (rounded)
    const rowMap = new Map<number, typeof items>();
    for (const it of items) {
      if (!it.str.trim()) continue;
      const key = Math.round(it.y);
      const arr = rowMap.get(key) ?? [];
      arr.push(it);
      rowMap.set(key, arr);
    }
    const rowsSorted = [...rowMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, arr]) => arr.sort((a, b) => a.x - b.x));

    // Detect column boundaries from clustered X positions
    const allX = items.map((i) => i.x).sort((a, b) => a - b);
    const cols: number[] = [];
    let last = -Infinity;
    for (const x of allX) {
      if (x - last > 25) {
        cols.push(x);
        last = x;
      }
    }

    const sheetData: (string | number)[][] = rowsSorted.map((row) => {
      const cells: string[] = new Array(Math.max(cols.length, 1)).fill("");
      for (const it of row) {
        let idx = 0;
        for (let c = cols.length - 1; c >= 0; c--) {
          if (it.x >= cols[c] - 2) {
            idx = c;
            break;
          }
        }
        cells[idx] = (cells[idx] ? cells[idx] + " " : "") + it.str.trim();
      }
      return cells.map((c) => {
        const n = Number(c.replace(",", "."));
        return c !== "" && !isNaN(n) && c.match(/^-?\d+([.,]\d+)?$/) ? n : c;
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData.length ? sheetData : [[""]]);
    XLSX.utils.book_append_sheet(workbook, ws, `Pagina ${p}`);
    onProgress?.(p / totalPages);
  }

  const out = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const name = file.name.replace(/\.pdf$/i, "") + ".xlsx";
  return { blob, name };
}

/**
 * XLSX → PDF (client-side).
 * Reads workbook, builds a PDF with one table per sheet using jspdf-autotable.
 */
export async function convertXlsxToPdf(file: File): Promise<ConvertResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = (autoTableMod as any).default ?? (autoTableMod as any);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  wb.SheetNames.forEach((name, idx) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false, defval: "" });
    if (idx > 0) doc.addPage();
    doc.setFontSize(14);
    doc.text(name, 40, 36);
    if (rows.length === 0) {
      doc.setFontSize(10);
      doc.text("(foglio vuoto)", 40, 60);
      return;
    }
    const head = [rows[0].map((c) => String(c ?? ""))];
    const body = rows.slice(1).map((r) => r.map((c) => String(c ?? "")));
    autoTable(doc, {
      head,
      body,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [51, 65, 148], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      margin: { left: 30, right: 30 },
    });
  });

  const blob = doc.output("blob");
  const outName = file.name.replace(/\.(xlsx?|xls)$/i, "") + ".pdf";
  return { blob, name: outName };
}
