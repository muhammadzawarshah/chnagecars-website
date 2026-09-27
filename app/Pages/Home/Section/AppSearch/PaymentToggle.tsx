type PaymentToggleProps = {
    monthly: boolean
    cashLabel: string
    monthlyLabel: string
    onChange: (monthly: boolean) => void
}

export default function PaymentToggle({ monthly, cashLabel, monthlyLabel, onChange }: PaymentToggleProps) {

    const button = "h-9 flex-1 cursor-pointer rounded-[3px] border-0 text-[13.9px] text-white";

    return (
        <>
            <div className="flex h-11.5 rounded border border-white p-1">
                <button onClick={() => onChange(false)} className={`${button} ${monthly ? "bg-transparent" : "bg-[#957e4e]"}`}>{cashLabel}</button>
                <button onClick={() => onChange(true)} className={`${button} ${monthly ? "bg-[#957e4e]" : "bg-transparent"}`}>{monthlyLabel}</button>
            </div>
        </>
    )
}
