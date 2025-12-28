import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: '战略解码',
  description: '企业战略解码与绩效管理平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
