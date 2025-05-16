import Link from "next/link"
import Image from "next/image"
import { MapPin, Star, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SavedPlace {
  id: string
  name: string
  slug: string
  type: string
  rating: number
  image: string
  location: string
}

interface UserSavedPlacesProps {
  savedPlaces: SavedPlace[]
}

export default function UserSavedPlaces({ savedPlaces }: UserSavedPlacesProps) {
  if (savedPlaces.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#F9F7F7] rounded-full mx-auto flex items-center justify-center mb-4">
          <Heart className="h-8 w-8 text-[#3F72AF]" />
        </div>
        <h3 className="text-xl font-medium text-[#112D4E] mb-2">No saved places yet</h3>
        <p className="text-[#3F72AF] mb-6">This user hasn&apos;t saved any places yet</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-medium text-[#112D4E] mb-4">Saved Places</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedPlaces.map((place) => (
          <Link key={place.id} href={`/places/${place.slug}`} className="group">
            <Card className="overflow-hidden border-none shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="relative h-48">
                  <Image src={place.image || "/placeholder.svg"} alt={place.name} fill className="object-cover" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-[#112D4E]">{place.type}</Badge>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="bg-white/90 rounded-full p-1.5">
                      <Heart className="h-4 w-4 fill-[#FF6B6B] text-[#FF6B6B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#112D4E] group-hover:text-[#3F72AF] transition-colors">
                      {place.name}
                    </h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700] mr-1" />
                      <span className="font-medium">{place.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {place.location}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
