import "./globals.css";

export const metadata = {
  title: "Skribbly",
  description: "A draw and guess application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
       
          {children}
    
      </body>
    </html>
  );
}
