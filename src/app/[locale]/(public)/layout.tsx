import { ViewTransition } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <ViewTransition>
        <main className="flex-1 pt-16">{children}</main>
      </ViewTransition>
      <Footer />
    </>
  );
}
