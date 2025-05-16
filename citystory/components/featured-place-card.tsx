import Image from "next/image"
import Link from "next/link"
import { MapPin, Star } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FeaturedPlaceCardProps {
  name: string
  type: string
  rating: number
  image: string
  location: string
  description: string
}

export default function FeaturedPlaceCard({
  name,
  type,
  rating,
  image,
  location,
  description,
}: FeaturedPlaceCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-none">
      <div className="relative h-56 w-full">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
        <Badge className="absolute top-4 right-4 bg-[#3F72AF] text-white font-medium">{type}</Badge>
      </div>
      <CardContent className="p-6 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-[#112D4E]">{name}</h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700] mr-1" />
            <span className="font-medium">{rating}</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500 mt-2 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {location}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
      <CardFooter className="pt-0 px-6 pb-6">
        <Link
          href={`/places/${name.toLowerCase().replace(/\s+/g, "-")}`}
          className="text-[#3F72AF] text-sm font-medium hover:underline flex items-center"
        >
          View Details
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  )
}

// Import missing icon
import { ArrowRight } from "lucide-react"
