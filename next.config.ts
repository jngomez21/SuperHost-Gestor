import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Una foto comprimida por subida (ADR-008), con margen para las cabeceras del formulario.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
};

export default nextConfig;
