import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { DropdownMenu } from "./dropdown-menu"
import { User } from "lucide-react"



export const Avatar = () => {

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="bg-gray-200 cursor-pointer p-2 rounded-full">
                <User />
              </div>
            </DropdownMenuTrigger>
        </DropdownMenu>
    )
}

