/* LiczMat website — company logo upload and resizing logic.
 *
 * A Pro contractor can upload their company logo to appear on printed quotes and invoices.
 * The logo is stored as a base64 data URL directly inside the document (in localStorage and
 * Firestore) rather than in Firebase Storage. That is a deliberate choice: there is no bucket
 * to configure, no second set of security rules to maintain, and a logo is typically just
 * a few dozen kB, which fits easily inside the document limits.
 *
 * The image is constrained to 600×300 pixels. At that size, it prints perfectly sharp at
 * roughly 60 mm wide on an A4 sheet at 250 dpi — exactly what a document header needs.
 *
 * When encoding, the canvas always tries PNG first. A PNG keeps the transparency of logos
 * meant to sit on white paper. If the resulting PNG is too large (over the 300,000 character
 * limit), it falls back to JPEG drawn on a white background. This handles photos of logos or
 * heavy raster graphics. The Firestore rule strictly allows only image/png and image/jpeg
 * data URLs. We accept webp or svg inputs, but they are always re-encoded to png or jpeg
 * by the canvas and never stored as-is. In particular, SVG is never stored raw because a
 * stored SVG is script-capable markup.
 */

const LOGO_MAX_W = 600;
const LOGO_MAX_H = 300;
const LOGO_MAX_CHARS = 300000;
const LOGO_ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/** true for "" or a png/jpeg base64 data URL within LOGO_MAX_CHARS. */
function companyLogoValid(value) {
  if (value === "") return true;
  if (typeof value !== "string" || value.length > LOGO_MAX_CHARS) return false;
  return /^data:image\/(png|jpeg);base64,.*$/.test(value);
}

/** Fit (w,h) inside LOGO_MAX_W × LOGO_MAX_H keeping aspect ratio, never upscaling; returns {w,h} as integers ≥1. Pure, testable in Node. */
function companyLogoFit(w, h, maxW = LOGO_MAX_W, maxH = LOGO_MAX_H) {
  if (w <= 0 || h <= 0) return { w: 1, h: 1 };
  const scale = Math.min(1, maxW / w, maxH / h);
  return {
    w: Math.max(1, Math.round(w * scale)),
    h: Math.max(1, Math.round(h * scale))
  };
}

/**
 * File (from <input type=file>) -> Promise<string> data URL.
 * Rejects with Error whose .code is one of "type" (not in LOGO_ACCEPT), "read" (could not decode the image), "size" (could not get under LOGO_MAX_CHARS even at the smallest step).
 * Steps: check file.type against LOGO_ACCEPT; read a data URL because the site's img-src
 * policy excludes blob:; load it into an Image; for SVG with no intrinsic size
 * (naturalWidth 0) assume 600×300; compute size with companyLogoFit; draw onto a canvas;
 * first try canvas.toDataURL("image/png"); if longer than LOGO_MAX_CHARS, redraw on a
 * white-filled canvas and try "image/jpeg" at 0.85; if still too long, shrink width and
 * height by 20% and repeat (PNG then JPEG) until it fits or the longer side drops under
 * 60 px -> reject "size".
 * Enable imageSmoothingQuality = "high".
 */
async function companyLogoFromFile(file) {
  const err = (msg, code) => {
    const e = new Error(msg);
    e.code = code;
    return e;
  };

  if (!file || !LOGO_ACCEPT.includes(file.type)) {
    throw err("Invalid file type", "type");
  }

  // A data URL obeys the site's deliberately narrow img-src policy; blob: does not.
  const url = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(err("Could not read the image", "read"));
    reader.readAsDataURL(file);
  });
  {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(err("Could not decode the image", "read"));
      el.src = url;
    });

    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w === 0 || h === 0) {
      w = 600;
      h = 300;
    }

    const fit = companyLogoFit(w, h);
    let targetW = fit.w;
    let targetH = fit.h;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw err("Could not create the image canvas", "read");

    while (true) {
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.imageSmoothingQuality = "high";

      // Try PNG first
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const pngData = canvas.toDataURL("image/png");
      if (pngData.length <= LOGO_MAX_CHARS) {
        return pngData;
      }

      // Try JPEG on white fallback
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const jpegData = canvas.toDataURL("image/jpeg", 0.85);
      if (jpegData.length <= LOGO_MAX_CHARS) {
        return jpegData;
      }

      // Shrink by 20%
      targetW = Math.round(targetW * 0.8);
      targetH = Math.round(targetH * 0.8);

      // Stop if too small
      if (Math.max(targetW, targetH) < 60) {
        throw err("Could not shrink image under the size limit", "size");
      }
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LOGO_MAX_W,
    LOGO_MAX_H,
    LOGO_MAX_CHARS,
    LOGO_ACCEPT,
    companyLogoValid,
    companyLogoFit,
    companyLogoFromFile
  };
}
