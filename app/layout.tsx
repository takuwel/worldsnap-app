export const metadata = {
  title: 'wap',
  description: '世界中を旅して、思い出をつなごう',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default', // ← ここでステータスバーを白（デフォルト）に強制指定！
    title: 'wap',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" style={{ backgroundColor: '#ffffff', colorScheme: 'light' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#ffffff', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
