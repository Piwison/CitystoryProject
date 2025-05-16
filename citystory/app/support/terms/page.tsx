import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/support" className="inline-flex items-center text-[#3F72AF] hover:text-[#112D4E] mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Support
      </Link>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#112D4E] mb-6">Terms of Service</h1>

        <div className="prose max-w-none">
          <p>Last updated: April 28, 2023</p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to Taipei Guide. These terms and conditions outline the rules and regulations for the use of our
            website.
          </p>

          <h2>2. Acceptance of Terms</h2>
          <p>
            By accessing this website, we assume you accept these terms and conditions in full. Do not continue to use
            Taipei Guide if you do not accept all of the terms and conditions stated on this page.
          </p>

          <h2>3. User Contributions</h2>
          <p>
            Users may contribute content to the website, including place information, reviews, and ratings. By
            submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify,
            and display the content in connection with the service.
          </p>

          <h2>4. Content Guidelines</h2>
          <p>
            User contributions must not be illegal, obscene, threatening, defamatory, invasive of privacy, infringing of
            intellectual property rights, or otherwise injurious to third parties. Contributions must not consist of or
            contain software viruses, political campaigning, commercial solicitation, chain letters, mass mailings, or
            any form of &quot;spam.&quot;
          </p>

          <h2>5. Moderation</h2>
          <p>
            We reserve the right, but not the obligation, to review, edit, or remove any content that we consider, in
            our sole discretion, to violate these Terms of Service or to be otherwise objectionable.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            The Taipei Guide name, logo, and all related names, logos, product and service names, designs, and slogans
            are trademarks of Taipei Guide or its affiliates. You must not use such marks without our prior written
            permission.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            In no event shall Taipei Guide, nor its directors, employees, partners, agents, suppliers, or affiliates, be
            liable for any indirect, incidental, special, consequential or punitive damages, including without
            limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to
            or use of or inability to access or use the service.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is
            material, we will provide at least 30 days&apos; notice prior to any new terms taking effect.
          </p>

          <h2>9. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at terms@taipeiguide.com.</p>
        </div>
      </div>
    </div>
  )
}
