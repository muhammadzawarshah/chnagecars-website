import { Province } from "../Data/brands"

export default function ProvinceCard({ province, large = false }: { province: Province, large?: boolean }) {
    return (
        <a href={province.href} className="group block px-3.75 py-8.75 no-underline">
            <div className={`flex w-full justify-center ${large ? "h-37.5" : ""}`}>
                <img src={province.image} alt={province.name} className={`mx-auto ${large ? "h-40" : "h-20"}`} />
            </div>
            <p className="mt-5 mb-0 text-center text-xl font-normal text-gold group-hover:opacity-70">{province.name}</p>
        </a>
    )
}
