import { Search } from "lucide-react"


export const SearchBar = () => {

    return (
        <div className="">
            <div className="flex relative items-center gap-x-1">
                <Search size={18} className="text-gray-600" />
                <div>Token</div>
            </div>
        </div>
    )
}