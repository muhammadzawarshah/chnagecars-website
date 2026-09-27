export default function MenuIcon({ icon }: { icon: string }) {
    return (
        <>
            <span className="block size-5.5 shrink-0 bg-[#957e4e] mask-contain mask-center mask-no-repeat" style={{ maskImage: `url(${icon})` }}></span>
        </>
    )
}
