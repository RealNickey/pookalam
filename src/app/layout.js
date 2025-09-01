import "./globals.css";

export const metadata = {
  title: "Onam Pookalam Generator",
  description: "Create beautiful Onam Pookalam with your photo as the center",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
