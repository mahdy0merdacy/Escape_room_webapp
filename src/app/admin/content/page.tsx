import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const SECTIONS = [
  {
    href: "/admin/content/faq",
    title: "FAQ",
    desc: "Add, edit, and reorder the Frequently Asked Questions shown on the public FAQ page. Supports English, French, and Arabic.",
    icon: "❓",
  },
  {
    href: "/admin/content/contact",
    title: "Contact Info",
    desc: "Update the phone and WhatsApp number shown on the Contact page and FAQ page.",
    icon: "📞",
  },
  {
    href: "/admin/content/about",
    title: "About Page",
    desc: "Edit the values and features cards shown on the About page.",
    icon: "📄",
  },
];

export default async function ContentPage() {
  const session = await auth();
  if (session?.user?.role === "employee") redirect("/admin");
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Site Content</h1>
      <p className="text-white/40 text-sm mb-10">
        Manage the editable text on your public-facing pages.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/25 transition-all p-6 flex flex-col gap-3"
          >
            <span className="text-3xl">{s.icon}</span>
            <p className="text-white font-bold text-lg group-hover:text-red-400 transition-colors">{s.title}</p>
            <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
