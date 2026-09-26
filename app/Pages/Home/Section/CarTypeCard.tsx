import { CarType } from "../Data/blocks"

export default function CarTypeCard({ carType, dark }: { carType: CarType, dark: boolean }) {

    const text = dark ? "text-white group-hover:text-slate" : "text-slate group-hover:text-white";

    return (
        <a href={carType.href} className={`group block min-h-84.75 rounded-[10px] px-6.25 pt-12.5 pb-7 no-underline transition-colors duration-400 ${dark ? "bg-slate hover:bg-white" : "bg-white hover:bg-slate"}`}>
            <span className="block h-28.75 bg-size-[auto_105px] bg-center bg-no-repeat" style={{ backgroundImage: `url(${carType.image})` }}></span>
            <div>
                <h3 className={`mt-5 mb-5 max-h-25.5 text-xl font-bold uppercase transition-colors duration-400 ${text}`}>{carType.title}</h3>
                <p className={`mt-3.5 mb-5 max-h-8 min-h-8 overflow-hidden text-sm font-normal transition-colors duration-400 max-[764px]:max-h-fit max-[764px]:min-h-fit ${text}`}>{carType.description}</p>
                <span className="font-inter text-[13px] font-bold text-gold">EXPLORE</span>
            </div>
        </a>
    )
}
