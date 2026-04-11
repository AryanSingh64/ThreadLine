/** @type {import('next').NextConfig} */
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || "10.100.127.147")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const nextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
