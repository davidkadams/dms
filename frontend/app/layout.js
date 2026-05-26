import "./globals.css";
import { UserProvider } from "./context/UserContext";

export const metadata = {
  title: "rescribe.io",
  description: "Document automation platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
