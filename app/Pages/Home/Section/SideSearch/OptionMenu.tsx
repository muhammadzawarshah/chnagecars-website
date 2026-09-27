export type MenuItem = {
    id: string
    label: string
    selected: boolean
    onSelect: () => void
}

export default function OptionMenu({ items }: { items: MenuItem[] }) {
    return (
        <>
            <div className="absolute top-full z-46 mt-px max-h-62.5 w-full overflow-y-auto rounded-b bg-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9d885c] [&::-webkit-scrollbar-track]:bg-[#f4f4f4]">
                <ul className="m-0 list-none p-1.5">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            onClick={item.onSelect}
                            className={`flex h-7.5 cursor-pointer items-center justify-between rounded px-2.5 text-[13px] ${item.selected ? "bg-[#eee8dc] font-semibold text-[#957e4d]" : "text-[#171717] hover:bg-[#f5f2ed]"}`}
                        >
                            <span>{item.label}</span>
                            {item.selected && <svg width="13" height="10" viewBox="0 0 18 14" fill="none" stroke="#9d885c" strokeWidth="2"><path d="M1 7l5 5L17 1" /></svg>}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}
