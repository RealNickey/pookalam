import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Onam Pookalam Generator",
  description: "Create beautiful Onam Pookalam with your photo as the center",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors closeButton visibleToasts={2} />
        </ThemeProvider>
      </body>
    </html>
  );
}
