import Link from "next/link";

export const metadata = { title: "Choose dashboard" };

const dashboards = [
  { href: "/dashboard/super-admin", title: "Super Admin", text: "Everything: platform overview, all dealers, compare dealers, open any dealer's dashboard, listings and staff." },
  { href: "/dashboard/admin", title: "Admin", text: "Platform overview, approve or suspend dealers, and moderate listings." },
  { href: "/dashboard/dealer", title: "Dealer", text: "Your own stock, listing views, leads and sales." },
];

// Until login is connected, this page stands in for "sign in and land on your dashboard".
export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-12 font-sans">
      <div className="w-full max-w-240">
        <img src="/img/site_logo.svg" alt="CHANGECARS" className="mx-auto block w-56" />
        <h1 className="mt-8 mb-2 text-center text-3xl font-light text-white uppercase">Choose a <strong className="font-bold text-gold">dashboard</strong></h1>
        <p className="m-0 mb-8 text-center text-sm text-white/60">Preview only. After login is connected, each user lands on their own dashboard automatically.</p>
        <div className="grid grid-cols-3 gap-4 max-[760px]:grid-cols-1">
          {dashboards.map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-xl border border-white/10 bg-white/5 p-6 no-underline transition hover:border-gold hover:bg-white/8">
              <h2 className="m-0 text-xl font-bold text-white group-hover:text-gold">{item.title}</h2>
              <p className="mt-2 mb-0 text-sm leading-5 text-white/65">{item.text}</p>
              <span className="mt-5 inline-block text-sm font-bold text-gold">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
