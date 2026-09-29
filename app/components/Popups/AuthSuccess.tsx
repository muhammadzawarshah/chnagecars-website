type AuthSuccessProps = {
    message: string
    onClose: () => void
    onLogin?: () => void
    light?: boolean
}

export default function AuthSuccess({ message, onClose, onLogin, light = false }: AuthSuccessProps) {
    return (
        <div className="relative float-left w-3/5 px-17.5 pt-32.5 max-[841px]:float-none max-[841px]:w-full max-[841px]:px-17.5 max-[841px]:py-12.5">
            <a onClick={onClose} className={`absolute top-8 right-8 block size-3.75 cursor-pointer ${light ? "bg-[url(/img/close-black.svg)]" : "bg-[url(/img/close-popup.svg)]"} bg-cover bg-center bg-no-repeat`}></a>
            <h2 className={`my-6 text-center text-[32px] font-bold uppercase ${light ? "text-[#957e4e]" : "text-white"}`}>Success</h2>
            <img src="/img/success-car.png" alt="Success" className={`mx-auto block size-37.5 ${light ? "rounded-full bg-[#957e4e]" : ""}`} />
            <p className={`mx-auto my-6.25 block max-w-85 text-center text-xl font-extralight ${light ? "text-[#333]" : "text-white"}`}>{message}</p>
            {onLogin && (
                <a onClick={onLogin} className={`mx-auto block h-11.25 max-w-90.5 cursor-pointer rounded-[25px] text-center text-base leading-11.25 font-black transition duration-300 ${light ? "bg-[#957e4e] text-white hover:opacity-90" : "bg-white text-ink hover:bg-ink hover:text-white"}`}>
                    Sign In
                </a>
            )}
        </div>
    )
}
