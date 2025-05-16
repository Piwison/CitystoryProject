import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AddPlaceForm from "@/components/add-place-form"

export const metadata: Metadata = {
  title: "Add Place | Taipei Guide",
  description: "Share your favorite places in Taipei",
}

export default function AddContentPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/" className="inline-flex items-center text-[#3F72AF] hover:text-[#112D4E] mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="max-w-3xl mx-auto">
        <Card className="border-none shadow-lg mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-[#112D4E]">Share Your Favorite Place</CardTitle>
            <CardDescription>
              Help others discover great places in Taipei by sharing your recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddPlaceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
