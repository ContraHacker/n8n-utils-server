import { Router } from "express";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const router = Router();

router.post("/extract-urls-from-pdf", async (req, res, next) => {

  try {

    const { pdf_url } = req.body;

    if (typeof pdf_url !== "string" || !pdf_url.startsWith("http")) {
      return res.status(400).json({
        error: "invalid_input",
        message: "pdf_url must be a valid URL",
      });
    }

    // ---- Fetch PDF ----
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(pdf_url, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return res.status(400).json({
        error: "pdf_fetch_failed",
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("pdf")) {
      return res.status(400).json({
        error: "not_a_pdf",
        content_type: contentType,
      });
    }

    const buffer = await response.arrayBuffer();

    const result = await extract_urls_from_pdf_buffer(buffer);

    return res.status(200).json({
      pdf_url,
      url_count: result.urls.length,
      urls: result.urls,
      meta: {
        page_count: result.page_count,
        pages_scanned: result.pages_scanned,
      },
    });
  }

  catch (err: any) {

    if (err.name === "AbortError") {
      return res.status(408).json({
        error: "pdf_fetch_timeout",
      });
    }

    next(err);

  }

});

export default router;

const URL_REGEX = /\bhttps?:\/\/[^\s<>"')]+/gi;

function is_valid_http_url(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export async function extract_urls_from_pdf_buffer(
  buffer: ArrayBuffer,
  opts?: {
    maxPages?: number;
  }
) {
  const maxPages = opts?.maxPages ?? 50;

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const found = new Set<string>();
  const pagesToProcess = Math.min(pdf.numPages, maxPages);

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    const page = await pdf.getPage(pageNum);

    // ---- 1. Annotations (clickable links) ----
    const annotations = await page.getAnnotations();
    for (const a of annotations) {
      if (typeof a.url === "string" && is_valid_http_url(a.url)) {
        found.add(a.url);
      }
    }

    // ---- 2. Visible text fallback ----
    const textContent = await page.getTextContent();
    const text = textContent.items.map((i: any) => i.str).join(" ");

    const matches = text.match(URL_REGEX);
    if (matches) {
      for (const m of matches) {
        if (is_valid_http_url(m)) {
          found.add(m);
        }
      }
    }
  }

  return {
    urls: Array.from(found),
    page_count: pdf.numPages,
    pages_scanned: pagesToProcess,
  };
}