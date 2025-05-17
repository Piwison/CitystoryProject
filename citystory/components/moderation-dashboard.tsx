"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { ModerationService } from "@/lib/api/services/ModerationService"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ModerationItem {
  id: string
  type: 'place' | 'review' | 'photo'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  comment?: string
  created_at: string
  updated_at: string
  moderator_id?: string
  moderator_comment?: string
  moderated_at?: string
}

export default function ModerationDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const moderationService = ModerationService.getInstance()

  const [activeTab, setActiveTab] = useState<string>("PENDING")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [items, setItems] = useState<ModerationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [moderationComment, setModerationComment] = useState("")
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)

  useEffect(() => {
    if (user?.isModerator) {
      loadItems()
    }
  }, [activeTab, selectedType])

  const loadItems = async () => {
    setIsLoading(true)
    try {
      let response
      if (activeTab === "PENDING") {
        response = await moderationService.getPendingItems({
          type: selectedType !== "all" ? selectedType as 'place' | 'review' | 'photo' : undefined
        })
      } else {
        response = await moderationService.getModeratedItems({
          type: selectedType !== "all" ? selectedType as 'place' | 'review' | 'photo' : undefined,
          status: activeTab as 'approved' | 'rejected'
        })
      }
      setItems(
        response.data.items.map((item: any) => ({
          ...item,
          status: item.status.toUpperCase(),
        }))
      )
    } catch (error) {
      console.error("Error loading moderation items:", error)
      toast({
        title: "Error loading items",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleModerate = async (item: ModerationItem, status: 'APPROVED' | 'REJECTED') => {
    try {
      await moderationService.updateStatus(
        item.type,
        item.id,
        status.toLowerCase() as "approved" | "rejected",
        moderationComment
      )
      
      toast({
        title: `Content ${status}`,
        description: `The ${item.type} has been ${status}.`,
        variant: status === 'APPROVED' ? 'default' : 'destructive'
      })

      // Refresh the list
      loadItems()
      setModerationComment("")
      setSelectedItem(null)
    } catch (error) {
      console.error("Error moderating content:", error)
      toast({
        title: "Error moderating content",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  if (!user?.isModerator) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You do not have moderator privileges.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation Dashboard</CardTitle>
          <CardDescription>Review and moderate user-submitted content</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex gap-4 items-center">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="place">Places</SelectItem>
            <SelectItem value="review">Reviews</SelectItem>
            <SelectItem value="photo">Photos</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={loadItems}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="PENDING" className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Submission
                    </h4>
                    <p className="text-sm text-gray-500">
                      Submitted on {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700">{item.comment}</p>
                </div>

                {selectedItem?.id === item.id && (
                  <div className="space-y-4 mb-4">
                    <Textarea
                      placeholder="Add a moderation comment..."
                      value={moderationComment}
                      onChange={(e) => setModerationComment(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {selectedItem?.id !== item.id ? (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedItem(item)}
                    >
                      Review
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleModerate(item, 'REJECTED')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleModerate(item, 'APPROVED')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending items</h3>
                <p className="text-gray-500">All content has been moderated!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="APPROVED" className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Submission
                    </h4>
                    <p className="text-sm text-gray-500">
                      Approved on {new Date(item.moderated_at || "").toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Approved
                  </Badge>
                </div>
                <p className="text-gray-700 mb-4">{item.comment}</p>
                {item.moderator_comment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Moderator Comment:</p>
                    <p className="text-gray-700">{item.moderator_comment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No approved items</h3>
                <p className="text-gray-500">No content has been approved yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="REJECTED" className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Submission
                    </h4>
                    <p className="text-sm text-gray-500">
                      Rejected on {new Date(item.moderated_at || "").toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="destructive">Rejected</Badge>
                </div>
                <p className="text-gray-700 mb-4">{item.comment}</p>
                {item.moderator_comment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Moderator Comment:</p>
                    <p className="text-gray-700">{item.moderator_comment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected items</h3>
                <p className="text-gray-500">No content has been rejected yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 