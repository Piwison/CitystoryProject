import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, MapPin, Star, Heart, Plus, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Saved Places | Taipei Guide",
  description: "Your collection of saved places in Taipei",
}

// Mock saved places data
const savedPlaces = [
  {
    id: "1",
    name: "Elephant Mountain Café",
    slug: "elephant-mountain-cafe",
    type: "Café",
    rating: 4.8,
    image: "/laptop-cafe-buzz.png",
    location: "Xinyi District",
    description: "A cozy café with stunning views of Taipei 101, perfect for digital nomads.",
    dateAdded: "2023-10-15",
  },
  {
    id: "2",
    name: "Din Tai Fung",
    slug: "din-tai-fung",
    type: "Restaurant",
    rating: 4.9,
    image: "/waterfront-elegance.png",
    location: "Xinyi District",
    description: "World-famous restaurant known for its exquisite soup dumplings and Taiwanese cuisine.",
    dateAdded: "2023-09-22",
  },
  {
    id: "3",
    name: "Beitou Hot Springs",
    slug: "beitou-hot-springs",
    type: "Attraction",
    rating: 4.7,
    image: "/craft-beer-haven.png",
    location: "Beitou District",
    description: "Relaxing natural hot springs in a beautiful mountainous setting just outside the city.",
    dateAdded: "2023-11-05",
  },
]

export default function SavedPlacesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/" className="inline-flex items-center text-[#3F72AF] hover:text-[#112D4E] mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#112D4E] mb-2">Your Saved Places</h1>
          <p className="text-[#3F72AF]">Places you&apos;ve saved for future adventures</p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-[#3F72AF]">
            <Link href="/explore">
              <Plus className="mr-2 h-4 w-4" />
              Discover More Places
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search your saved places..."
            className="pr-10 border-[#DBE2EF] focus-visible:ring-[#3F72AF]"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex items-center border-[#DBE2EF]">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Tabs defaultValue="all" className="w-full md:w-auto">
            <TabsList className="bg-[#F9F7F7]">
              <TabsTrigger value="all" className="data-[state=active]:bg-white">
                All
              </TabsTrigger>
              <TabsTrigger value="want-to-go" className="data-[state=active]:bg-white">
                Want to Go
              </TabsTrigger>
              <TabsTrigger value="visited" className="data-[state=active]:bg-white">
                Visited
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {savedPlaces.length === 0 ? (
        <div className="text-center py-16 bg-[#F9F7F7] rounded-xl">
          <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-[#3F72AF]" />
          </div>
          <h2 className="text-xl font-medium text-[#112D4E] mb-2">No saved places yet</h2>
          <p className="text-[#3F72AF] mb-6 max-w-md mx-auto">
            Start exploring and save places you&apos;d like to visit or remember
          </p>
          <Button asChild className="bg-[#3F72AF]">
            <Link href="/explore">Explore Places</Link>
          </Button>
        </div>
      ) : (
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
                    <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                      Saved on {new Date(place.dateAdded).toLocaleDateString()}
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
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {place.location}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{place.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
