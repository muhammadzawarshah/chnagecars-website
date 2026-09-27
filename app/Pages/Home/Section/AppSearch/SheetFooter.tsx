type SheetFooterProps = {
    applyLabel: string
    clearLabel: string
    onApply: () => void
    onClear: () => void
}

export default function SheetFooter({ applyLabel, clearLabel, onApply, onClear }: SheetFooterProps) {
    return (
        <>
            <div className="flex h-[52.67px] shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.06)]">
                <button onClick={onApply} className="w-1/2 cursor-pointer border-0 bg-[#957e4e] text-[18.5px] text-white">{applyLabel}</button>
                <button onClick={onClear} className="w-1/2 cursor-pointer border-0 bg-white text-[18.5px] text-black">{clearLabel}</button>
            </div>
        </>
    )
}
