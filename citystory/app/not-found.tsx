import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#F9F7F7] to-[#DBE2EF] px-4">
      <h2 className="text-4xl font-bold text-[#112D4E] mb-4">Not Found</h2>
      <p className="text-lg text-[#3F72AF] mb-6">Could not find the requested resource</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-[#3F72AF] text-white rounded-lg hover:bg-[#112D4E] transition-colors"
      >
        Return Home
      </Link>
    </div>
  )
} 