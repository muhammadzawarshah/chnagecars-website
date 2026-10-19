import { dealerContact } from '@/app/lib/cars/dealer-contact'
import type { Dealer } from '@/app/lib/cars/types'
import ActionButton from "./EnquireButton"

// Small screens only: the dealer contact buttons stay pinned to the bottom of the screen.
export default function ContactBar({ title, dealer }: { title: string, dealer?: Dealer }) {

    const contact = dealerContact(dealer ?? {}, title);
    const button = "flex h-9 shrink-0 items-center justify-center rounded-[5px] bg-gold px-3.25 text-base leading-9 whitespace-nowrap text-white no-underline shadow-[0_3px_6px_rgba(0,0,0,0.3)] max-[450px]:flex-1 max-[450px]:shrink max-[450px]:px-1 max-[450px]:text-sm";

    return (
        <>
            <div className="fixed inset-x-0 bottom-2.5 z-50 flex justify-center gap-2.5 px-2.5 font-sans min-[1039px]:hidden">
                {contact.phone && <a href={contact.phone} className={button}>Call Dealer</a>}
                <ActionButton action="enquiry" className={button}>Message Dealer</ActionButton>
                {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className={button}>WhatsApp</a>}
            </div>
        </>
    )
}
