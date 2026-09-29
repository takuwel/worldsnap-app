export const metadata = {
  title: 'wap',
  description: '世界中を旅して、思い出をつなごう',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
        <style dangerouslySetInnerHTML={{ __html: `
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            background-color: #ffffff !important;
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
      <body style={{ margin: 0, padding: 0, backgroundColor: '#ffffff', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
