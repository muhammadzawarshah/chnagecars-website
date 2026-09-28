type DotsProps = {
    positions: number[]
    current: number
    onSelect: (position: number) => void
}

export default function Dots({ positions, current, onSelect }: DotsProps) {
    return (
        <>
            <div className="mt-6.25 flex justify-center gap-2 max-[601px]:mt-5 max-[601px]:gap-1.5">
                {positions.map((position) => (
                    <button
                        key={position}
                        onClick={() => onSelect(position)}
                        aria-label={`Go to slide ${position + 1}`}
                        className={`h-2 cursor-pointer rounded-full border-0 p-0 transition-all duration-300 max-[601px]:h-1.25 ${position === current ? "w-6 bg-[#957e4e] max-[601px]:w-3" : "w-2 bg-[#dcdcdc] max-[601px]:w-1.25"}`}
                    ></button>
                ))}
            </div>
        </>
    )
}
