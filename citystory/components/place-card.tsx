import Image from "next/image"
import Link from "next/link"
import { MapPin, Star, ArrowRight } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PlaceCardProps {
  name: string
  type: string
  rating: number
  image: string
  location: string
  description: string
  priceLevel: number
  viewMode: "grid" | "list"
}

export default function PlaceCard({
  name,
  type,
  rating,
  image,
  location,
  description,
  priceLevel,
  viewMode,
}: PlaceCardProps) {
  const priceString = Array(priceLevel).fill("$").join("")
  const slug = name.toLowerCase().replace(/\s+/g, "-")

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0">
            <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
            <Badge className="absolute top-3 right-3 bg-white/90 text-[#112D4E]">{type}</Badge>
          </div>
          <div className="flex flex-col p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-[#112D4E]">{name}</h3>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{rating}</span>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {location} • {priceString}
            </div>
            <p className="text-sm text-gray-600 mb-4 flex-grow">{description}</p>
            <Link href={`/places/${slug}`} className="text-[#3F72AF] text-sm font-medium hover:underline">
              View Details
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative h-48 w-full">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
        <Badge className="absolute top-3 right-3 bg-white/90 text-[#112D4E]">{type}</Badge>
      </div>
      <CardContent className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-[#112D4E]">{name}</h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="font-medium">{rating}</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          {location} • {priceString}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
      <CardFooter className="pt-0 px-4 pb-4">
        <Link href={`/places/${slug}`} className="text-[#3F72AF] text-sm font-medium hover:underline flex items-center">
          View Details
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  )
}
