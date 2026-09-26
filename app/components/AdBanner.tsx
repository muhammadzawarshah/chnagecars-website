import { Ad } from "../Pages/Home/Data/ads"

export default function AdBanner({ ad, className }: { ad: Ad, className: string }) {
    return (
        <>
            <a href={ad.href} target="_blank" className={className}>
                <img src={ad.image} alt={ad.alt} className="block w-full" />
            </a>
        </>
    )
}
