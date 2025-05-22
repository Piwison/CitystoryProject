"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  Filter,
  X,
  MapPin,
  Star,
  Heart,
  MessageCircle,
  Coffee,
  Utensils,
  Music,
  Landmark,
  Plus,
  Users,
  ChevronDown,
  ChevronUp,
  MapIcon,
  Grid,
  List,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useAuth } from '@/context/AuthContext'
import { cn, getUserDisplayName, getUserInitials } from "@/lib/utils"

// Reduced place types to only 4 options
const placeTypes = [
  { id: "restaurant", label: "Restaurant", icon: <Utensils className="h-4 w-4" /> },
  { id: "cafe", label: "Café", icon: <Coffee className="h-4 w-4" /> },
  { id: "bar", label: "Bar", icon: <Music className="h-4 w-4" /> },
  { id: "attraction", label: "Attraction", icon: <Landmark className="h-4 w-4" /> },
]

// Feature sets for each place type
const placeFeatures = {
  restaurant: [
    { id: "authentic", label: "Authentic Cuisine" },
    { id: "fusion", label: "Fusion Cuisine" },
    { id: "local-ingredients", label: "Local Ingredients" },
    { id: "vegetarian", label: "Vegetarian Options" },
    { id: "vegan", label: "Vegan Options" },
    { id: "signature-dish", label: "Signature Dish" },
    { id: "private-dining", label: "Private Dining" },
    { id: "english-menu", label: "English Menu" },
    { id: "reservation", label: "Reservation Needed" },
  ],
  cafe: [
    { id: "wifi", label: "Good WiFi" },
    { id: "power-outlets", label: "Power Outlets" },
    { id: "workspace", label: "Workspace Friendly" },
    { id: "specialty-coffee", label: "Specialty Coffee" },
    { id: "house-roasted", label: "House-Roasted Beans" },
    { id: "pet-friendly", label: "Pet Friendly" },
    { id: "pastry", label: "Good Pastry Selection" },
  ],
  bar: [
    { id: "craft", label: "Craft Selection" },
    { id: "local-spirits", label: "Local Spirits" },
    { id: "live-music", label: "Live Music" },
    { id: "late-hours", label: "Late Hours" },
    { id: "food-menu", label: "Good Food Menu" },
    { id: "outdoor", label: "Outdoor Seating" },
    { id: "lively", label: "Lively Atmosphere" },
    { id: "relaxed", label: "Relaxed Atmosphere" },
  ],
  attraction: [
    { id: "hidden-gem", label: "Hidden Gem" },
    { id: "photo-spots", label: "Great Photo Spots" },
    { id: "local-experience", label: "Local Experience" },
    { id: "morning", label: "Best in Morning" },
    { id: "evening", label: "Best at Sunset/Evening" },
    { id: "low-crowd", label: "Usually Not Crowded" },
    { id: "english-guidance", label: "English Guidance" },
    { id: "rain-friendly", label: "Rain-Friendly" },
  ],
}

const regions = [
  { id: "xinyi", label: "Xinyi District" },
  { id: "datong", label: "Datong District" },
  { id: "daan", label: "Da'an District" },
  { id: "shilin", label: "Shilin District" },
  { id: "wanhua", label: "Wanhua District" },
  { id: "songshan", label: "Songshan District" },
  { id: "zhongshan", label: "Zhongshan District" },
  { id: "beitou", label: "Beitou District" },
]

const mockPlaces = [
  {
    id: "1",
    name: "Elephant Mountain Café",
    slug: "elephant-mountain-cafe",
    type: "cafe",
    rating: 4.8,
    image: "/laptop-cafe-buzz.png",
    location: "Xinyi District",
    description: "A cozy café with stunning views of Taipei 101, perfect for digital nomads.",
    priceLevel: 2,
    contributor: "Jane S.",
    contributorInitials: "JS",
    reviews: 124,
    likes: 56,
    features: ["wifi", "power-outlets", "workspace", "specialty-coffee"],
  },
  {
    id: "2",
    name: "Din Tai Fung",
    slug: "din-tai-fung",
    type: "restaurant",
    rating: 4.9,
    image: "/waterfront-elegance.png",
    location: "Xinyi District",
    description: "World-famous restaurant known for its exquisite soup dumplings and Taiwanese cuisine.",
    priceLevel: 3,
    contributor: "Michael C.",
    contributorInitials: "MC",
    reviews: 356,
    likes: 89,
    features: ["authentic", "signature-dish", "reservation", "english-menu"],
  },
  {
    id: "3",
    name: "Taipei Night Market",
    slug: "taipei-night-market",
    type: "attraction",
    rating: 4.7,
    image: "/craft-beer-haven.png",
    location: "Shilin District",
    description: "Vibrant night market offering a wide variety of local street food and shopping.",
    priceLevel: 1,
    contributor: "Lisa W.",
    contributorInitials: "LW",
    reviews: 289,
    likes: 72,
    features: ["local-experience", "evening", "photo-spots"],
  },
  {
    id: "4",
    name: "Songshan Cultural Park",
    slug: "songshan-cultural-park",
    type: "attraction",
    rating: 4.5,
    image: "/laptop-cafe-buzz.png",
    location: "Xinyi District",
    description: "Former tobacco factory transformed into a creative hub with exhibitions and cafés.",
    priceLevel: 1,
    contributor: "David L.",
    contributorInitials: "DL",
    reviews: 78,
    likes: 34,
    features: ["rain-friendly", "english-guidance", "photo-spots"],
  },
  {
    id: "5",
    name: "Fujin Street",
    slug: "fujin-street",
    type: "attraction",
    rating: 4.6,
    image: "/waterfront-elegance.png",
    location: "Songshan District",
    description: "Trendy street lined with boutique shops, cafés, and restaurants away from tourist crowds.",
    priceLevel: 2,
    contributor: "Alex T.",
    contributorInitials: "AT",
    reviews: 45,
    likes: 28,
    features: ["hidden-gem", "local-experience"],
  },
  {
    id: "6",
    name: "Beitou Hot Springs",
    slug: "beitou-hot-springs",
    type: "attraction",
    rating: 4.7,
    image: "/craft-beer-haven.png",
    location: "Beitou District",
    description: "Relaxing natural hot springs in a beautiful mountainous setting just outside the city.",
    priceLevel: 3,
    contributor: "Sarah J.",
    contributorInitials: "SJ",
    reviews: 92,
    likes: 47,
    features: ["photo-spots", "local-experience"],
  },
  {
    id: "7",
    name: "Craft Beer Bar",
    slug: "craft-beer-bar",
    type: "bar",
    rating: 4.6,
    image: "/craft-beer-haven.png",
    location: "Zhongshan District",
    description: "Cozy bar with an extensive selection of local and international craft beers.",
    priceLevel: 3,
    contributor: "Tom H.",
    contributorInitials: "TH",
    reviews: 67,
    likes: 41,
    features: ["craft", "local-spirits", "relaxed"],
  },
  {
    id: "8",
    name: "Mountain View Teahouse",
    slug: "mountain-view-teahouse",
    type: "cafe",
    rating: 4.7,
    image: "/laptop-cafe-buzz.png",
    location: "Maokong",
    description: "Traditional teahouse with panoramic views of Taipei city from the mountains.",
    priceLevel: 2,
    contributor: "Emily L.",
    contributorInitials: "EL",
    reviews: 103,
    likes: 62,
    features: ["specialty-coffee", "pet-friendly", "outdoor"],
  },
]

// Feature Chip component
function FeatureChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        selected ? "bg-[#3F72AF] text-white" : "bg-white border border-[#DBE2EF] text-[#112D4E] hover:bg-[#F9F7F7]"
      }`}
    >
      {label}
    </button>
  )
}

export default function ExplorePage() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isMapView, setIsMapView] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const { user } = useAuth()

  const handleRegionChange = (region: string) => {
    setSelectedRegions((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]))
    updateActiveFilters(region, "region")
  }

  const handleTypeChange = (type: string) => {
    if (selectedType === type) {
      setSelectedType("")
      setSelectedFeatures([])
      setActiveFilters((prev) => prev.filter((f) => !f.startsWith("type:") && !f.startsWith("feature:")))
    } else {
      setSelectedType(type)
      setSelectedFeatures([])
      setActiveFilters((prev) => {
        const newFilters = prev.filter((f) => !f.startsWith("type:") && !f.startsWith("feature:"))
        return [...newFilters, `type:${type}`]
      })
    }
  }

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) => {
      const newFeatures = prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]

      // Update active filters
      if (prev.includes(featureId)) {
        setActiveFilters((prevFilters) => prevFilters.filter((f) => f !== `feature:${featureId}`))
      } else {
        setActiveFilters((prevFilters) => [...prevFilters, `feature:${featureId}`])
      }

      return newFeatures
    })
  }

  const updateActiveFilters = (value: string, type: string) => {
    const filter = `${type}:${value}`
    setActiveFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]))
  }

  const removeFilter = (filter: string) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filter))

    const [type, value] = filter.split(":")
    if (type === "region") {
      setSelectedRegions((prev) => prev.filter((r) => r !== value))
    } else if (type === "type") {
      setSelectedType("")
    } else if (type === "feature") {
      setSelectedFeatures((prev) => prev.filter((f) => f !== value))
    }
  }

  const clearAllFilters = () => {
    setSelectedRegions([])
    setSelectedType("")
    setSelectedFeatures([])
    setActiveFilters([])
  }

  // Filter places based on selected filters and search query
  const filteredPlaces = mockPlaces.filter((place) => {
    // Filter by region
    if (
      selectedRegions.length > 0 &&
      !selectedRegions.some((region) => place.location.toLowerCase().includes(region.toLowerCase()))
    ) {
      return false
    }

    // Filter by type
    if (selectedType && place.type !== selectedType) {
      return false
    }

    // Filter by features
    if (selectedFeatures.length > 0 && !selectedFeatures.every((feature) => place.features?.includes(feature))) {
      return false
    }

    // Filter by search query
    if (
      searchQuery &&
      !place.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !place.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !place.location.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    return true
  })

  // Get feature label from ID
  const getFeatureLabel = (featureId: string) => {
    for (const type in placeFeatures) {
      const feature = placeFeatures[type as keyof typeof placeFeatures].find((f) => f.id === featureId)
      if (feature) return feature.label
    }
    return featureId
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section with Community Focus */}
      <div className="mb-12 relative overflow-hidden rounded-xl bg-gradient-to-r from-[#112D4E] to-[#3F72AF] text-white">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="doodlePattern"
                patternUnits="userSpaceOnUse"
                width="100"
                height="100"
                patternTransform="rotate(45)"
              >
                <circle cx="50" cy="50" r="2" fill="#ffffff" />
                <circle cx="25" cy="25" r="1" fill="#ffffff" />
                <circle cx="75" cy="75" r="1" fill="#ffffff" />
                <circle cx="25" cy="75" r="1" fill="#ffffff" />
                <circle cx="75" cy="25" r="1" fill="#ffffff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#doodlePattern)" />
          </svg>
        </div>

        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
            <Badge className="mb-4 bg-white/20 text-white backdrop-blur-sm px-4 py-1 text-sm">Community-Powered</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Taipei&apos;s Hidden Gems</h1>
            <p className="text-white/80 mb-6">
              Explore authentic places shared by locals and fellow travelers. Every recommendation comes from real
              experiences, not tourist brochures.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">{mockPlaces.length} places shared</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700] mr-2" />
                <span className="text-sm">4.7 avg rating</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">1,154 reviews</span>
              </div>
            </div>

            {user ? (
              <Button asChild className="bg-[#FFD700] hover:bg-[#F2C94C] text-[#112D4E]">
                <Link href="/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Share Your Secret Spot
                </Link>
              </Button>
            ) : (
              <Button asChild className="bg-white text-[#112D4E] hover:bg-white/90">
                <Link href="/add">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Join & Share Your Discoveries
                </Link>
              </Button>
            )}
          </div>

          <div className="md:w-1/3 relative">
            <div className="relative h-48 md:h-64 w-full rounded-lg overflow-hidden shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <Image src="/laptop-cafe-buzz.png" alt="Community shared place" fill className="object-cover" />
              <div className="absolute bottom-3 right-3">
                <Avatar className="border-2 border-white h-8 w-8">
                  <AvatarFallback className="bg-[#3F72AF] text-white text-xs">JS</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-lg overflow-hidden shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 hidden md:block">
              <Image src="/waterfront-elegance.png" alt="Community shared place" fill className="object-cover" />
              <div className="absolute bottom-2 right-2">
                <Avatar className="border-2 border-white h-6 w-6">
                  <AvatarFallback className="bg-[#3F72AF] text-white text-xs">MC</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle and Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex gap-2">
          <Button
            variant={isMapView ? "outline" : "default"}
            size="sm"
            onClick={() => setIsMapView(false)}
            className={!isMapView ? "bg-[#3F72AF]" : ""}
          >
            <Grid className="h-4 w-4 mr-2" />
            Places
          </Button>
          <Button
            variant={isMapView ? "default" : "outline"}
            size="sm"
            onClick={() => setIsMapView(true)}
            className={isMapView ? "bg-[#3F72AF]" : ""}
          >
            <MapIcon className="h-4 w-4 mr-2" />
            Map View
          </Button>
        </div>

        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search places, areas, or keywords..."
            className="pr-10 border-[#DBE2EF] focus-visible:ring-[#3F72AF]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>

        <div className="flex gap-2">
          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:flex items-center border-[#DBE2EF]">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilters.length > 0 && <Badge className="ml-2 bg-[#3F72AF]">{activeFilters.length}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <MobileFilters
                  regions={regions}
                  placeTypes={placeTypes}
                  placeFeatures={placeFeatures}
                  selectedRegions={selectedRegions}
                  selectedType={selectedType}
                  selectedFeatures={selectedFeatures}
                  handleRegionChange={handleRegionChange}
                  handleTypeChange={handleTypeChange}
                  toggleFeature={toggleFeature}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Tabs value={viewMode} onValueChange={setViewMode} className="hidden md:block">
            <TabsList className="h-10 bg-[#F9F7F7]">
              <TabsTrigger value="grid" className="px-3 data-[state=active]:bg-white">
                <Grid className="h-4 w-4 mr-2" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3 data-[state=active]:bg-white">
                <List className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="hidden md:flex"
            aria-label={showFilters ? "Hide filters" : "Show filters"}
          >
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((filter) => {
            const [type, value] = filter.split(":")
            let label = value

            if (type === "region") {
              label = regions.find((r) => r.id === value)?.label || value
            } else if (type === "type") {
              label = placeTypes.find((t) => t.id === value)?.label || value
            } else if (type === "feature") {
              label = getFeatureLabel(value)
            }

            return (
              <Badge key={filter} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-[#F9F7F7]">
                {type === "region" ? "Region: " : type === "type" ? "Type: " : "Feature: "}
                {label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter)}
                  className="h-4 w-4 p-0 ml-1 rounded-full"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove filter</span>
                </Button>
              </Badge>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs text-[#3F72AF] hover:text-[#112D4E]"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Panel */}
        {showFilters && (
          <div className="hidden lg:block">
            <Card className="overflow-hidden border-none shadow-sm sticky top-20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg text-[#112D4E]">Filters</h2>
                  {activeFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 text-[#3F72AF] hover:text-[#112D4E] p-0"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <Accordion type="multiple" defaultValue={["region", "type", "features"]} className="space-y-4">
                  <AccordionItem value="region" className="border-b-0">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <span className="text-sm font-medium text-[#112D4E]">Region</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {regions.map((region) => (
                          <div key={region.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`region-${region.id}`}
                              checked={selectedRegions.includes(region.id)}
                              onCheckedChange={() => handleRegionChange(region.id)}
                              className="border-[#DBE2EF] data-[state=checked]:bg-[#3F72AF] data-[state=checked]:border-[#3F72AF]"
                            />
                            <label
                              htmlFor={`region-${region.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {region.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="type" className="border-b-0">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <span className="text-sm font-medium text-[#112D4E]">Place Type</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {placeTypes.map((type) => (
                          <div
                            key={type.id}
                            className={cn(
                              "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                              selectedType === type.id ? "bg-[#3F72AF] text-white" : "hover:bg-[#F9F7F7]",
                            )}
                            onClick={() => handleTypeChange(type.id)}
                          >
                            <span className={cn("mr-2", selectedType === type.id ? "text-white" : "text-[#3F72AF]")}>
                              {type.icon}
                            </span>
                            <span className="text-sm">{type.label}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {selectedType && (
                    <AccordionItem value="features" className="border-b-0">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <span className="text-sm font-medium text-[#112D4E]">Features</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {placeFeatures[selectedType as keyof typeof placeFeatures]?.map((feature) => (
                            <FeatureChip
                              key={feature.id}
                              label={feature.label}
                              selected={selectedFeatures.includes(feature.id)}
                              onClick={() => toggleFeature(feature.id)}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[#112D4E]">Community Picks</h3>
                  <div className="space-y-3">
                    {mockPlaces.slice(0, 3).map((place) => (
                      <Link
                        key={place.id}
                        href={`/places/${place.slug}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F9F7F7] transition-colors"
                      >
                        <div className="relative h-10 w-10 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={place.image || "/placeholder.svg"}
                            alt={place.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[#112D4E] truncate">{place.name}</h4>
                          <div className="flex items-center text-xs text-gray-500">
                            <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700] mr-1" />
                            <span>{place.rating}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Places Grid/List or Map View */}
        <div className="lg:col-span-3">
          {isMapView ? (
            <div className="bg-[#F9F7F7] h-[600px] rounded-xl flex items-center justify-center">
              <div className="text-center p-6">
                <MapIcon className="h-12 w-12 text-[#3F72AF] mx-auto mb-4" />
                <h3 className="text-xl font-medium text-[#112D4E] mb-2">Interactive Map Coming Soon</h3>
                <p className="text-[#3F72AF] mb-6 max-w-md mx-auto">
                  We&apos;re working on an interactive map to help you discover places more easily. Stay tuned!
                </p>
                <Button onClick={() => setIsMapView(false)} className="bg-[#3F72AF]">
                  View as List
                </Button>
              </div>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#F9F7F7] rounded-full mx-auto flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-[#3F72AF]" />
              </div>
              <h3 className="text-xl font-medium text-[#112D4E] mb-2">No places found</h3>
              <p className="text-[#3F72AF] mb-6">Try adjusting your filters or search query</p>
              <Button onClick={clearAllFilters} className="bg-[#3F72AF]">
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-[#112D4E]">
                  {filteredPlaces.length} {filteredPlaces.length === 1 ? "place" : "places"} found
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select className="text-sm border rounded-md px-2 py-1 border-[#DBE2EF]">
                    <option>Highest Rated</option>
                    <option>Most Recent</option>
                    <option>Most Popular</option>
                  </select>
                </div>
              </div>

              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}
              >
                {filteredPlaces.map((place) => (
                  <Link key={place.id} href={`/places/${place.slug}`} className="group">
                    {viewMode === "grid" ? (
                      <Card className="overflow-hidden border-none shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                        <CardContent className="p-0">
                          <div className="relative h-48">
                            <Image
                              src={place.image || "/placeholder.svg"}
                              alt={place.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-white/90 text-[#112D4E]">
                                {placeTypes.find((t) => t.id === place.type)?.label}
                              </Badge>
                            </div>
                            <div className="absolute bottom-3 right-3">
                              <Avatar className="border-2 border-white h-8 w-8">
                                <AvatarFallback className="bg-[#3F72AF] text-white text-xs">
                                  {typeof place.contributor === 'object' ? getUserInitials(place.contributor) : place.contributorInitials}
                                </AvatarFallback>
                              </Avatar>
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
                              {place.location} • {Array(place.priceLevel).fill("$").join("")}
                            </div>

                            {place.features && place.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {place.features.slice(0, 3).map((feature) => (
                                  <Badge key={feature} variant="outline" className="text-xs bg-[#F9F7F7] py-0">
                                    {getFeatureLabel(feature)}
                                  </Badge>
                                ))}
                                {place.features.length > 3 && (
                                  <Badge variant="outline" className="text-xs bg-[#F9F7F7] py-0">
                                    +{place.features.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{place.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                <span>{place.reviews} reviews</span>
                              </div>
                              <div className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                <span>{place.likes} likes</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="overflow-hidden border-none shadow-md transition-all duration-300 group-hover:shadow-lg">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0">
                              <Image
                                src={place.image || "/placeholder.svg"}
                                alt={place.name}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-white/90 text-[#112D4E]">
                                  {placeTypes.find((t) => t.id === place.type)?.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-4 flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-bold text-[#112D4E] group-hover:text-[#3F72AF] transition-colors">
                                    {place.name}
                                  </h3>
                                  <div className="flex items-center text-sm text-gray-500 mb-3">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {place.location} • {Array(place.priceLevel).fill("$").join("")}
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700] mr-1" />
                                  <span className="font-medium">{place.rating}</span>
                                </div>
                              </div>

                              {place.features && place.features.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {place.features.map((feature) => (
                                    <Badge key={feature} variant="outline" className="text-xs bg-[#F9F7F7] py-0">
                                      {getFeatureLabel(feature)}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <p className="text-sm text-gray-600 mb-4">{place.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-xs text-gray-500">
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  <span>{place.reviews} reviews</span>
                                  <span className="mx-2">•</span>
                                  <Heart className="h-3 w-3 mr-1" />
                                  <span>{place.likes} likes</span>
                                </div>
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-[#3F72AF] text-white text-xs">
                                    {typeof place.contributor === 'object' ? getUserInitials(place.contributor) : place.contributorInitials}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Community CTA */}
          {!isMapView && filteredPlaces.length > 0 && (
            <div className="mt-12 bg-gradient-to-r from-[#DBE2EF]/50 to-[#F9F7F7] rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#3F72AF] rounded-full p-3 text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#112D4E] mb-1">Know a hidden gem in Taipei?</h3>
                    <p className="text-[#3F72AF]">
                      Share your favorite spots with the community and help others discover the real Taipei.
                    </p>
                  </div>
                </div>
                <Button asChild className="bg-[#FFD700] hover:bg-[#F2C94C] text-[#112D4E] whitespace-nowrap">
                  <Link href="/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your Secret Spot
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Mobile Filters Component
function MobileFilters({
  regions,
  placeTypes,
  placeFeatures,
  selectedRegions,
  selectedType,
  selectedFeatures,
  handleRegionChange,
  handleTypeChange,
  toggleFeature,
}) {
  return (
    <Accordion type="multiple" defaultValue={["region", "type", "features"]} className="space-y-4">
      <AccordionItem value="region" className="border-b-0">
        <AccordionTrigger className="py-2 hover:no-underline">
          <span className="text-sm font-medium text-[#112D4E]">Region</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {regions.map((region) => (
              <div key={region.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`mobile-region-${region.id}`}
                  checked={selectedRegions.includes(region.id)}
                  onCheckedChange={() => handleRegionChange(region.id)}
                  className="border-[#DBE2EF] data-[state=checked]:bg-[#3F72AF] data-[state=checked]:border-[#3F72AF]"
                />
                <label
                  htmlFor={`mobile-region-${region.id}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {region.label}
                </label>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="type" className="border-b-0">
        <AccordionTrigger className="py-2 hover:no-underline">
          <span className="text-sm font-medium text-[#112D4E]">Place Type</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {placeTypes.map((type) => (
              <div
                key={type.id}
                className={cn(
                  "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                  selectedType === type.id ? "bg-[#3F72AF] text-white" : "hover:bg-[#F9F7F7]",
                )}
                onClick={() => handleTypeChange(type.id)}
              >
                <span className={cn("mr-2", selectedType === type.id ? "text-white" : "text-[#3F72AF]")}>
                  {type.icon}
                </span>
                <span className="text-sm">{type.label}</span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {selectedType && (
        <AccordionItem value="features" className="border-b-0">
          <AccordionTrigger className="py-2 hover:no-underline">
            <span className="text-sm font-medium text-[#112D4E]">Features</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 mt-2">
              {placeFeatures[selectedType]?.map((feature) => (
                <FeatureChip
                  key={feature.id}
                  label={feature.label}
                  selected={selectedFeatures.includes(feature.id)}
                  onClick={() => toggleFeature(feature.id)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  )
}
