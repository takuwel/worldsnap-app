import React from "react";

export const metadata = {
  title: "WorldSnap Live Map",
  description: "WorldSnap App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
