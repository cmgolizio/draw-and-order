import { AuthProvider } from "@/context/AuthContext";
import SiteHeader from "@/components/Header";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className='min-h-screen bg-white text-gray-900'>
        <AuthProvider>
          <div className='flex min-h-screen flex-col'>
            <SiteHeader />
            <main className='flex-1'>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
