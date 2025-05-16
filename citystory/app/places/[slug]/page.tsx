import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin, Clock, Share2, ThumbsUp, MessageCircle, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import StarRating from "@/components/star-rating"
import AddReviewForm from "@/components/add-review-form"
import PlaceMap from "@/components/place-map"
import ContributionPrompt from "@/components/contribution-prompt"
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { useSubmitReview, useToggleHelpfulReview } from '@/hooks/useReviews'
import { useState } from 'react'
import type { PlaceType } from '@/types';
import ReviewList from '@/components/reviews/ReviewList';

// In a real app, this would come from a database
const mockPlaces: Record<string, {
  id: string;
  name: string;
  slug: string;
  type: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  priceLevel: number;
  location: string;
  address: string;
  description: string;
  hours: string;
  googleMapsLink: string;
  photos: string[];
  reviews: Array<{
    id: string;
    author: string;
    authorInitials: string;
    date: string;
    rating: number;
    comment: string;
    foodQuality: number;
    service: number;
    value: number;
    cleanliness: number;
    helpful: number;
  }>;
  contributors: string[];
}> = {
  "elephant-mountain-cafe": {
    id: "1",
    name: "Elephant Mountain Café",
    slug: "elephant-mountain-cafe",
    type: "Café",
    tags: ["Coffee", "Brunch", "WiFi", "View"],
    rating: 4.8,
    reviewCount: 124,
    priceLevel: 2,
    location: "Xinyi District",
    address: "No. 15, Lane 150, Section 5, Xinyi Road, Xinyi District, Taipei City",
    description:
      "A cozy café with stunning views of Taipei 101, perfect for digital nomads. Offering specialty coffee, homemade pastries, and a relaxing atmosphere away from the city bustle.",
    hours: "Mon-Fri: 8:00-20:00, Sat-Sun: 9:00-21:00",
    googleMapsLink: "https://maps.google.com",
    photos: ["/laptop-cafe-buzz.png", "/waterfront-elegance.png", "/craft-beer-haven.png"],
    reviews: [
      {
        id: "r1",
        author: "Jane S.",
        authorInitials: "JS",
        date: "2023-10-15",
        rating: 5,
        comment:
          "Absolutely love this place! The view of Taipei 101 is breathtaking, especially during sunset. Their pour-over coffee is exceptional, and the staff is always friendly. It's my go-to spot for working remotely.",
        foodQuality: 5,
        service: 5,
        value: 4.5,
        cleanliness: 5,
        helpful: 24,
      },
      {
        id: "r2",
        author: "Michael C.",
        authorInitials: "MC",
        date: "2023-09-22",
        rating: 4.5,
        comment:
          "Great atmosphere and excellent coffee. The pastries are freshly baked and delicious. It can get a bit crowded on weekends, so come early if you want a seat by the window for the best view.",
        foodQuality: 4.5,
        service: 4,
        value: 4,
        cleanliness: 5,
        helpful: 18,
      },
      {
        id: "r3",
        author: "Lisa W.",
        authorInitials: "LW",
        date: "2023-11-05",
        rating: 4,
        comment:
          "Nice spot with good coffee and a stunning view. The avocado toast is a must-try! WiFi is reliable, making it perfect for remote work. Only downside is it can get noisy when full.",
        foodQuality: 4,
        service: 3.5,
        value: 4,
        cleanliness: 4.5,
        helpful: 12,
      },
    ],
    contributors: ["Jane S.", "Michael C.", "Lisa W.", "David L."],
  },
  "din-tai-fung": {
    id: "2",
    name: "Din Tai Fung",
    slug: "din-tai-fung",
    type: "Restaurant",
    tags: ["Dumplings", "Taiwanese", "Famous", "Family-friendly"],
    rating: 4.9,
    reviewCount: 356,
    priceLevel: 3,
    location: "Xinyi District",
    address: "No. 194, Section 2, Xinyi Road, Da'an District, Taipei City",
    description:
      "World-famous restaurant known for its exquisite soup dumplings and Taiwanese cuisine. A must-visit culinary destination in Taipei.",
    hours: "Daily: 10:00-21:30",
    googleMapsLink: "https://maps.google.com",
    photos: ["/waterfront-elegance.png", "/laptop-cafe-buzz.png"],
    reviews: [
      {
        id: "r1",
        author: "John D.",
        authorInitials: "JD",
        date: "2023-11-10",
        rating: 5,
        comment:
          "The best xiaolongbao I've ever had! Worth the wait. The pork dumplings are perfect - thin skin and juicy filling. Service is impeccable despite how busy they always are.",
        foodQuality: 5,
        service: 5,
        value: 4.5,
        cleanliness: 5,
        helpful: 42,
      },
    ],
    contributors: ["John D.", "Sarah J.", "Alex T."],
  },
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  if (!params) {
    return {
      title: "Place Not Found | Taipei Guide",
      description: "The place you're looking for doesn't exist or has been removed.",
    }
  }
  const place = mockPlaces[params.slug]
  if (!place) {
    return {
      title: "Place Not Found | Taipei Guide",
      description: "The place you're looking for doesn't exist or has been removed.",
    }
  }
  return {
    title: `${place.name} | Taipei Guide`,
    description: place.description,
  }
}

export default function PlaceDetailPage({ params }: any) {
  if (!params) {
    notFound()
  }
  const place = mockPlaces[params.slug]
  if (!place) {
    notFound()
  }
  const priceString = Array(place.priceLevel).fill("$").join("")

  // Review submission state
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const submitReview = useSubmitReview(place.id, {
    onSuccess: (review: any) => {
      setReviewSuccess('Review submitted! Thank you for your feedback.')
      setReviewError(null)
      // Optionally: update local reviews list here
    },
    onError: (error: any) => {
      setReviewError(error.message || 'Failed to submit review.')
      setReviewSuccess(null)
    },
  })

  // Helpful vote mutation
  const toggleHelpfulReview = useToggleHelpfulReview(place.id);

  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/explore" className="inline-flex items-center text-[#3F72AF] hover:text-[#112D4E] mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Explore
      </Link>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Place Info */}
        <div className="lg:col-span-2">
          {/* Place Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="relative h-48 w-full md:w-48 md:h-48 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={place.photos[0] || "/placeholder.svg"}
                alt={place.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-[#3F72AF] text-white">{place.type}</Badge>
                {place.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="border-[#DBE2EF] text-[#112D4E]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold text-[#112D4E] mb-2">{place.name}</h1>
              <div className="flex items-center mb-3">
                <StarRating value={place.rating} readOnly size="sm" onChange={() => {}} />
                <span className="ml-2 text-sm text-gray-600">
                  {place.rating} ({place.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1 text-[#3F72AF]" />
                {place.location} • {priceString}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1 text-[#3F72AF]" />
                {place.hours}
              </div>
            </div>
          </div>

          {/* Community Contribution Banner */}
          <Card className="mb-8 bg-gradient-to-r from-[#DBE2EF]/50 to-[#F9F7F7] border-none">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="flex -space-x-2 mr-3">
                    {place.contributors.slice(0, 3).map((contributor, i) => (
                      <Avatar key={i} className="border-2 border-white h-8 w-8">
                        <AvatarFallback className="bg-[#3F72AF] text-white text-xs">
                          {contributor
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {place.contributors.length > 3 && (
                      <Avatar className="border-2 border-white h-8 w-8">
                        <AvatarFallback className="bg-[#112D4E] text-white text-xs">
                          +{place.contributors.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="text-[#112D4E] font-medium">Community-contributed place</p>
                    <p className="text-gray-600">{place.contributors.length} people have contributed to this place</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-[#3F72AF]">
                    <Heart className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="text-[#3F72AF]">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="about" className="mb-8">
            <TabsList className="mb-4 bg-[#F9F7F7]">
              <TabsTrigger value="about" className="data-[state=active]:bg-white">
                About
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-white">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-white">
                Photos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-medium text-[#112D4E] mb-3">About</h2>
                  <p className="text-gray-700">{place.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-[#F9F7F7] border-none">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-[#112D4E] flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-[#3F72AF]" /> Location
                      </h3>
                      <p className="text-sm text-gray-700">{place.address}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#F9F7F7] border-none">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-[#112D4E] flex items-center mb-2">
                        <Clock className="h-4 w-4 mr-2 text-[#3F72AF]" /> Opening Hours
                      </h3>
                      <p className="text-sm text-gray-700">{place.hours}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="h-[250px] rounded-lg overflow-hidden">
                  <PlaceMap address={place.address} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium text-[#112D4E]">Reviews</h2>
                  <Button asChild className="bg-[#3F72AF]">
                    <a href="#write-review">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Write a Review
                    </a>
                  </Button>
                </div>

                <div id="write-review" className="mb-8">
                  {reviewSuccess && (
                    <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{reviewSuccess}</div>
                  )}
                  {reviewError && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{reviewError}</div>
                  )}
                  <ReviewForm
                    placeType={place.type.toLowerCase() as PlaceType}
                    placeId={place.id}
                    placeTitle={place.name}
                    onSubmit={async (data) => {
                      setReviewSuccess(null)
                      setReviewError(null)
                      await submitReview.mutateAsync(data)
                    }}
                  />
                </div>

                {/* Review List with helpful vote API */}
                <ReviewList
                  reviews={place.reviews.map(r => ({
                    id: r.id,
                    placeId: place.id,
                    userId: '', // Fill with actual userId if available
                    authorName: r.author,
                    authorAvatar: undefined,
                    authorLevel: undefined,
                    overallRating: r.rating,
                    foodQuality: r.foodQuality,
                    service: r.service,
                    value: r.value,
                    atmosphere: undefined,
                    cleanliness: r.cleanliness,
                    comfort: undefined,
                    variety: undefined,
                    comment: r.comment,
                    visitDate: undefined,
                    createdAt: r.date,
                    helpfulCount: r.helpful,
                    userHasMarkedHelpful: false, // Fill with actual state if available
                  }))}
                  placeType={place.type.toLowerCase() as PlaceType}
                  onHelpfulToggle={async (reviewId, isHelpful) => {
                    await toggleHelpfulReview.mutateAsync({ reviewId, isHelpful });
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="bg-[#F9F7F7] border-none">
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl font-bold text-[#112D4E] mb-2">{place.rating}</div>
                      <StarRating value={place.rating} readOnly size="md" onChange={() => {}} />
                      <p className="text-sm text-gray-600 mt-2">{place.reviewCount} reviews</p>
                    </CardContent>
                  </Card>

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-gray-600">Food Quality</span>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">
                              {(
                                place.reviews.reduce((sum, review) => sum + review.foodQuality, 0) /
                                place.reviews.length
                              ).toFixed(1)}
                            </span>
                            <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700]" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-gray-600">Service</span>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">
                              {(
                                place.reviews.reduce((sum, review) => sum + review.service, 0) / place.reviews.length
                              ).toFixed(1)}
                            </span>
                            <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700]" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-gray-600">Value</span>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">
                              {(
                                place.reviews.reduce((sum, review) => sum + review.value, 0) / place.reviews.length
                              ).toFixed(1)}
                            </span>
                            <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700]" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-gray-600">Cleanliness</span>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">
                              {(
                                place.reviews.reduce((sum, review) => sum + review.cleanliness, 0) /
                                place.reviews.length
                              ).toFixed(1)}
                            </span>
                            <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {place.reviews.map((review) => (
                    <Card key={review.id} className="overflow-hidden border-none shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[#3F72AF] text-white">{review.authorInitials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-[#112D4E]">{review.author}</h4>
                                <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                              </div>
                              <StarRating value={review.rating} readOnly size="sm" onChange={() => {}} />
                            </div>
                            <p className="text-gray-700 my-3">{review.comment}</p>
                            <div className="flex justify-between items-center">
                              <div className="flex gap-3 text-xs text-gray-500">
                                <span>Food: {review.foodQuality}</span>
                                <span>Service: {review.service}</span>
                                <span>Value: {review.value}</span>
                                <span>Cleanliness: {review.cleanliness}</span>
                              </div>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#3F72AF]">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Helpful ({review.helpful})
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium text-[#112D4E]">Photos</h2>
                  <Button variant="outline" size="sm" className="text-[#3F72AF]">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photos
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {place.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={photo || "/placeholder.svg"}
                        alt={`${place.name} - Photo ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                  <div className="relative aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-[#F9F7F7] border-2 border-dashed border-[#DBE2EF]">
                    <div className="text-center p-4">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-[#3F72AF]" />
                      <p className="text-sm text-[#3F72AF]">Add your photos</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Write a Review Section */}
          <div id="write-review" className="pt-6 mt-6 border-t">
            <h2 className="text-xl font-medium text-[#112D4E] mb-6">Share Your Experience</h2>
            <AddReviewForm placeId={place.id} placeName={place.name} />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Contribution Prompt */}
          <ContributionPrompt />

          {/* Similar Places */}
          <Card className="overflow-hidden border-none shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-medium text-[#112D4E] mb-3">Similar Places</h3>
              <div className="space-y-3">
                {Object.values(mockPlaces)
                  .filter((p) => p.id !== place.id)
                  .slice(0, 3)
                  .map((similarPlace) => (
                    <Link
                      key={similarPlace.id}
                      href={`/places/${similarPlace.slug}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9F7F7] transition-colors"
                    >
                      <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={similarPlace.photos[0] || "/placeholder.svg"}
                          alt={similarPlace.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-[#112D4E] line-clamp-1">{similarPlace.name}</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700] mr-1" />
                          <span>{similarPlace.rating}</span>
                          <span className="mx-1">•</span>
                          <span>{similarPlace.type}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="overflow-hidden border-none shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-medium text-[#112D4E] mb-3">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {place.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-[#F9F7F7] hover:bg-[#DBE2EF] transition-colors">
                    {tag}
                  </Badge>
                ))}
                <Badge variant="outline" className="bg-[#F9F7F7] hover:bg-[#DBE2EF] transition-colors">
                  Cozy
                </Badge>
                <Badge variant="outline" className="bg-[#F9F7F7] hover:bg-[#DBE2EF] transition-colors">
                  Quiet
                </Badge>
                <Badge variant="outline" className="bg-[#F9F7F7] hover:bg-[#DBE2EF] transition-colors">
                  Laptop-friendly
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Import missing icons
import { Camera } from "lucide-react"
