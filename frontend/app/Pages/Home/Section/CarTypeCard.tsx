import { CarType } from "../Data/blocks"

export default function CarTypeCard({ carType }: { carType: CarType }) {

    const text = "text-(--card-text,#4e4e4f) transition-colors duration-400 group-hover:text-(--card-hover-text,#fff)";

    return (
        <a href={carType.href} className="group block min-h-84.75 rounded-[10px] bg-(--card-bg,#fff) px-6.25 pt-12.5 pb-7 no-underline max-[301px]:px-3.75 transition-colors duration-400 hover:bg-(--card-hover-bg,#4e4e4f)">
            <span className="block h-28.75 bg-size-[auto_105px] bg-center bg-no-repeat" style={{ backgroundImage: `url(${carType.image})` }}></span>
            <div>
                <h3 className={`mt-5 mb-5 max-h-25.5 text-xl font-bold uppercase wrap-anywhere ${text}`}>{carType.title}</h3>
                <p className={`mt-3.5 mb-5 max-h-8 min-h-8 overflow-hidden text-sm font-normal max-[764px]:max-h-fit max-[764px]:min-h-fit ${text}`}>{carType.description}</p>
                <span className="font-inter text-[13px] font-bold text-gold">EXPLORE</span>
            </div>
        </a>
    )
}
