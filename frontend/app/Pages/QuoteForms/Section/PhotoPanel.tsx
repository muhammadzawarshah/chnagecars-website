// Left photo column of the split enquiry cards: dark fade, two gold edge triangles and the logos.
export default function PhotoPanel({ image, className, logoClass }: { image: string, className: string, logoClass: string }) {
    return (
        <>
            <div className={`relative bg-cover bg-no-repeat before:absolute before:top-0 before:right-0 before:z-3 before:block before:border-r-[55px] before:border-b-[600px] before:border-r-[rgba(149,126,77,0.6)] before:border-b-transparent before:content-[''] after:absolute after:right-0 after:bottom-0 after:z-3 after:block after:border-t-[600px] after:border-r-[55px] after:border-t-transparent after:border-r-[rgba(149,126,77,0.6)] after:content-[''] ${className}`} style={{ backgroundImage: `url(${image})` }}>
                <div className="absolute inset-0 z-5 bg-[linear-gradient(rgba(0,0,0,0.4)_0%,#000_100%)] opacity-60"></div>
                <div className={`absolute left-1/2 z-10 flex -translate-x-1/2 justify-center px-2.5 ${logoClass}`}>
                    <img src="/img/quote-forms/site_logo.svg" alt="CHANGECARS" className="relative h-auto w-[calc(50%-20px)] object-contain" />
                    <span className="my-auto block h-12.5 w-0.5 shrink-0 bg-gold"></span>
                    <img src="/img/quote-forms/concierge-logo-light.svg" alt="Concierge Service" className="relative h-auto w-[calc(50%-20px)] object-contain" />
                </div>
            </div>
        </>
    )
}
