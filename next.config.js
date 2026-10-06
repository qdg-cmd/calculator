/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 배포 시 레포지토리 이름이 base path가 될 수 있으므로 필요시 활성화
  // basePath: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME' : '',
};

module.exports = nextConfig;
