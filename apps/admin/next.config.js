/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

module.exports = {
  basePath,
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/icon.svg', permanent: true }];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '9000' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'onnshoppe.com' },
      { protocol: 'https', hostname: 'www.onnshoppe.com' },
    ],
  },
};
