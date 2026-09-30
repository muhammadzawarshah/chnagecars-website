type YesNoProps = {
    value: string
    onChange: (value: string) => void
    invalid?: boolean
}

// Round radio pair (custom-radio) used for the Yes / No questions.
export default function YesNo({ value, onChange, invalid = false }: YesNoProps) {
    return (
        <>
            <div className={`relative flex ${invalid ? "border-2 border-[#f00] p-2.5" : ""}`}>
                <div className="w-full">
                    <div className="-mx-3 flex flex-wrap pb-2">
                        {["Yes", "No"].map((option) => (
                            <div key={option} className="relative mb-1 flex w-full shrink-0 flex-wrap items-stretch px-3">
                                <div className="me-2 mt-1">
                                    <label
                                        onClick={() => onChange(option)}
                                        className={`relative inline-block cursor-pointer rounded-full align-middle border-4 p-2.5 text-[22px] leading-[1.5] ${value === option ? "border-gold bg-gold text-white before:absolute before:top-1/2 before:left-1/2 before:-translate-1/2 before:text-white before:content-['✔']" : "border-[gray] bg-[gray]"}`}
                                    ></label>
                                </div>
                                <label onClick={() => onChange(option)} className="-ml-px text-[22px] leading-[1.5]">{option}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
