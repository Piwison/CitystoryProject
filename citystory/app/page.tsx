import Link from "next/link"
import Image from "next/image"
import { Search, ArrowRight, MapPin, Star, Heart, MessageCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  // This would normally come from your data layer
  const places = [] // Empty array to simulate no data

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full min-h-[600px] overflow-hidden bg-gradient-to-b from-[#F9F7F7] to-[#DBE2EF]">
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full opacity-10" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="doodlePattern"
                patternUnits="userSpaceOnUse"
                width="100"
                height="100"
                patternTransform="rotate(45)"
              >
                <circle cx="50" cy="50" r="2" fill="#3F72AF" />
                <circle cx="25" cy="25" r="1" fill="#3F72AF" />
                <circle cx="75" cy="75" r="1" fill="#3F72AF" />
                <circle cx="25" cy="75" r="1" fill="#3F72AF" />
                <circle cx="75" cy="25" r="1" fill="#3F72AF" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#doodlePattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge className="mb-4 bg-[#3F72AF] text-white px-4 py-1 text-sm">Community-Powered Guide</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#112D4E] mb-6 leading-tight">
              Discover Taipei&apos;s Hidden Gems Through Local Eyes
            </h1>
            <p className="text-xl text-[#3F72AF] mb-8">
              A city guide created by locals, for explorers. Find authentic experiences and share your own discoveries.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-[#FFD700] hover:bg-[#F2C94C] text-[#112D4E] text-lg font-medium">
                <Link href="/explore">
                  <Search className="mr-2 h-5 w-5" /> Explore Places
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#3F72AF] text-[#3F72AF] hover:bg-[#DBE2EF] hover:text-[#112D4E] text-lg"
              >
                <Link href="/add">
                  <MapPin className="mr-2 h-5 w-5" /> Add a Place
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center animate-bounce">
              <Star className="h-6 w-6 text-[#112D4E]" />
            </div>

            <Card className="overflow-hidden border-none shadow-lg">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-8 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-[#112D4E] mb-4">Be the First to Share Your Favorite Spots</h2>
                    <p className="text-[#3F72AF] mb-6">
                      Help others discover the best of Taipei by sharing your favorite places, hidden gems, and local secrets.
                    </p>
                    <Button asChild className="self-start bg-[#3F72AF]">
                      <Link href="/add">
                        <Plus className="mr-2 h-4 w-4" /> Add Your First Place
                      </Link>
                    </Button>
                  </div>
                  <div className="relative h-64 md:h-auto">
                    <Image
                      src="/images/profile-user-svgrepo-com.svg"
                      alt="Thoughtful person looking out window"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Highlights Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#F9F7F7] text-[#3F72AF] px-4 py-1 text-sm">Community Highlights</Badge>
            <h2 className="text-3xl font-bold text-[#112D4E] mb-4">Start Building Our Community Guide</h2>
            <p className="text-[#3F72AF] max-w-2xl mx-auto">
              Be among the first to contribute to our growing collection of Taipei&apos;s best spots.
            </p>
          </div>

          <Tabs defaultValue="trending" className="mb-12">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-[#F9F7F7]">
                <TabsTrigger value="trending" className="data-[state=active]:bg-white">
                  Getting Started
                </TabsTrigger>
                <TabsTrigger value="new" className="data-[state=active]:bg-white">
                  How It Works
                </TabsTrigger>
                <TabsTrigger value="top-rated" className="data-[state=active]:bg-white">
                  Guidelines
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="trending">
              <div className="max-w-2xl mx-auto text-center">
                <div className="mb-8">
                  <Image
                    src="/images/profile-user-svgrepo-com.svg"
                    alt="Taipei Map"
                    width={400}
                    height={400}
                    className="rounded-lg mx-auto mb-6"
                  />
                  <h3 className="text-xl font-bold text-[#112D4E] mb-3">Share Your Taipei Stories</h3>
                  <p className="text-[#3F72AF]">
                    Help us build the most authentic guide to Taipei by sharing your favorite places. Whether it&apos;s a cozy café,
                    a hidden viewpoint, or the best street food spot - your knowledge is valuable!
                  </p>
                </div>
                <Button asChild size="lg" className="bg-[#3F72AF]">
                  <Link href="/add">
                    <Plus className="mr-2 h-5 w-5" /> Add Your First Place
                  </Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="new">
              <div className="max-w-2xl mx-auto">
                <div className="grid gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#3F72AF] flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#112D4E] mb-2">Create an Account</h3>
                      <p className="text-[#3F72AF]">Sign up to become a contributor and share your local knowledge.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#3F72AF] flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#112D4E] mb-2">Add Your Places</h3>
                      <p className="text-[#3F72AF]">Share details about your favorite spots in Taipei.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#3F72AF] flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#112D4E] mb-2">Help Others Explore</h3>
                      <p className="text-[#3F72AF]">Your contributions will help visitors discover the real Taipei.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="top-rated">
              <div className="max-w-2xl mx-auto">
                <div className="grid gap-6">
                  <div className="p-6 bg-[#F9F7F7] rounded-lg">
                    <h3 className="text-lg font-bold text-[#112D4E] mb-2">Quality Over Quantity</h3>
                    <p className="text-[#3F72AF]">Share detailed, honest reviews and high-quality photos of places you&apos;ve personally visited.</p>
                  </div>
                  <div className="p-6 bg-[#F9F7F7] rounded-lg">
                    <h3 className="text-lg font-bold text-[#112D4E] mb-2">Be Specific</h3>
                    <p className="text-[#3F72AF]">Include helpful details like best times to visit, insider tips, and what makes the place special.</p>
                  </div>
                  <div className="p-6 bg-[#F9F7F7] rounded-lg">
                    <h3 className="text-lg font-bold text-[#112D4E] mb-2">Stay Authentic</h3>
                    <p className="text-[#3F72AF]">Focus on genuine experiences and personal recommendations rather than promotional content.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
