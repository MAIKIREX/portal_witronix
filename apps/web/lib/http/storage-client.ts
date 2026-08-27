import axios from "axios";

/**
 * Cliente para subir binarios directamente a MinIO/S3 con una URL firmada.
 *
 * Sin baseURL (la URL firmada es absoluta) y SIN interceptores, a proposito:
 *
 *  - NADA de cabecera `Authorization`. La firma va en el query string; si se
 *    manda tambien un Bearer, MinIO rechaza la peticion.
 *  - El `Content-Type` debe ser EXACTAMENTE el `mimeType` declarado en el paso 1
 *    del flujo de subida, porque forma parte de la firma. Se propaga tal cual
 *    viene en `upload.requiredHeaders`; no dejes que axios lo infiera del File.
 *  - `timeout: 0` (sin limite): son ficheros de hasta 500 MB.
 */
export const storage = axios.create({
  timeout: 0,
});
