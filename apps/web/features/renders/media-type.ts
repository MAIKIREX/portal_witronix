/**
 * Clasificacion del tipo de medio de una version, a partir de su MIME real
 * o de su extension de archivo.
 *
 * El backend acepta bastante mas que imagenes (ver MIME_GROUPS en
 * @witronix/shared): video, modelos 3D (.glb/.gltf) y formatos tecnicos de CAD.
 * Este archivo es el UNICO sitio que decide que visor le corresponde a cada
 * MIME/archivo, para no repetir la logica en la miniatura de la rejilla y en el
 * visor grande.
 */
export type MediaKind = "image" | "video" | "model3d" | "other";

const MODEL_3D_MIME_TYPES = new Set(["model/gltf-binary", "model/gltf+json"]);
const MODEL_3D_EXTENSIONS = new Set(["glb", "gltf"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "tiff"]);

function extractExt(filenameOrUrl: string | null | undefined): string | null {
  if (!filenameOrUrl) return null;
  try {
    const clean = filenameOrUrl.split("?")[0];
    const part = clean.split("/").pop() ?? clean;
    const dotIdx = part.lastIndexOf(".");
    if (dotIdx === -1) return null;
    return part.slice(dotIdx + 1).toLowerCase();
  } catch {
    return null;
  }
}

export function mediaKindFor(
  mimeType: string | null | undefined,
  filenameOrUrl?: string | null,
): MediaKind {
  const ext = extractExt(filenameOrUrl);

  if (ext && MODEL_3D_EXTENSIONS.has(ext)) return "model3d";
  if (ext && VIDEO_EXTENSIONS.has(ext)) return "video";
  if (ext && IMAGE_EXTENSIONS.has(ext)) return "image";

  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (MODEL_3D_MIME_TYPES.has(mimeType)) return "model3d";
  return "other";
}

