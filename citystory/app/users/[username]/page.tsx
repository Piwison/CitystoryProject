import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin, MessageCircle, Calendar, Award, Settings, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import UserContributions from "@/components/user-contributions"
import UserReviews from "@/components/user-reviews"
import UserSavedPlaces from "@/components/user-saved-places"
import UserAchievements from "@/components/user-achievements"
import { getUserDisplayName, getUserInitials } from "@/lib/utils"

// Mock user data - in a real app, this would come from a database
const mockUsers = {
  "jane-smith": {
    id: "1",
    username: "jane-smith",
    name: "Jane Smith",
    avatarUrl: "/thoughtful-gaze.png",
    avatarInitials: "JS",
    bio: "Coffee enthusiast and explorer. I love discovering hidden cafés and sharing my finds with the community. Based in Taipei since 2015.",
    location: "Xinyi District, Taipei",
    memberSince: "2021-03-15",
    isVerified: true,
    guidePoints: 780,
    guideLevel: 3,
    nextLevelPoints: 1000,
    badges: [
      { id: "1", name: "Café Expert", icon: "coffee", level: 3 },
      { id: "2", name: "Top Contributor", icon: "award", level: 2 },
      { id: "3", name: "Photo Master", icon: "camera", level: 2 },
    ],
    contributions: [
      {
        id: "1",
        name: "Elephant Mountain Café",
        slug: "elephant-mountain-cafe",
        type: "Café",
        rating: 4.8,
        image: "/laptop-cafe-buzz.png",
        location: "Xinyi District",
        date: "2022-05-10",
      },
      {
        id: "2",
        name: "Songshan Cultural Park",
        slug: "songshan-cultural-park",
        type: "Attraction",
        rating: 4.5,
        image: "/laptop-cafe-buzz.png",
        location: "Xinyi District",
        date: "2022-02-18",
      },
      {
        id: "3",
        name: "Fujin Street",
        slug: "fujin-street",
        type: "Shopping",
        rating: 4.6,
        image: "/waterfront-elegance.png",
        location: "Songshan District",
        date: "2021-11-05",
      },
    ],
    reviews: [
      {
        id: "r1",
        placeId: "1",
        placeName: "Elephant Mountain Café",
        placeSlug: "elephant-mountain-cafe",
        placeImage: "/laptop-cafe-buzz.png",
        rating: 5,
        date: "2023-10-15",
        comment:
          "Absolutely love this place! The view of Taipei 101 is breathtaking, especially during sunset. Their pour-over coffee is exceptional, and the staff is always friendly. It's my go-to spot for working remotely.",
        helpful: 24,
      },
      {
        id: "r2",
        placeId: "2",
        placeName: "Din Tai Fung",
        placeSlug: "din-tai-fung",
        placeImage: "/waterfront-elegance.png",
        rating: 4.5,
        date: "2023-09-22",
        comment:
          "The xiaolongbao are perfect - thin skin and juicy filling. Service is impeccable despite how busy they always are. Worth the wait!",
        helpful: 18,
      },
      {
        id: "r3",
        placeId: "3",
        placeName: "Taipei Night Market",
        placeSlug: "taipei-night-market",
        placeImage: "/craft-beer-haven.png",
        rating: 4,
        date: "2023-11-05",
        comment:
          "Vibrant atmosphere and amazing street food. Can get crowded on weekends but that's part of the experience. Try the stinky tofu if you're brave!",
        helpful: 12,
      },
    ],
    savedPlaces: [
      {
        id: "1",
        name: "Elephant Mountain Café",
        slug: "elephant-mountain-cafe",
        type: "Café",
        rating: 4.8,
        image: "/laptop-cafe-buzz.png",
        location: "Xinyi District",
      },
      {
        id: "2",
        name: "Din Tai Fung",
        slug: "din-tai-fung",
        type: "Restaurant",
        rating: 4.9,
        image: "/waterfront-elegance.png",
        location: "Xinyi District",
      },
      {
        id: "4",
        name: "Beitou Hot Springs",
        slug: "beitou-hot-springs",
        type: "Attraction",
        rating: 4.7,
        image: "/craft-beer-haven.png",
        location: "Beitou District",
      },
    ],
  },
  "michael-chen": {
    id: "2",
    username: "michael-chen",
    name: "Michael Chen",
    avatarUrl: "/thoughtful-gaze.png",
    avatarInitials: "MC",
    bio: "Food enthusiast and local guide. I've been exploring Taipei's culinary scene for over a decade and love sharing authentic dining experiences.",
    location: "Da'an District, Taipei",
    memberSince: "2020-08-22",
    isVerified: true,
    guidePoints: 1250,
    guideLevel: 4,
    nextLevelPoints: 1500,
    badges: [
      { id: "1", name: "Food Critic", icon: "utensils", level: 3 },
      { id: "2", name: "Top Contributor", icon: "award", level: 3 },
      { id: "3", name: "Photo Master", icon: "camera", level: 2 },
    ],
    contributions: [
      {
        id: "1",
        name: "Din Tai Fung",
        slug: "din-tai-fung",
        type: "Restaurant",
        rating: 4.9,
        image: "/waterfront-elegance.png",
        location: "Xinyi District",
        date: "2022-04-15",
      },
      {
        id: "2",
        name: "Taipei Night Market",
        slug: "taipei-night-market",
        type: "Night Market",
        rating: 4.7,
        image: "/craft-beer-haven.png",
        location: "Shilin District",
        date: "2021-12-10",
      },
    ],
    reviews: [
      {
        id: "r1",
        placeId: "1",
        placeName: "Din Tai Fung",
        placeSlug: "din-tai-fung",
        placeImage: "/waterfront-elegance.png",
        rating: 5,
        date: "2023-04-15",
        comment:
          "The best xiaolongbao I've ever had! Worth the wait. The pork dumplings are perfect - thin skin and juicy filling. Service is impeccable despite how busy they always are.",
        helpful: 42,
      },
    ],
    savedPlaces: [
      {
        id: "1",
        name: "Elephant Mountain Café",
        slug: "elephant-mountain-cafe",
        type: "Café",
        rating: 4.8,
        image: "/laptop-cafe-buzz.png",
        location: "Xinyi District",
      },
    ],
  },
  admin: {
    id: "3",
    username: "admin",
    name: "Admin User",
    avatarUrl: "/thoughtful-gaze.png",
    avatarInitials: "AU",
    bio: "Administrator and community manager. I help maintain the platform and ensure everyone has a great experience sharing their favorite places in Taipei.",
    location: "Taipei City, Taiwan",
    memberSince: "2020-01-01",
    isVerified: true,
    guidePoints: 2500,
    guideLevel: 5,
    nextLevelPoints: 3000,
    badges: [
      { id: "1", name: "Admin", icon: "award", level: 3 },
      { id: "2", name: "City Expert", icon: "map", level: 3 },
      { id: "3", name: "Photo Master", icon: "camera", level: 3 },
    ],
    contributions: [
      {
        id: "1",
        name: "Taipei 101 Observatory",
        slug: "taipei-101-observatory",
        type: "Attraction",
        rating: 4.9,
        image: "/waterfront-elegance.png",
        location: "Xinyi District",
        date: "2022-06-15",
      },
      {
        id: "2",
        name: "Longshan Temple",
        slug: "longshan-temple",
        type: "Temple",
        rating: 4.8,
        image: "/craft-beer-haven.png",
        location: "Wanhua District",
        date: "2022-03-20",
      },
      {
        id: "3",
        name: "Shilin Night Market",
        slug: "shilin-night-market",
        type: "Night Market",
        rating: 4.7,
        image: "/laptop-cafe-buzz.png",
        location: "Shilin District",
        date: "2021-11-10",
      },
    ],
    reviews: [
      {
        id: "r1",
        placeId: "1",
        placeName: "Taipei 101 Observatory",
        placeSlug: "taipei-101-observatory",
        placeImage: "/waterfront-elegance.png",
        rating: 5,
        date: "2023-06-15",
        comment:
          "The view from the observatory is absolutely stunning, especially at sunset. You can see the entire city and beyond. The elevator ride is an experience in itself!",
        helpful: 35,
      },
      {
        id: "r2",
        placeId: "2",
        placeName: "Longshan Temple",
        placeSlug: "longshan-temple",
        placeImage: "/craft-beer-haven.png",
        rating: 5,
        date: "2023-03-20",
        comment:
          "A beautiful historic temple with incredible architecture. It's always bustling with locals and visitors. Don't miss the intricate carvings and the peaceful atmosphere despite being in the heart of the city.",
        helpful: 28,
      },
    ],
    savedPlaces: [
      {
        id: "1",
        name: "Elephant Mountain Café",
        slug: "elephant-mountain-cafe",
        type: "Café",
        rating: 4.8,
        image: "/laptop-cafe-buzz.png",
        location: "Xinyi District",
      },
      {
        id: "2",
        name: "Din Tai Fung",
        slug: "din-tai-fung",
        type: "Restaurant",
        rating: 4.9,
        image: "/waterfront-elegance.png",
        location: "Xinyi District",
      },
      {
        id: "3",
        name: "Taipei 101 Observatory",
        slug: "taipei-101-observatory",
        type: "Attraction",
        rating: 4.9,
        image: "/waterfront-elegance.png",
        location: "Xinyi District",
      },
    ],
  },
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  if (!params) {
    return {
      title: "User Not Found | Taipei Guide",
      description: "The user you're looking for doesn't exist or has been removed.",
    }
  }
  const user = mockUsers[params.username]
  if (!user) {
    return {
      title: "User Not Found | Taipei Guide",
      description: "The user you're looking for doesn't exist or has been removed.",
    }
  }
  return {
    title: `${user.name} | Taipei Guide`,
    description: user.bio,
  }
}

export default function UserProfilePage({ params }: any) {
  if (!params) {
    notFound()
  }
  const user = mockUsers[params.username]
  if (!user) {
    notFound()
  }

  const memberSinceDate = new Date(user.memberSince)
  const memberSinceFormatted = memberSinceDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  // Calculate progress percentage to next level
  const currentPoints = user.guidePoints
  const nextLevelPoints = user.nextLevelPoints
  const previousLevelPoints = nextLevelPoints - 500 // Assuming 500 points per level
  const progressPercentage = ((currentPoints - previousLevelPoints) / (nextLevelPoints - previousLevelPoints)) * 100

  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/" className="inline-flex items-center text-[#3F72AF] hover:text-[#112D4E] mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="relative h-48 bg-gradient-to-r from-[#3F72AF] to-[#112D4E]">
          <div className="absolute inset-0 opacity-20">
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
        </div>

        <div className="relative px-6 py-8 -mt-20">
          <div className="flex flex-col md:flex-row md:items-end">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={getUserDisplayName(user)} />
              ) : (
                <AvatarFallback className="bg-[#3F72AF] text-white text-4xl">{getUserInitials(user)}</AvatarFallback>
              )}
            </Avatar>
            <div className="mt-4 md:mt-0 md:ml-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-[#112D4E]">{getUserDisplayName(user)}</h1>
                    {user.isVerified && (
                      <Badge className="ml-2 bg-[#3F72AF]">
                        <Award className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2">
                  <Button className="bg-[#3F72AF]">Follow</Button>
                  <Button variant="outline" className="border-[#3F72AF] text-[#3F72AF]">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-gray-700">{user.bio}</p>
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Member since {memberSinceFormatted}</span>
            </div>
          </div>

          {/* Local Guide Rating Section */}
          <div className="mt-6 bg-[#F9F7F7] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-[#FFD700] mr-2" />
                <h3 className="font-medium text-[#112D4E]">Local Guide</h3>
              </div>
              <div className="flex items-center">
                <span className="text-lg font-bold text-[#3F72AF]">Level {user.guideLevel}</span>
                <div className="ml-2 flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < user.guideLevel ? "text-[#FFD700] fill-[#FFD700]" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{user.guidePoints} points</span>
                <span>
                  {user.nextLevelPoints} points for Level {user.guideLevel + 1}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-[#3F72AF]" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-md p-2 shadow-sm">
                <div className="text-lg font-semibold text-[#112D4E]">{user.contributions.length}</div>
                <div className="text-xs text-gray-500">Places Added</div>
              </div>
              <div className="bg-white rounded-md p-2 shadow-sm">
                <div className="text-lg font-semibold text-[#112D4E]">{user.reviews.length}</div>
                <div className="text-xs text-gray-500">Reviews</div>
              </div>
              <div className="bg-white rounded-md p-2 shadow-sm">
                <div className="text-lg font-semibold text-[#112D4E]">{user.savedPlaces.length}</div>
                <div className="text-xs text-gray-500">Saved Places</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {user.badges.map((badge) => (
              <Badge
                key={badge.id}
                variant="outline"
                className="bg-white border-[#DBE2EF] px-3 py-1 flex items-center gap-1"
              >
                {getBadgeIcon(badge.icon)}
                <span>
                  {badge.name} {Array(badge.level).fill("★").join("")}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <Tabs defaultValue="contributions" className="mb-8">
        <TabsList className="mb-6 bg-[#F9F7F7]">
          <TabsTrigger value="contributions" className="data-[state=active]:bg-white">
            Contributions
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-white">
            Reviews
          </TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-white">
            Saved Places
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-white">
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contributions">
          <UserContributions contributions={user.contributions} />
        </TabsContent>

        <TabsContent value="reviews">
          <UserReviews reviews={user.reviews} />
        </TabsContent>

        <TabsContent value="saved">
          <UserSavedPlaces savedPlaces={user.savedPlaces} />
        </TabsContent>

        <TabsContent value="achievements">
          <UserAchievements badges={user.badges} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getBadgeIcon(iconName: string) {
  switch (iconName) {
    case "coffee":
      return <Coffee className="h-3 w-3 mr-1" />
    case "award":
      return <Award className="h-3 w-3 mr-1" />
    case "camera":
      return <Camera className="h-3 w-3 mr-1" />
    case "utensils":
      return <Utensils className="h-3 w-3 mr-1" />
    case "map":
      return <Map className="h-3 w-3 mr-1" />
    default:
      return <Award className="h-3 w-3 mr-1" />
  }
}

// Import missing icons
import { Coffee, Camera, Utensils, Map } from "lucide-react"
