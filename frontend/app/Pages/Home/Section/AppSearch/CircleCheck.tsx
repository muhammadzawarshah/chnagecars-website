export default function CircleCheck({ checked }: { checked: boolean }) {
    return (
        <>
            {checked ? (
                <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-[#957e4e]">
                    <svg width="10.67" height="8" viewBox="0 0 16 12" fill="none" stroke="#fff" strokeWidth="2">
                        <path d="M1.5 6.2l4.3 4.3L14.5 1.5" />
                    </svg>
                </span>
            ) : (
                <span className="size-5.5 shrink-0 rounded-full border-[1.33px] border-[#bdbdbd]"></span>
            )}
        </>
    )
}
