import { followLinks } from "../Data/follow"

export default function FollowChangecars() {
    return (
        <>
            <div className="text-center">
                <h2 className="m-0 text-base leading-[1.2] font-normal text-[#957e4e] uppercase">
                    Follow <strong className="font-bold">Changecars</strong>
                </h2>
                <div className="mt-3.5 flex justify-center gap-7">
                    {followLinks.map((link) => (
                        <a key={link.label} href={link.href} target="_blank" aria-label={link.label} className="flex size-11.25 items-center justify-center rounded-[9px] bg-[#957e4e]">
                            <img src={link.icon} alt="" className="size-6.5" />
                        </a>
                    ))}
                </div>
            </div>
        </>
    )
}
