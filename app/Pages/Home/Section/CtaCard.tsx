import { Cta } from "../Data/blocks"

export default function CtaCard({ cta, slide = false }: { cta: Cta, slide?: boolean }) {
    return (
        <>
            <a
                href={cta.href}
                target={cta.external ? "_blank" : undefined}
                className={`group relative block min-h-86.25 cursor-pointer rounded-[10px] px-6.25 py-12.5 no-underline shadow-[5px_5px_15px_0px_rgba(0,0,0,0.149)] hover:bg-cloud max-[1401px]:h-115 max-[947px]:h-auto max-[751px]:hover:bg-white max-[401px]:px-5 max-[401px]:py-10 ${slide ? "w-full" : "float-left mr-2.5 mb-7.5 w-[calc(50%-10px)] max-[947px]:clear-both max-[947px]:w-full"}`}
            >
                <h3 className="mx-auto mt-0 mb-7 text-3xl leading-9.75 font-extralight text-gold uppercase wrap-anywhere max-[1401px]:mt-42.5 max-[947px]:mt-0 max-[751px]:mt-40 max-[401px]:text-2xl max-[401px]:leading-8 max-[301px]:mt-28 max-[301px]:text-xl max-[301px]:leading-7">
                    {cta.title} <strong className="font-black">{cta.highlight}</strong>
                </h3>
                {cta.description.map((line, index) => (
                    <p key={line} className={`w-1/2 text-base leading-6.5 font-normal whitespace-normal text-coal max-[1401px]:w-full max-[947px]:w-1/2 max-[751px]:w-full ${cta.description.length > 1 ? (index === 0 ? "m-0" : "mt-0 mb-4") : "my-4"}`}>
                        {line}
                    </p>
                ))}
                <img src={cta.image} alt={cta.title} className="absolute top-18.75 right-5 w-50 max-[1401px]:top-7 max-[1401px]:left-5.75 max-[1401px]:float-left max-[1401px]:mx-auto max-[1401px]:w-41.25 max-[947px]:top-20 max-[947px]:right-10 max-[947px]:left-auto max-[947px]:m-0 max-[947px]:w-52.5 max-[751px]:top-7.5 max-[751px]:left-10 max-[751px]:mx-auto max-[751px]:w-37.5 max-[301px]:left-1/2 max-[301px]:w-[60%] max-[301px]:-translate-x-1/2" />
                <span className="absolute bottom-15 cursor-pointer rounded-[5px] bg-gold p-2.5 text-white hover:opacity-90 max-[947px]:static max-[947px]:inline-block">
                    Click here
                </span>
            </a>
        </>
    )
}
