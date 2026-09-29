import ActionButton from "./EnquireButton"

// Small screens only: the dealer contact buttons stay pinned to the bottom of the screen.
export default function ContactBar({ title }: { title: string }) {

    const message = encodeURIComponent(`Hi, I'm interested in the ${title} on CHANGECARS.`);
    const button = "flex h-9 shrink-0 items-center justify-center rounded-[5px] bg-gold px-3.25 text-base leading-9 whitespace-nowrap text-white no-underline shadow-[0_3px_6px_rgba(0,0,0,0.3)] max-[450px]:flex-1 max-[450px]:shrink max-[450px]:px-1 max-[450px]:text-sm";

    return (
        <>
            <div className="fixed inset-x-0 bottom-2.5 z-50 flex justify-center gap-2.5 px-2.5 font-sans min-[1039px]:hidden">
                <a href="tel:0861248248" className={button}>Call Dealer</a>
                <ActionButton action="enquiry" className={button}>Message Dealer</ActionButton>
                <a href={`https://wa.me/27861248248?text=${message}`} target="_blank" className={button}>WhatsApp</a>
            </div>
        </>
    )
}
