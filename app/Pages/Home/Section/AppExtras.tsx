import FollowChangecars from "./FollowChangecars"
import SellVehicleCard from "./SellVehicleCard"

export default function AppExtras() {
    return (
        <>
            <div className="bg-white pt-12.5 max-[601px]:bg-[#f8fafd] max-[601px]:pt-0 max-[601px]:pb-5">
                <div className="hidden max-[601px]:block">
                    <FollowChangecars />
                </div>
                <div className="mx-auto max-w-350 px-8.75 max-[601px]:mt-9.25 max-[601px]:px-4.75">
                    <SellVehicleCard />
                </div>
            </div>
        </>
    )
}
