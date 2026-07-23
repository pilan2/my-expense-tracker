import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 품목 사진 업로드(품목 등록/수정 폼)가 기본 1MB 제한에 걸리지 않도록 넉넉히 올려둔다.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
