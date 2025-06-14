import { BottomBar } from "./ui/bottom-bar/main"
import { ChartTimeFrame } from "./ui/chart-time-frame/main"
import { LeftSideBar } from "./ui/left-sidebar/main"
import { RightSideBar } from "./ui/right-sidebar/main"
import { Topbar } from "./ui/topbar/main"


const ChartLayout = ({children}:{children: React.ReactNode}) => {

    return (
        <div className="grid grid-rows-[8%_92%_] grid-cols-[4%_92%_4%] h-screen">
            <div className="col-span-3">
                <Topbar />
            </div>
            <div className="bg-blue-400">
                <LeftSideBar />
            </div>
            <div className="bg-pink-500 grid grid-rows-[92%_8%_]">
                <div className="grid bg-green-500 grid-rows-[92%_8%_]">
                    <div className="bg-teal-400">{children}</div>
                    <div className="bg-orange-500"><ChartTimeFrame /></div>
                </div>
                <div className="bg-emerald-500"><BottomBar /></div>
            </div>
            <div className="bg-red-500">
                <RightSideBar />
            </div>
            
        </div>
    )
}

export default ChartLayout