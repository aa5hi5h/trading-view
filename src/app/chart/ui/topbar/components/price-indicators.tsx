import { ChartNoAxesCombined } from "lucide-react"


export const PriceIndicators = () => {

    return (
        <div className="flex items-center  gap-x-1">
            <ChartNoAxesCombined size={20} className="text-gray-600" />
            <div>Indicators</div>
        </div>
    )
}