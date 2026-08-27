import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // transpilePackages NO hace falta para @witronix/shared:
  //   (a) Turbopack (bundler por defecto en Next 16) transpila automaticamente los
  //       paquetes de un workspace pnpm.
  //   (b) @witronix/shared ya publica JS compilado en dist/ via main/exports.
  // Solo haria falta si el paquete pasara a exportar .ts crudo.
  //
  // Tampoco se configura images.remotePatterns: los renders se sirven con URLs
  // firmadas de MinIO que caducan en 300 s. El optimizador de next/image las
  // cachearia y acabaria sirviendo una URL muerta, asi que se usa <img>.
};

export default nextConfig;
