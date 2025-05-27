/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['framer-motion', 'react-icons'],
  
  // ✅ SECURITY FIX: Restrict CORS to specific origins and methods
  async headers() {
    // Get allowed origins from environment or use secure defaults
    const allowedOrigins = process.env.ALLOWED_ORIGINS || 
      'http://localhost:3000,https://chamada-ai.vercel.app,https://*.vercel.app';
    
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'false' }, // ✅ Disable credentials
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins }, // ✅ Restrict origins
          { key: 'Access-Control-Allow-Methods', value: 'POST,OPTIONS' }, // ✅ Only allow necessary methods
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' }, // ✅ Restrict headers
          { key: 'Access-Control-Max-Age', value: '86400' }, // ✅ Cache preflight for 24h
        ],
      },
    ];
  },
};

module.exports = nextConfig; 