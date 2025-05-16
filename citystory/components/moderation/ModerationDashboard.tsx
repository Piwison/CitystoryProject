"use client"

import { useState, useEffect } from "react"
import { useAuth } from '@/context/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, AlertCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ModerationService } from "@/lib/api/services"
import { Place, Review, User } from "@/types/moderation"

interface ContentItem {
  id: string
  type: "place" | "review" | "photo"
  content: Place | Review
  status: "pending" | "approved" | "rejected"
  createdAt: string
  moderatedAt?: string
  moderator?: string
}

export default function ModerationDashboard() {
  const { user } = useAuth() as { user: User | null }
  const [activeTab, setActiveTab] = useState("places")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [content, setContent] = useState<ContentItem[]>([])
  const moderationService = ModerationService.getInstance()

  useEffect(() => {
    loadContent()
  }, [activeTab, statusFilter])

  const loadContent = async () => {
    setIsLoading(true)
    try {
      let items: ContentItem[] = []
      
      if (activeTab === "places") {
        const places = await moderationService.getPendingPlaces()
        items = places.map((place: Place) => ({
          id: place.id,
          type: "place",
          content: place,
          status: place.moderation_status,
          createdAt: place.created_at,
          moderatedAt: place.moderated_at,
          moderator: place.moderator_id
        }))
      } else if (activeTab === "reviews") {
        const reviews = await moderationService.getPendingReviews()
        items = reviews.map((review: Review) => ({
          id: review.id,
          type: "review",
          content: review,
          status: review.moderation_status,
          createdAt: review.created_at,
          moderatedAt: review.moderated_at,
          moderator: review.moderator_id
        }))
      }

      setContent(items)
    } catch (error) {
      console.error("Error loading content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (itemId: string, newStatus: "approved" | "rejected", comment?: string) => {
    try {
      if (activeTab === "places") {
        await moderationService.updatePlaceStatus(itemId, {
          status: newStatus,
          comment: comment || ""
        })
      } else if (activeTab === "reviews") {
        await moderationService.updateReviewStatus(itemId, {
          status: newStatus,
          comment: comment || ""
        })
      }
      
      // Refresh content after update
      loadContent()
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const filteredContent = content.filter(item => {
    const searchLower = searchQuery.toLowerCase()
    if (item.type === "place") {
      const place = item.content as Place
      return place.name.toLowerCase().includes(searchLower) ||
             place.description.toLowerCase().includes(searchLower)
    } else if (item.type === "review") {
      const review = item.content as Review
      return review.comment.toLowerCase().includes(searchLower)
    }
    return true
  })

  const renderContentItem = (item: ContentItem) => {
    if (item.type === "place") {
      const place = item.content as Place
      return (
        <Card key={item.id} className="mb-4">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-[#112D4E]">{place.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{place.location}</p>
              </div>
              <Badge
                variant={item.status === "pending" ? "outline" : item.status === "approved" ? "default" : "destructive"}
                className="ml-2"
              >
                {item.status}
              </Badge>
            </div>
            <p className="text-gray-700 mt-4">{place.description}</p>
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Submitted: {new Date(item.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, "rejected", "Content does not meet guidelines")}
                  className="text-red-600 hover:text-red-700"
                  disabled={item.status !== "pending"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, "approved")}
                  className="text-green-600 hover:text-green-700"
                  disabled={item.status !== "pending"}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    } else if (item.type === "review") {
      const review = item.content as Review
      return (
        <Card key={item.id} className="mb-4">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-[#112D4E]">Review for {review.place_name}</h3>
                <p className="text-sm text-gray-500 mt-1">by {review.user_name}</p>
              </div>
              <Badge
                variant={item.status === "pending" ? "outline" : item.status === "approved" ? "default" : "destructive"}
                className="ml-2"
              >
                {item.status}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-gray-700">{review.comment}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>Food: {review.food_quality}/5</span>
                <span>Service: {review.service}/5</span>
                <span>Value: {review.value}/5</span>
                <span>Cleanliness: {review.cleanliness}/5</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Submitted: {new Date(item.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, "rejected", "Review does not meet guidelines")}
                  className="text-red-600 hover:text-red-700"
                  disabled={item.status !== "pending"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, "approved")}
                  className="text-green-600 hover:text-green-700"
                  disabled={item.status !== "pending"}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
    return null
  }

  if (!user?.is_moderator) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Access Restricted</h3>
          <p className="text-yellow-700">
            You need moderator privileges to access this section. Please contact an administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#112D4E]">Content Moderation</h2>
        <Button onClick={loadContent} variant="outline" className="text-[#3F72AF]">
          Refresh
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="places" className="flex-1">Places</TabsTrigger>
          <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="places" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#3F72AF]" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="text-gray-500">No places need moderation at this time.</p>
            </div>
          ) : (
            <div>{filteredContent.map(renderContentItem)}</div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#3F72AF]" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="text-gray-500">No reviews need moderation at this time.</p>
            </div>
          ) : (
            <div>{filteredContent.map(renderContentItem)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 