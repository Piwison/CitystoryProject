"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import StarRating from "@/components/star-rating"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Coffee, Utensils, Sparkles, LogIn, UserPlus } from "lucide-react"
import { useAuth } from '@/context/AuthContext'
import LoginModal from "@/components/login-modal"
import RegisterModal from "@/components/register-modal"
import { ReviewService } from '@/lib/api/services'
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  foodQuality: z.number().min(0.5, {
    message: "Please rate the food quality.",
  }),
  service: z.number().min(0.5, {
    message: "Please rate the service.",
  }),
  value: z.number().min(0.5, {
    message: "Please rate the value for money.",
  }),
  cleanliness: z.number().min(0.5, {
    message: "Please rate the cleanliness.",
  }),
  comment: z.string().min(10, {
    message: "Comment must be at least 10 characters.",
  }),
})

interface AddReviewFormProps {
  placeId: string
  placeName: string
}

export default function AddReviewForm({ placeId, placeName }: AddReviewFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isHovering, setIsHovering] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      foodQuality: 0,
      service: 0,
      value: 0,
      cleanliness: 0,
      comment: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const reviewService = ReviewService.getInstance()

    try {
      await reviewService.createReview(placeId, {
        food_quality: values.foodQuality,
        service: values.service,
        value: values.value,
        cleanliness: values.cleanliness,
        comment: values.comment
      })

      // Show success message
      setIsSubmitted(true)
      toast({
        title: "Review submitted successfully",
        description: "Your review is pending moderation and will be visible once approved.",
        variant: "default"
      })
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error submitting review",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return (
      <>
        <Card className="bg-[#F9F7F7] border-none">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-[#112D4E] mb-4">Sign in to share your experience</h3>
            <p className="text-[#3F72AF] mb-6">
              Join our community to share your thoughts about {placeName} and help others discover great places in
              Taipei.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button onClick={() => setShowLoginModal(true)} variant="outline" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" />
                Log in
              </Button>
              <Button onClick={() => setShowRegisterModal(true)} className="bg-[#3F72AF] flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Create account
              </Button>
            </div>
          </CardContent>
        </Card>

        <LoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          onRegisterClick={() => {
            setShowLoginModal(false)
            setShowRegisterModal(true)
          }}
        />

        <RegisterModal
          open={showRegisterModal}
          onOpenChange={setShowRegisterModal}
          onLoginClick={() => {
            setShowRegisterModal(false)
            setShowLoginModal(true)
          }}
        />
      </>
    )
  }

  if (isSubmitted) {
    return (
      <Card className="bg-[#F0FFF4] border-green-200">
        <CardContent className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-green-800 mb-2">Thank you for your review!</h3>
          <p className="text-green-700 mb-4">
            Your feedback about {placeName} has been submitted and will help others discover great places in Taipei.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
              Edit Review
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="foodQuality"
            render={({ field }) => (
              <FormItem
                className="space-y-2"
                onMouseEnter={() => setIsHovering("food")}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full ${isHovering === "food" ? "bg-[#3F72AF]" : "bg-[#DBE2EF]"} flex items-center justify-center mr-2 transition-colors duration-300`}
                  >
                    <Utensils
                      className={`h-4 w-4 ${isHovering === "food" ? "text-white" : "text-[#3F72AF]"} transition-colors duration-300`}
                    />
                  </div>
                  <FormLabel className="text-[#112D4E]">Food Quality</FormLabel>
                  <span className="ml-auto text-sm font-medium">{field.value > 0 ? `${field.value}/5` : ""}</span>
                </div>
                <FormControl>
                  <StarRating value={field.value} onChange={field.onChange} size="md" allowHalf={true} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="service"
            render={({ field }) => (
              <FormItem
                className="space-y-2"
                onMouseEnter={() => setIsHovering("service")}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full ${isHovering === "service" ? "bg-[#3F72AF]" : "bg-[#DBE2EF]"} flex items-center justify-center mr-2 transition-colors duration-300`}
                  >
                    <Coffee
                      className={`h-4 w-4 ${isHovering === "service" ? "text-white" : "text-[#3F72AF]"} transition-colors duration-300`}
                    />
                  </div>
                  <FormLabel className="text-[#112D4E]">Service</FormLabel>
                  <span className="ml-auto text-sm font-medium">{field.value > 0 ? `${field.value}/5` : ""}</span>
                </div>
                <FormControl>
                  <StarRating value={field.value} onChange={field.onChange} size="md" allowHalf={true} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem
                className="space-y-2"
                onMouseEnter={() => setIsHovering("value")}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full ${isHovering === "value" ? "bg-[#3F72AF]" : "bg-[#DBE2EF]"} flex items-center justify-center mr-2 transition-colors duration-300`}
                  >
                    <DollarSign
                      className={`h-4 w-4 ${isHovering === "value" ? "text-white" : "text-[#3F72AF]"} transition-colors duration-300`}
                    />
                  </div>
                  <FormLabel className="text-[#112D4E]">Value for Money</FormLabel>
                  <span className="ml-auto text-sm font-medium">{field.value > 0 ? `${field.value}/5` : ""}</span>
                </div>
                <FormControl>
                  <StarRating value={field.value} onChange={field.onChange} size="md" allowHalf={true} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cleanliness"
            render={({ field }) => (
              <FormItem
                className="space-y-2"
                onMouseEnter={() => setIsHovering("cleanliness")}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full ${isHovering === "cleanliness" ? "bg-[#3F72AF]" : "bg-[#DBE2EF]"} flex items-center justify-center mr-2 transition-colors duration-300`}
                  >
                    <Sparkles
                      className={`h-4 w-4 ${isHovering === "cleanliness" ? "text-white" : "text-[#3F72AF]"} transition-colors duration-300`}
                    />
                  </div>
                  <FormLabel className="text-[#112D4E]">Cleanliness</FormLabel>
                  <span className="ml-auto text-sm font-medium">{field.value > 0 ? `${field.value}/5` : ""}</span>
                </div>
                <FormControl>
                  <StarRating value={field.value} onChange={field.onChange} size="md" allowHalf={true} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#112D4E]">Your Experience</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share what you loved (or didn&apos;t)! What would you tell a friend about this place?"
                  className="min-h-[120px] border-[#DBE2EF] focus-visible:ring-[#3F72AF]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="bg-[#3F72AF] hover:bg-[#112D4E]">
          Submit Review
        </Button>
      </form>
    </Form>
  )
}

// Import missing icons
import { DollarSign } from "lucide-react"
