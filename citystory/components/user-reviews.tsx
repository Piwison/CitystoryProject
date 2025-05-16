import Link from "next/link"
import Image from "next/image"
import { Star, ThumbsUp, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Review {
  id: string
  placeId: string
  placeName: string
  placeSlug: string
  placeImage: string
  rating: number
  date: string
  comment: string
  helpful: number
}

interface UserReviewsProps {
  reviews: Review[]
}

export default function UserReviews({ reviews }: UserReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#F9F7F7] rounded-full mx-auto flex items-center justify-center mb-4">
          <Star className="h-8 w-8 text-[#3F72AF]" />
        </div>
        <h3 className="text-xl font-medium text-[#112D4E] mb-2">No reviews yet</h3>
        <p className="text-[#3F72AF] mb-6">This user hasn&apos;t written any reviews yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-[#112D4E] mb-4">Reviews</h2>
      {reviews.map((review) => (
        <Card key={review.id} className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <Link
                href={`/places/${review.placeSlug}`}
                className="relative h-48 md:h-auto md:w-48 flex-shrink-0 group"
              >
                <Image
                  src={review.placeImage || "/placeholder.svg"}
                  alt={review.placeName}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium">View Place</span>
                </div>
              </Link>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <Link href={`/places/${review.placeSlug}`} className="hover:text-[#3F72AF] transition-colors">
                    <h3 className="font-bold text-[#112D4E] text-lg">{review.placeName}</h3>
                  </Link>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-[#FFD700] text-[#FFD700] mr-1" />
                    <span className="font-medium">{review.rating}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{new Date(review.date).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 mb-4">{review.comment}</p>
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#3F72AF]">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Helpful ({review.helpful})
                  </Button>
                  <Link
                    href={`/places/${review.placeSlug}`}
                    className="text-[#3F72AF] text-sm font-medium hover:underline"
                  >
                    View Place
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
