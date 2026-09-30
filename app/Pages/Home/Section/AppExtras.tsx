import FollowChangecars from "./FollowChangecars"
import SellVehicleCard from "./SellVehicleCard"

export default function AppExtras() {
    return (
        <>
            <div className="hidden bg-white pb-5 max-[601px]:block">
                <FollowChangecars />
                <div className="mt-9.25">
                    <SellVehicleCard />
                </div>
            </div>
        </>
    )
}
