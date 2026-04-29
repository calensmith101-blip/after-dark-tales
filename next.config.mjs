/** @type {import('next').NextConfig} */
const nextConfig = {
  // When building for Android (ANDROID_BUILD=true), generate a static 'out/' folder
  // for Capacitor to bundle. Vercel builds normally without this flag.
  ...(process.env.ANDROID_BUILD === "true" ? { output: "export" } : {}),
};

export default nextConfig;
