const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: '/admin/:path*',
      },
      {
        source: '/enterprise/:path*',
        destination: '/enterprise/:path*',
      },
      {
        source: '/employee/:path*',
        destination: '/employee/:path*',
      },
    ];
  },
};

// Sentry 配置选项
const sentryWebpackPluginOptions = {
  // 组织和项目
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 认证令牌
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // 静默模式（在构建时不输出日志）
  silent: true,

  // 源码映射
  hideSourceMaps: true,

  // 仅在生产环境上传源码映射
  dryRun: process.env.NODE_ENV !== 'production',
};

// 使用 Sentry 包装配置
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions, {
  // 为所有文件自动添加 Sentry 集成
  widenClientFileUpload: true,

  // 隐藏源码映射
  hideSourceMaps: true,

  // 禁用服务器端的 Sentry（如果需要）
  disableServerWebpackPlugin: false,

  // 禁用客户端的 Sentry（如果需要）
  disableClientWebpackPlugin: false,

  // 自动创建发布版本
  automaticVercelMonitors: true,
});
