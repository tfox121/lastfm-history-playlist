/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lastfm.freetls.fastly.net', 'i.scdn.co'],
  },
};

module.exports = nextConfig;
