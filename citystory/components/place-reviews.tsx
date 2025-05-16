"use client"

import { useState, useEffect } from "react"
import { Star, ThumbsUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import StarRating from "@/components/star-rating"
import { ReviewService } from "@/lib/api/services"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/context/AuthContext'

interface Review {
  id: string
  author: string
  date: string
  rating: number
  comment: string
  foodQuality: number
  service: number
  value: number
  cleanliness: number
  helpful: number
  moderation_status: string
  user_id: string
}

interface PlaceReviewsProps {
  placeId: string
  initialReviews?: Review[]
  initialRating?: number
}

export default function PlaceReviews({ placeId, initialReviews = [], initialRating = 0 }: PlaceReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [rating, setRating] = useState(initialRating)
  const [helpfulReviews, setHelpfulReviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const reviewService = ReviewService.getInstance()

  useEffect(() => {
    loadReviews()
  }, [placeId])

  const loadReviews = async () => {
    setIsLoading(true)
    try {
      const response = await reviewService.getPlaceReviews(placeId)
      setReviews(response.reviews)
      // Calculate average rating from reviews
      const avgRating = response.reviews.reduce((sum, review) => sum + review.rating, 0) / response.reviews.length
      setRating(avgRating || 0)
    } catch (error) {
      console.error("Error loading reviews:", error)
      toast({
        title: "Error loading reviews",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markHelpful = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to mark reviews as helpful.",
        variant: "default"
      })
      return
    }

    if (!helpfulReviews.includes(reviewId)) {
      try {
        await reviewService.markHelpful(placeId, reviewId)
        setHelpfulReviews([...helpfulReviews, reviewId])
        // Update the helpful count in the reviews list
        setReviews(reviews.map(review => 
          review.id === reviewId 
            ? { ...review, helpful: review.helpful + 1 }
            : review
        ))
      } catch (error) {
        console.error("Error marking review as helpful:", error)
        toast({
          title: "Error",
          description: "Could not mark review as helpful. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  // Filter out non-approved reviews for non-owners
  const visibleReviews = reviews.filter(review => 
    review.moderation_status === 'approved' || 
    (user && (user.id === review.user_id || user.is_moderator))
  )

  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0]
  visibleReviews.forEach((review) => {
    const ratingIndex = Math.floor(review.rating) - 1
    if (ratingIndex >= 0 && ratingIndex < 5) {
      ratingCounts[ratingIndex]++
    }
  })

  const totalReviews = visibleReviews.length
  const ratingPercentages = ratingCounts.map((count) => (totalReviews > 0 ? (count / totalReviews) * 100 : 0))

  if (isLoading) {
    return <div>Loading reviews...</div>
  }

  return (
    <div>
      {/* Rating summary section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-medium text-[#112D4E] mb-4">Overall Rating</h3>
          <div className="flex items-center mb-6">
            <div className="text-5xl font-bold text-[#112D4E] mr-4">{rating.toFixed(1)}</div>
            <div>
              <StarRating value={rating} readOnly size="md" />
              <p className="text-sm text-gray-500 mt-1">{totalReviews} reviews</p>
            </div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center">
                <div className="w-12 text-sm text-gray-600">{star} stars</div>
                <div className="flex-1 mx-3">
                  <Progress value={ratingPercentages[star - 1]} className="h-2" />
                </div>
                <div className="w-10 text-sm text-gray-600 text-right">
                  {ratingCounts[star - 1]} ({Math.round(ratingPercentages[star - 1])}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating breakdown section */}
        <div>
          <h3 className="text-lg font-medium text-[#112D4E] mb-4">Rating Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Food Quality", key: "foodQuality" },
              { label: "Service", key: "service" },
              { label: "Value", key: "value" },
              { label: "Cleanliness", key: "cleanliness" }
            ].map(({ label, key }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="flex items-center">
                  <span className="mr-2 font-medium">
                    {(visibleReviews.reduce((sum, review) => sum + review[key], 0) / visibleReviews.length).toFixed(1)}
                  </span>
                  <Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews list section */}
      <h3 className="text-lg font-medium text-[#112D4E] mb-4">Reviews</h3>
      <div className="space-y-6">
        {visibleReviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium">{review.author}</h4>
                  <p className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {review.moderation_status !== 'approved' && (
                    <Badge variant={review.moderation_status === 'pending' ? 'outline' : 'destructive'}>
                      {review.moderation_status}
                    </Badge>
                  )}
                  <StarRating value={review.rating} readOnly size="sm" />
                </div>
              </div>
              <p className="text-gray-700 mb-4">{review.comment}</p>
              
              {/* Rating details */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                <div>Food Quality: {review.foodQuality}/5</div>
                <div>Service: {review.service}/5</div>
                <div>Value: {review.value}/5</div>
                <div>Cleanliness: {review.cleanliness}/5</div>
              </div>

              {/* Helpful button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markHelpful(review.id)}
                  disabled={helpfulReviews.includes(review.id)}
                  className={helpfulReviews.includes(review.id) ? 'text-green-600' : ''}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Helpful ({review.helpful})
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {visibleReviews.length === 0 && (
          <Card className="bg-gray-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-500">Be the first to review this place!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
