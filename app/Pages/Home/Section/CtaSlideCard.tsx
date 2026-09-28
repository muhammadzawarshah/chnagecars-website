import { Cta } from "../Data/blocks"

export default function CtaSlideCard({ cta }: { cta: Cta }) {
    return (
        <>
            <a
                href={cta.href}
                target={cta.external ? "_blank" : undefined}
                className="flex h-full flex-col items-center rounded-xl bg-white px-5 pt-5 pb-3.5 text-center no-underline shadow-[0_2px_10px_rgba(0,0,0,0.1)] max-[601px]:px-4 max-[601px]:pt-3.75 max-[601px]:pb-2.5"
            >
                <img src={cta.image} alt={cta.title} className="h-24 w-auto max-[601px]:h-18.75" />
                <h3 className="mt-3 mb-0 text-lg leading-6 font-normal text-[#957e4e] uppercase max-[601px]:mt-2 max-[601px]:text-[14.5px] max-[601px]:leading-5">
                    {cta.title} <strong className="text-2xl font-bold max-[601px]:text-[19px]">{cta.highlight}</strong>
                </h3>
                <p className="mt-2 mb-0 text-sm leading-5 text-[#555] max-[601px]:mt-1.5 max-[601px]:text-[11.5px] max-[601px]:leading-4">
                    {cta.description.join(" ")}
                </p>
                <div className="mt-auto pt-10">
                    <span className="inline-flex h-9 items-center rounded-[7px] bg-[#957e4e] px-3.5 text-sm font-bold text-white max-[601px]:h-7.5 max-[601px]:px-2.25 max-[601px]:text-[13px]">
                        Click Here
                    </span>
                </div>
            </a>
        </>
    )
}
