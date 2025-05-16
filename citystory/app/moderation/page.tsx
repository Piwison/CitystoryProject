import { Metadata } from "next"
import ModerationDashboard from "@/components/moderation-dashboard"
import { Container } from "@/components/ui/container"

export const metadata: Metadata = {
  title: "Content Moderation - CityStory",
  description: "Moderate user-submitted content",
}

export default function ModerationPage() {
  return (
    <Container>
      <div className="py-10">
        <ModerationDashboard />
      </div>
    </Container>
  )
} 