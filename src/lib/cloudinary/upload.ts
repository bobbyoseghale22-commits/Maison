import "server-only";

import { cloudinary } from "@/lib/cloudinary/config";
import { env } from "@/config/env";

const FOLDER = "maison-noir/products";
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

export interface UploadedImage {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  /** Optimized display URL with automatic format and quality. */
  displayUrl: string;
}

export interface UploadError {
  field?: string;
  message: string;
}

/**
 * Validates a file buffer before uploading. Returns an error string
 * or null if valid.
 */
export function validateUploadFile(
  mimeType: string,
  sizeBytes: number,
): string | null {
  const ext = mimeType.split("/")[1] as (typeof ALLOWED_FORMATS)[number];
  if (!ALLOWED_FORMATS.includes(ext)) {
    return `Unsupported format "${ext}". Accepted: ${ALLOWED_FORMATS.join(", ")}.`;
  }
  if (sizeBytes > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File exceeds ${MAX_FILE_SIZE_MB} MB limit.`;
  }
  return null;
}

/**
 * Uploads a single image to Cloudinary under the products folder.
 * Accepts a base64 data URI or a remote HTTPS URL.
 *
 * Returns `UploadedImage` on success. All transformations (resize,
 * format conversion, quality) are applied at delivery time via the
 * `displayUrl` — not baked in at upload time — so the original is
 * preserved for future transformation changes.
 */
export async function uploadProductImage(
  source: string,
  options: {
    folder?: string;
    publicId?: string;
    /** Alt text stored in Cloudinary's context metadata. */
    alt?: string;
  } = {},
): Promise<UploadedImage> {
  const folder = options.folder ?? FOLDER;

  const result = await cloudinary.uploader.upload(source, {
    folder,
    ...(options.publicId ? { public_id: options.publicId } : {}),
    overwrite: true,
    resource_type: "image",
    allowed_formats: [...ALLOWED_FORMATS],
    context: options.alt ? { alt: options.alt } : undefined,
    // Eager transformations: generate a standard 1200-wide WebP version
    // at upload time so the first request is instant.
    eager: [
      { width: 1200, crop: "limit", fetch_format: "auto", quality: "auto" },
    ],
  });

  const displayUrl = cloudinary.url(result.public_id, {
    fetch_format: "auto",
    quality: "auto",
    width: 1200,
    crop: "limit",
    secure: true,
  });

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    displayUrl,
  };
}

/**
 * Deletes an image from Cloudinary by its public ID.
 * Safe to call when the public ID is unknown — returns silently.
 */
export async function deleteProductImage(publicId: string): Promise<void> {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

/**
 * Generates a signed upload URL for direct browser-to-Cloudinary
 * uploads (bypasses our server for large files). The signature uses
 * the API secret so it can't be forged.
 *
 * The client sends the file directly to Cloudinary using this
 * signature, then POSTs the resulting `public_id` / `secure_url`
 * back to our own API to save it on the product.
 */
export function getSignedUploadParams(folder = FOLDER): {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  uploadPreset?: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  };

  if (env.CLOUDINARY_UPLOAD_PRESET) {
    paramsToSign.upload_preset = env.CLOUDINARY_UPLOAD_PRESET;
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET,
  );

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    signature,
    timestamp,
    folder,
    uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
  };
}
