import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function SupportPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[#112D4E] mb-6 text-center">Support & Information</h1>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Help Center</CardTitle>
              <CardDescription>Find answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="/support/faq" className="text-[#3F72AF] hover:underline">
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link href="/support/contact" className="text-[#3F72AF] hover:underline">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/support/about" className="text-[#3F72AF] hover:underline">
                    About Taipei Guide
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal Information</CardTitle>
              <CardDescription>Our policies and terms</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="/support/privacy" className="text-[#3F72AF] hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/support/terms" className="text-[#3F72AF] hover:underline">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/support/cookies" className="text-[#3F72AF] hover:underline">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold text-[#112D4E] mb-4">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="mb-12">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I add a new place?</AccordionTrigger>
            <AccordionContent>
              To add a new place, click on the &quot;Add a Place&quot; button on the homepage or navigate to the &quot;Add Content&quot;
              section from the main menu. Fill out the form with details about the place, including its name, location,
              type, and other relevant information.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How are ratings calculated?</AccordionTrigger>
            <AccordionContent>
              Ratings are calculated as an average of all user reviews. Each review includes ratings for food quality,
              service, value, and cleanliness. The overall rating is the average of these four categories across all
              reviews for a place.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can I edit my contributions?</AccordionTrigger>
            <AccordionContent>
              Yes, you can edit places and reviews that you&apos;ve contributed. Simply navigate to your profile page, find
              the contribution you want to edit, and click the &quot;Edit&quot; button. Note that edits may be reviewed by our
              moderation team.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>How do I report inaccurate information?</AccordionTrigger>
            <AccordionContent>
              If you find inaccurate information about a place, you can report it by clicking the &quot;Report&quot; button on the
              place&apos;s detail page. Our team will review the report and make necessary corrections.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Is Taipei Guide available in other languages?</AccordionTrigger>
            <AccordionContent>
              Currently, Taipei Guide is available in English and Traditional Chinese. We&apos;re working on adding support
              for more languages in the future.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 className="text-2xl font-bold text-[#112D4E] mb-4">Contact Us</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4">
              Have questions, suggestions, or feedback? We&apos;d love to hear from you! Please reach out to us using one of
              the methods below:
            </p>
            <ul className="space-y-2">
              <li>
                <strong>Email:</strong> support@taipeiguide.com
              </li>
              <li>
                <strong>Phone:</strong> +886 2 1234 5678
              </li>
              <li>
                <strong>Address:</strong> 101 Taipei City, Xinyi District, Taipei 101
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
