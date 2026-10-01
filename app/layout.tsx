export const metadata = {
  title: 'wap',
  description: '世界中を旅して、思い出をつなごう',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default', // 'default'にすることでステータスバーが白背景＋黒文字になります
    title: 'wap',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" style={{ backgroundColor: '#ffffff', colorScheme: 'light', height: '100%', width: '100%', margin: 0, padding: 0 }}>
      <head>
        {/* viewport-fit=cover と statusBarStyle の組み合わせで上部まで白く塗りつぶします */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            color-scheme: light !important;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100dvh;
            overflow: hidden;
            position: fixed;
            -webkit-text-size-adjust: 100%;
          }
        ` }} />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#ffffff', color: '#0f172a', height: '100%', width: '100%', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
