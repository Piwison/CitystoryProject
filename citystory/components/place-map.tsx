"use client"

import { useState } from "react"
import { MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlaceMapProps {
  address: string
}

export default function PlaceMap({ address }: PlaceMapProps) {
  const [isInteracting, setIsInteracting] = useState(false)

  // In a real app, this would use a mapping API like Google Maps or Mapbox
  return (
    <div
      className="bg-[#F9F7F7] h-full w-full flex items-center justify-center relative overflow-hidden rounded-lg border border-[#DBE2EF] transition-all duration-300"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      style={{
        backgroundImage: "url('/taipei-cute-map.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className={`absolute inset-0 bg-[#DBE2EF]/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${isInteracting ? "opacity-0" : "opacity-100"}`}
      >
        <div className="text-center max-w-md p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
          <MapPin className="h-8 w-8 text-[#3F72AF] mx-auto mb-2" />
          <p className="text-[#112D4E] font-medium mb-1">Location</p>
          <p className="text-sm text-gray-600 mb-3">{address}</p>
          <Button size="sm" className="bg-[#3F72AF]">
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
        </div>
      </div>

      <div
        className={`absolute bottom-4 right-4 transition-opacity duration-300 ${isInteracting ? "opacity-100" : "opacity-0"}`}
      >
        <Button size="sm" className="bg-[#3F72AF]">
          <Navigation className="h-4 w-4 mr-2" />
          Get Directions
        </Button>
      </div>
    </div>
  )
}
