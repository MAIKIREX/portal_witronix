/**
 * Clasificacion del tipo de medio de una version, a partir de su MIME real.
 *
 * El backend acepta bastante mas que imagenes (ver MIME_GROUPS en
 * @witronix/shared): video, modelos 3D (.glb) y formatos tecnicos de CAD.
 * Este archivo es el UNICO sitio que decide que visor le corresponde a cada
 * MIME, para no repetir la logica en la miniatura de la rejilla y en el
 * visor grande.
 */
export type MediaKind = "image" | "video" | "model3d" | "other";

const MODEL_3D_MIME_TYPES = new Set(["model/gltf-binary", "model/gltf+json"]);

export function mediaKindFor(mimeType: string | null | undefined): MediaKind {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (MODEL_3D_MIME_TYPES.has(mimeType)) return "model3d";
  return "other";
}
