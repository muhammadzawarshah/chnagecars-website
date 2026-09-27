import LanguageSelect from "./LanguageSelect"

export default function AppBar({ onMenu }: { onMenu: () => void }) {
    return (
        <>
            <div className="fixed top-0 left-0 z-80 hidden h-14 w-full bg-white max-[981px]:block">
                <button onClick={onMenu} aria-label="Open menu" className="absolute top-1 left-3.5 flex size-12 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                    <svg width="19.33" height="13" viewBox="0 0 18 12" fill="#000">
                        <rect y="0" width="18" height="2" rx="1" />
                        <rect y="5" width="18" height="2" rx="1" />
                        <rect y="10" width="18" height="2" rx="1" />
                    </svg>
                </button>
                <LanguageSelect />
            </div>
        </>
    )
}
