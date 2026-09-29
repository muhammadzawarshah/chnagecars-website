export default function ContactBar({ title }: { title: string }) {

    const message = encodeURIComponent(`Hi, I'm interested in the ${title} on CHANGECARS.`);
    const button = "flex h-11 flex-1 items-center justify-center rounded-md bg-gold text-[13px] font-medium text-white no-underline min-[981px]:h-13 min-[981px]:text-base";

    return (
        <>
            <div className="fixed inset-x-0 bottom-0 z-50 flex gap-3 bg-black px-3 py-3 font-roboto min-[981px]:static min-[981px]:mt-8 min-[981px]:rounded-xl min-[981px]:px-5 min-[981px]:py-5">
                <a href="tel:0861248248" className={button}>Call Dealer</a>
                <a href={`mailto:info@changecars.co.za?subject=${encodeURIComponent(title)}&body=${message}`} className={button}>Message Dealer</a>
                <a href={`https://wa.me/27861248248?text=${message}`} target="_blank" className={button}>Whatsapp</a>
            </div>
        </>
    )
}
