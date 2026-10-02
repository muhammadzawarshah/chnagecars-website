import type { Metadata } from "next";
import Contact from "../Pages/Contact/Contact";

export const metadata: Metadata = {
  title: "Contact Us | CHANGECARS",
  description: "Need assistance? Get in touch with the CHANGECARS team by phone, email or our contact form.",
};

export default function Page() {
  return <Contact />;
}
