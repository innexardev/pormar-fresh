/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '9000' },
      { protocol: 'https', hostname: 'onnshoppe.com' },
      { protocol: 'https', hostname: 'www.onnshoppe.com' },
    ],
  },
};
