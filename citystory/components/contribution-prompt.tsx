"use client"

import { useState } from "react"
import Link from "next/link"
import { PencilLine, Camera, MapPin, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function ContributionPrompt() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className={cn(
        "overflow-hidden border-none shadow-sm transition-all duration-300",
        isHovered ? "shadow-md transform -translate-y-1" : "",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-[#3F72AF] to-[#112D4E] p-4 text-white">
          <h3 className="font-medium mb-1">Help improve this page</h3>
          <p className="text-sm text-white/80">Share your knowledge with the community</p>
        </div>

        <div className="p-4 space-y-3">
          <Link href="/add" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9F7F7] transition-colors">
            <div className="h-8 w-8 rounded-full bg-[#DBE2EF] flex items-center justify-center">
              <PencilLine className="h-4 w-4 text-[#3F72AF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#112D4E]">Update information</p>
              <p className="text-xs text-gray-500">Add missing details or correct errors</p>
            </div>
          </Link>

          <Link
            href="#write-review"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9F7F7] transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-[#DBE2EF] flex items-center justify-center">
              <Plus className="h-4 w-4 text-[#3F72AF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#112D4E]">Add a review</p>
              <p className="text-xs text-gray-500">Share your experience with others</p>
            </div>
          </Link>

          <Link href="#" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9F7F7] transition-colors">
            <div className="h-8 w-8 rounded-full bg-[#DBE2EF] flex items-center justify-center">
              <Camera className="h-4 w-4 text-[#3F72AF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#112D4E]">Add photos</p>
              <p className="text-xs text-gray-500">Upload your pictures of this place</p>
            </div>
          </Link>

          <Link href="#" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9F7F7] transition-colors">
            <div className="h-8 w-8 rounded-full bg-[#DBE2EF] flex items-center justify-center">
              <MapPin className="h-4 w-4 text-[#3F72AF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#112D4E]">Suggest an edit</p>
              <p className="text-xs text-gray-500">Improve location or address details</p>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
