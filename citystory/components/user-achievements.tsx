import { Award, Coffee, Camera, Utensils, Trophy, Star, Medal, Target, Map, Landmark } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Badge {
  id: string
  name: string
  icon: string
  level: number
}

interface UserAchievementsProps {
  badges: Badge[]
}

export default function UserAchievements({ badges }: UserAchievementsProps) {
  // Define all possible badges with their descriptions and max levels
  const allBadges = [
    {
      id: "cafe-expert",
      name: "Café Expert",
      icon: "coffee",
      description: "Awarded for discovering and reviewing cafés around the city",
      maxLevel: 3,
      criteria: "Add and review 10/20/30 cafés",
    },
    {
      id: "food-critic",
      name: "Food Critic",
      icon: "utensils",
      description: "Awarded for detailed and helpful restaurant reviews",
      maxLevel: 3,
      criteria: "Write 15/30/50 restaurant reviews with high helpfulness ratings",
    },
    {
      id: "photo-master",
      name: "Photo Master",
      icon: "camera",
      description: "Awarded for contributing high-quality photos of places",
      maxLevel: 3,
      criteria: "Upload 20/50/100 photos that receive likes from the community",
    },
    {
      id: "top-contributor",
      name: "Top Contributor",
      icon: "award",
      description: "Awarded for overall contributions to the platform",
      maxLevel: 3,
      criteria: "Make 25/50/100 total contributions (places, reviews, photos)",
    },
    {
      id: "explorer",
      name: "Explorer",
      icon: "map",
      description: "Awarded for discovering places across different districts",
      maxLevel: 3,
      criteria: "Add places in 3/6/10 different districts",
    },
  ]

  // Get user's earned badges with their current levels
  const earnedBadges = allBadges.map((badge) => {
    const userBadge = badges.find((b) => b.name === badge.name)
    return {
      ...badge,
      level: userBadge?.level || 0,
      progress: userBadge ? (userBadge.level / badge.maxLevel) * 100 : 0,
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-medium text-[#112D4E] mb-4">Achievements</h2>
        <p className="text-[#3F72AF] mb-6">
          Badges are awarded for contributions and activities on the platform. Keep contributing to earn more badges and
          level them up!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {earnedBadges.map((badge) => (
          <Card key={badge.id} className="overflow-hidden border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    badge.level > 0 ? "bg-[#3F72AF]" : "bg-gray-200"
                  }`}
                >
                  {getBadgeIcon(badge.icon, badge.level > 0 ? "white" : "#9CA3AF")}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-[#112D4E]">{badge.name}</h3>
                    <div className="flex">
                      {Array.from({ length: badge.maxLevel }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < badge.level ? "fill-[#FFD700] text-[#FFD700]" : "fill-none text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        Level {badge.level}/{badge.maxLevel}
                      </span>
                      <span className="text-[#3F72AF] font-medium">{Math.round(badge.progress)}%</span>
                    </div>
                    <Progress value={badge.progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{badge.criteria}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-[#F9F7F7] rounded-xl p-6 mt-8">
        <div className="flex items-center mb-4">
          <Trophy className="h-6 w-6 text-[#FFD700] mr-3" />
          <h3 className="text-lg font-medium text-[#112D4E]">Upcoming Achievements</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <Medal className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <h4 className="font-medium text-[#112D4E]">Local Guide</h4>
              <p className="text-sm text-gray-500">Help 50 users with your recommendations</p>
            </div>
            <div className="ml-auto">
              <Target className="h-5 w-5 text-[#3F72AF]" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <Landmark className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <h4 className="font-medium text-[#112D4E]">Cultural Explorer</h4>
              <p className="text-sm text-gray-500">Add and review 10 cultural attractions</p>
            </div>
            <div className="ml-auto">
              <Target className="h-5 w-5 text-[#3F72AF]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getBadgeIcon(iconName: string, color = "white") {
  const className = `h-6 w-6 text-${color}`

  switch (iconName) {
    case "coffee":
      return <Coffee className={className} />
    case "award":
      return <Award className={className} />
    case "camera":
      return <Camera className={className} />
    case "utensils":
      return <Utensils className={className} />
    case "map":
      return <Map className={className} />
    default:
      return <Award className={className} />
  }
}
