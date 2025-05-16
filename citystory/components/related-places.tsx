import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Place {
  id: string
  name: string
  slug: string
  type: string
  rating: number
  location: string
  photos: string[]
}

interface RelatedPlacesProps {
  places: Place[]
}

export default function RelatedPlaces({ places }: RelatedPlacesProps) {
  return (
    <div className="space-y-4">
      {places.map((place) => (
        <Link key={place.id} href={`/places/${place.slug}`}>
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="flex">
              <div className="relative h-24 w-24 flex-shrink-0">
                <Image src={place.photos[0] || "/placeholder.svg"} alt={place.name} fill className="object-cover" />
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-[#112D4E] line-clamp-1">{place.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span className="mr-2">{place.type}</span>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700] mr-1" />
                    <span>{place.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{place.location}</p>
              </CardContent>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
