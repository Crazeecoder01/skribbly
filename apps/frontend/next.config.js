// apps/frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [new URL('https://skribbl.io/img/setting_1.gif/**')],
  },
};

module.exports = nextConfig;
