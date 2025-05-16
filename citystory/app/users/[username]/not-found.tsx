import Link from "next/link"
import { Search, Home, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UserNotFound() {
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-8 relative">
          <div className="w-32 h-32 bg-[#DBE2EF] rounded-full mx-auto flex items-center justify-center">
            <User className="h-16 w-16 text-[#3F72AF]" />
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#DBE2EF]/50 rounded-full animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-[#112D4E] mb-4">Oops! User Not Found</h1>
        <p className="text-[#3F72AF] mb-8">
          We couldn&apos;t find the user you&apos;re looking for. They might have changed their username or don&apos;t exist yet.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="flex items-center">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild className="bg-[#3F72AF]">
            <Link href="/explore">
              <Search className="mr-2 h-4 w-4" />
              Explore Places
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-[#DBE2EF]">
          <p className="text-gray-600 mb-4">Looking for someone to follow? Check out our top contributors!</p>
          <Button asChild variant="outline" className="bg-[#F9F7F7]">
            <Link href="/users/jane-smith">
              <UserPlus className="mr-2 h-4 w-4" />
              View Top Contributors
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Import missing icon
import { User } from "lucide-react"
