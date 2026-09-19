import * as FileSystem from "expo-file-system/legacy";
import { api } from "../api/client";

/**
 * Upload an image to Cloudflare R2 via a backend-issued presigned URL.
 *
 * Uses `expo-file-system`'s native `uploadAsync` instead of the JS fetch
 * dance — RN's `fetch(file://).blob()` is flaky on iOS and often ships
 * an empty body, which is exactly why nothing was landing in R2. The
 * native path streams the file bytes straight into the PUT request.
 */

type PresignResp = {
  success: true;
  data: { uploadUrl: string; publicUrl: string; key: string };
};

const extFor = (uri: string): "jpg" | "png" | "webp" | "heic" => {
  const raw = (uri.split("?")[0].split(".").pop() ?? "").toLowerCase();
  if (raw === "png") return "png";
  if (raw === "webp") return "webp";
  if (raw === "heic") return "heic";
  return "jpg";
};

const contentTypeFor = (ext: string) =>
  ext === "png"
    ? "image/png"
    : ext === "webp"
    ? "image/webp"
    : ext === "heic"
    ? "image/heic"
    : "image/jpeg";

/**
 * Uploads the file at `localUri` to R2 under the given namespace.
 * Returns the permanent public URL, or throws on failure.
 */
export async function uploadImageToR2(
  localUri: string,
  kind: "food" | "profile",
): Promise<string> {
  const ext = extFor(localUri);
  const contentType = contentTypeFor(ext);

  // Step 1 — presigned URL from backend
  console.log("[R2] requesting presigned URL", { kind, ext });
  const presign = await api.post<PresignResp>("/uploads/presign", {
    kind,
    ext,
  });
  const { uploadUrl, publicUrl } = presign.data;
  console.log("[R2] got presigned URL:", uploadUrl.slice(0, 100) + "…");
  console.log("[R2] final publicUrl:", publicUrl);

  // Step 2 — native PUT of the file bytes. `BINARY_CONTENT` streams the
  // raw bytes (no multipart wrapping), which is exactly what an S3-style
  // presigned URL expects.
  console.log("[R2] uploading bytes from", localUri.slice(0, 80));
  const res = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
  });
  console.log("[R2] PUT response:", { status: res.status, body: res.body?.slice(0, 400) });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `R2 upload failed (${res.status}): ${res.body?.slice(0, 400) ?? ""}`,
    );
  }

  return publicUrl;
}
