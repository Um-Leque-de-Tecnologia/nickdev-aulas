/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

// Habilita o adaptador Cloudflare (OpenNext) durante `next dev`.
// Não afeta o build de produção do Cloudflare, que usa `opennextjs-cloudflare build`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
