import Intro from "./Intro"
import SideSearch from "./SideSearch/SideSearch"
import AppSearch from "./AppSearch/AppSearch"

export default function Hero() {
    return (
        <>
            <AppSearch />
            <div className="relative mx-auto w-full max-w-350 overflow-hidden px-5 pt-5 pb-15 min-[1000px]:pt-0 min-[1000px]:pb-25 max-[601px]:pt-0 max-[601px]:pb-0">
                <Intro />
                <SideSearch />
            </div>
        </>
    )
}
