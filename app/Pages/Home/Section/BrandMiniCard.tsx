import { Brand } from "../Data/brands"

// Brand card as on the app's home screen: logo and name only, sized to the screen width.
export default function BrandMiniCard({ brand }: { brand: Brand }) {
    return (
        <>
            <a href={brand.href} className="flex h-[24.6vw] w-full flex-col items-center justify-center rounded-lg border border-[#eaebef] bg-white px-1 no-underline shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <img src={brand.logo} alt={brand.name} className="size-[10.9vw] object-contain" />
                <span className="mt-[2vw] max-w-full truncate text-[clamp(10px,2.2vw,12px)] leading-tight text-gold">{brand.name}</span>
            </a>
        </>
    )
}
