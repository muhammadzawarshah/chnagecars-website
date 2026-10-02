import { contacts } from "../Data/contacts"

const personIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#957e4e" className="shrink-0">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 14.2a7.9 7.9 0 0 1-6-2.8c.9-1.7 3.4-2.9 6-2.9s5.1 1.2 6 2.9a7.9 7.9 0 0 1-6 2.8Z" />
    </svg>
);

const mailIcon = (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#957e4e" strokeWidth="1.1" className="shrink-0">
        <rect x="0.55" y="0.55" width="14.9" height="10.9" rx="0.8" />
        <path d="M0.8 1l7.2 5.6L15.2 1" />
    </svg>
);

const phoneIcon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#957e4e" className="shrink-0">
        <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" />
    </svg>
);

const row = "flex items-center gap-2.5 font-sans text-[13.5px] leading-4.5 text-black no-underline min-[981px]:text-base min-[981px]:leading-5";

export default function ContactInfo() {
    return (
        <>
            <section>
                <h1 className="mt-7 mb-0 text-center text-xl leading-6 font-normal text-[#957e4e] uppercase min-[981px]:mt-12.5 min-[981px]:text-[32px] min-[981px]:leading-10">
                    Get in <strong className="font-bold">touch</strong>
                </h1>
                <p className="mt-2 mb-0 text-center font-sans text-[12.5px] leading-4.25 text-black min-[981px]:mt-4 min-[981px]:text-base min-[981px]:leading-6">
                    Want to get in touch? We would love to hear from you<br />Here is how you can reach us
                </p>
                <div className="mt-3.75 border-b border-[#e4e4e4] min-[981px]:mt-7.5">
                    {contacts.map((contact) => (
                        <div key={contact.email} className={`border-t border-[#e4e4e4] pb-4.75 min-[981px]:pt-6 min-[981px]:pb-7 ${contact.heading ? "pt-4" : "pt-3.5"}`}>
                            {contact.heading && <h2 className="mt-0 mb-1 font-sans text-lg leading-5.5 font-bold text-black min-[981px]:text-[22px] min-[981px]:leading-7">{contact.heading}</h2>}
                            <h3 className="mt-0 mb-0.75 font-sans text-[13.5px] leading-4.5 font-bold text-[#957e4e] min-[981px]:text-base min-[981px]:leading-5">{contact.role}</h3>
                            <div className="flex flex-col gap-2 pl-0.5 min-[981px]:gap-3">
                                {contact.name && <p className={`m-0 ${row}`}>{personIcon}{contact.name}</p>}
                                <a href={`mailto:${contact.email}`} className={`${row} hover:text-[#957e4e]`}>{mailIcon}{contact.email}</a>
                                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className={`${row} hover:text-[#957e4e]`}>{phoneIcon}{contact.phone}</a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    )
}
