import { ClockPlus } from "lucide-react"



export const PriceAlert = () => {

    return (
        <div className="flex items-center gap-x-1">
           <ClockPlus size={20} className="text-gray-600" />
           <div>Alert</div>
        </div>
    )
}