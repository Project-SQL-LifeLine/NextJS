/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  basePath: "/NextJS",
  assetPrefix: "/NextJS/",
  
  // বিল্ড আরও দ্রুত এবং আউটপুট ফাইল সাইজ ছোট করার জন্য
  swcMinify: true, 
};

export default nextConfig;
