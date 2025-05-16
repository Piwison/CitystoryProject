import Link from "next/link"
import Image from "next/image"
import { MapPin, Star, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Contribution {
  id: string
  name: string
  slug: string
  type: string
  rating: number
  image: string
  location: string
  date: string
}

interface UserContributionsProps {
  contributions: Contribution[]
}

export default function UserContributions({ contributions }: UserContributionsProps) {
  if (contributions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#F9F7F7] rounded-full mx-auto flex items-center justify-center mb-4">
          <MapPin className="h-8 w-8 text-[#3F72AF]" />
        </div>
        <h3 className="text-xl font-medium text-[#112D4E] mb-2">No contributions yet</h3>
        <p className="text-[#3F72AF] mb-6">This user hasn&apos;t added any places yet</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-medium text-[#112D4E] mb-4">Places Added</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contributions.map((contribution) => (
          <Link key={contribution.id} href={`/places/${contribution.slug}`} className="group">
            <Card className="overflow-hidden border-none shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="relative h-48">
                  <Image
                    src={contribution.image || "/placeholder.svg"}
                    alt={contribution.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-[#112D4E]">{contribution.type}</Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(contribution.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#112D4E] group-hover:text-[#3F72AF] transition-colors">
                      {contribution.name}
                    </h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700] mr-1" />
                      <span className="font-medium">{contribution.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {contribution.location}
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
