import { Avatar } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SearchBar } from "./components/search-bar"
import { AddSymbol } from "./components/add-symbol"
import { Separator } from "@/components/ui/separator"
import { PriceTimeStamp } from "./components/price-time-stamp"
import { CandleBar } from "./components/candle-bar"
import { PriceIndicators } from "./components/price-indicators"
import { PriceAlert } from "./components/price-alert"
import { PriceReplay } from "./components/price-replay"
import { UndoChart } from "./components/undo"
import { RedoChart } from "./components/redo"
import { LayoutOptions } from "./components/layout-options"
import { ToolSearch } from "./components/tool-search"
import { CanvasSetting } from "./components/canvas-setting"
import { FullScreen } from "./components/full-screen"
import { ChartSnapshot } from "./components/chart-snapshot"
import { Publish } from "./components/publish"


export const Topbar = () => {

    return (
        <div className="flex h-full  px-2 w-full items-center select-none justify-between">
            <div className="flex items-center gap-x-1  ">
                    <Avatar />
                <Tooltip>
                    <TooltipTrigger className=" p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <SearchBar />
                    </TooltipTrigger>
                    <TooltipContent>
                        Search Symbol
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <AddSymbol />
                    </TooltipTrigger>
                    <TooltipContent>
                        Compare or Add Symbol
                    </TooltipContent>
                </Tooltip>
                <Separator
                className="!h-6 !w-[1px] !rounded-full !bg-gray-200" 
                orientation="vertical" />
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <PriceTimeStamp />
                    </TooltipTrigger>
                    <TooltipContent>
                        1D
                    </TooltipContent>
                </Tooltip>
                <Separator
                className="!h-6 !w-[1px] !rounded-full !bg-gray-200" 
                orientation="vertical" />
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <CandleBar />
                    </TooltipTrigger>
                    <TooltipContent>
                        Candles
                    </TooltipContent>
                </Tooltip>
                <Separator
                className="!h-6 !w-[1px] !rounded-full !bg-gray-200" 
                orientation="vertical" />
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <PriceIndicators />
                    </TooltipTrigger>
                    <TooltipContent>
                        Indicator , strategies , pattern
                    </TooltipContent>
                </Tooltip>
                <Separator
                className="!h-6 !w-[1px] !rounded-full !bg-gray-200" 
                orientation="vertical" />
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <PriceAlert />
                    </TooltipTrigger>
                    <TooltipContent>
                        Create Alert 
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger  className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <PriceReplay />
                    </TooltipTrigger>
                    <TooltipContent>
                        Bar Replay
                    </TooltipContent>
                </Tooltip>
                <Separator
                className="!h-6 !w-[1px] !rounded-full !bg-gray-200" 
                orientation="vertical" />
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <UndoChart />
                    </TooltipTrigger>
                    <TooltipContent>
                        Undo
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <RedoChart />
                    </TooltipTrigger>
                    <TooltipContent>
                        Redo
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="flex gap-x-2 items-center">
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <LayoutOptions />
                    </TooltipTrigger>
                    <TooltipContent>
                        Layout setup
                    </TooltipContent>
                </Tooltip>
                <Separator
                className="!h-6 !w-[1px] !rounded-full !bg-gray-200" 
                orientation="vertical" />
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <ToolSearch />
                    </TooltipTrigger>
                    <TooltipContent>
                        Quick Search
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <CanvasSetting />
                    </TooltipTrigger>
                    <TooltipContent>
                        Settings
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <FullScreen />
                    </TooltipTrigger>
                    <TooltipContent>
                        Fullscreen Mode
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="p-2.5 rounded-md hover:bg-gray-200" asChild>
                        <ChartSnapshot />
                    </TooltipTrigger>
                    <TooltipContent>
                        Take a snapshot
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className=""  asChild>
                        <Publish />
                    </TooltipTrigger>
                    <TooltipContent>
                        Share your idea with the trade community
                    </TooltipContent>
                </Tooltip>

            </div>
            
        </div>
    )
}