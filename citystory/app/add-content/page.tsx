"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Camera, MapPin, Star, Sparkles, Check, ChevronRight, ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import AddPlaceForm from "@/components/add-place-form"
import { useAuth } from '@/context/AuthContext'

export default function AddContentPage() {
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const { user } = useAuth()

  // Update progress when step changes
  useEffect(() => {
    setProgress(step * 33.33)
  }, [step])

  // Handle form submission
  const handleFormSubmit = () => {
    setFormSubmitted(true)
    setShowConfetti(true)

    // Reset confetti after 5 seconds
    setTimeout(() => {
      setShowConfetti(false)
    }, 5000)
  }

  // Draw confetti animation
  useEffect(() => {
    if (!showConfetti || !confettiRef.current) return

    const canvas = confettiRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Confetti particles
    const particles: any[] = []
    const particleCount = 150
    const colors = ["#3F72AF", "#112D4E", "#DBE2EF", "#F9F7F7", "#FFD700"]

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 2 * Math.PI,
        rotation: Math.random() * 0.2 - 0.1,
        rotationSpeed: Math.random() * 0.01 - 0.005,
      })
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.y += p.speed
        p.x += Math.sin(p.angle) * 2
        p.rotation += p.rotationSpeed

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()

        // Reset particles that fall out of view
        if (p.y > canvas.height) {
          p.y = -p.size
          p.x = Math.random() * canvas.width
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [showConfetti])

  return (
    <div className="container mx-auto py-8 px-4 relative">
      {/* Confetti canvas */}
      {showConfetti && (
        <canvas
          ref={confettiRef}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ width: "100vw", height: "100vh" }}
        />
      )}

      <a href="/" className="inline-flex items-center text-[#3F72AF] hover:text-[#112D4E] mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </a>

      <div className="max-w-4xl mx-auto">
        {formSubmitted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border-none shadow-lg bg-gradient-to-br from-[#F9F7F7] to-[#DBE2EF]">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-[#3F72AF] rounded-full mx-auto flex items-center justify-center mb-6">
                  <Check className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#112D4E] mb-4">Thank You!</h2>
                <p className="text-[#3F72AF] text-lg mb-8 max-w-md mx-auto">
                  Your place has been submitted successfully and will be reviewed by our team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild variant="outline" className="border-[#3F72AF] text-[#3F72AF]">
                    <Link href="/add-content">Add Another Place</Link>
                  </Button>
                  <Button asChild className="bg-[#3F72AF]">
                    <Link href="/explore">Explore Places</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#112D4E]">Step {step} of 3</span>
                <span className="text-sm text-[#3F72AF]">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 1 && (
                  <Card className="border-none shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-[#3F72AF] to-[#112D4E] p-6 text-white">
                      <Badge className="bg-white/20 text-white mb-2">Step 1</Badge>
                      <CardTitle className="text-2xl font-bold mb-2">Share Your Favorite Place</CardTitle>
                      <CardDescription className="text-white/80">
                        Help others discover great places in Taipei by adding your recommendations.
                      </CardDescription>
                    </div>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[#F9F7F7] rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-[#DBE2EF] rounded-full mx-auto flex items-center justify-center mb-3">
                            <MapPin className="h-6 w-6 text-[#3F72AF]" />
                          </div>
                          <h3 className="font-medium text-[#112D4E] mb-1">Local Spots</h3>
                          <p className="text-sm text-[#3F72AF]">Share hidden gems only locals know about</p>
                        </div>
                        <div className="bg-[#F9F7F7] rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-[#DBE2EF] rounded-full mx-auto flex items-center justify-center mb-3">
                            <Star className="h-6 w-6 text-[#3F72AF]" />
                          </div>
                          <h3 className="font-medium text-[#112D4E] mb-1">Your Favorites</h3>
                          <p className="text-sm text-[#3F72AF]">Recommend places you love to visit</p>
                        </div>
                        <div className="bg-[#F9F7F7] rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-[#DBE2EF] rounded-full mx-auto flex items-center justify-center mb-3">
                            <Camera className="h-6 w-6 text-[#3F72AF]" />
                          </div>
                          <h3 className="font-medium text-[#112D4E] mb-1">Visual Stories</h3>
                          <p className="text-sm text-[#3F72AF]">Add photos to showcase the experience</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-sm text-[#3F72AF]">
                          <Sparkles className="inline-block h-4 w-4 mr-1" />
                          Your contributions help make this guide valuable for everyone!
                        </p>
                        <Button onClick={() => setStep(2)} className="bg-[#3F72AF]">
                          Get Started <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 2 && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="text-center">
                      <Badge className="bg-[#3F72AF] mx-auto mb-2">Step 2</Badge>
                      <CardTitle className="text-2xl font-bold text-[#112D4E]">Tell Us About Your Place</CardTitle>
                      <CardDescription>Fill in the details about your favorite spot in Taipei</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AddPlaceForm />

                      <div className="flex justify-between mt-6">
                        <Button variant="outline" onClick={() => setStep(1)}>
                          <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button onClick={() => setStep(3)} className="bg-[#3F72AF]">
                          Continue <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 3 && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="text-center">
                      <Badge className="bg-[#3F72AF] mx-auto mb-2">Step 3</Badge>
                      <CardTitle className="text-2xl font-bold text-[#112D4E]">Final Review</CardTitle>
                      <CardDescription>Review your submission before sharing it with the community</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-[#F9F7F7] rounded-lg p-6 mb-6">
                        <h3 className="font-medium text-[#112D4E] mb-4">Preview</h3>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="w-24 h-24 bg-[#DBE2EF] rounded-lg flex items-center justify-center">
                              <Camera className="h-8 w-8 text-[#3F72AF]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#112D4E]">Your Place Name</h4>
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                Xinyi District • Café
                              </div>
                              <p className="text-sm text-gray-600">
                                Your description will appear here. Make sure it&apos;s detailed and helpful for other users.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#F9F7F7] rounded-lg p-6 mb-6">
                        <h3 className="font-medium text-[#112D4E] mb-2">Community Guidelines</h3>
                        <ul className="text-sm text-[#3F72AF] space-y-2">
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                            Share accurate and up-to-date information
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                            Be respectful and constructive in your descriptions
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                            Only upload photos you have permission to share
                          </li>
                        </ul>
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(2)}>
                          <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button onClick={handleFormSubmit} className="bg-[#FFD700] hover:bg-[#F2C94C] text-[#112D4E]">
                          Submit Place <Sparkles className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
