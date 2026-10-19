import type { Dealer } from '@/app/lib/cars/types'
import { dealerContact } from '@/app/lib/cars/dealer-contact'
export default function ContactBar({ title, dealer, inline = false }: { title: string, dealer?: Dealer, inline?: boolean }) {

    const contact = dealerContact(dealer ?? {}, title);
    const button = "flex h-11 flex-1 items-center justify-center rounded-lg bg-gold text-[11px] font-medium text-white no-underline min-[981px]:rounded-md min-[981px]:text-[15px]";

    return (
        <>
            <div className={inline ? "mt-3 hidden gap-3 min-[981px]:flex" : "fixed inset-x-0 bottom-0 z-50 flex gap-2.25 bg-black px-5 py-2.5 font-roboto min-[981px]:hidden"}>
                {contact.phone && <a href={contact.phone} className={button}>Call Dealer</a>}
                {dealer?.email && <a href={`mailto:${dealer.email}?subject=${encodeURIComponent(title)}`} className={button}>Message Dealer</a>}
                {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className={button}>WhatsApp</a>}
            </div>
        </>
    )
}
