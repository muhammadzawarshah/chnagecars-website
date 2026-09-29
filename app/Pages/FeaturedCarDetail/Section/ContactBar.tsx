export default function ContactBar({ title, inline = false }: { title: string, inline?: boolean }) {

    const message = encodeURIComponent(`Hi, I'm interested in the ${title} on CHANGECARS.`);
    const button = "flex h-11 flex-1 items-center justify-center rounded-lg bg-gold text-[11px] font-medium text-white no-underline min-[981px]:rounded-md min-[981px]:text-[15px]";

    return (
        <>
            <div className={inline ? "mt-3 hidden gap-3 min-[981px]:flex" : "fixed inset-x-0 bottom-0 z-50 flex gap-2.25 bg-black px-5 py-2.5 font-roboto min-[981px]:hidden"}>
                <a href="tel:0861248248" className={button}>Call Dealer</a>
                <a href={`mailto:info@changecars.co.za?subject=${encodeURIComponent(title)}&body=${message}`} className={button}>Message Dealer</a>
                <a href={`https://wa.me/27861248248?text=${message}`} target="_blank" className={button}>Whatsapp</a>
            </div>
        </>
    )
}
