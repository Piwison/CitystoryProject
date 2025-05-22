"use client"

import { useState, useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, MapPin, Camera, Star, X, LinkIcon, Award, PartyPopper, Share2, MapPinned, Sparkles } from "lucide-react"
import PlaceSearch from "@/components/place-search"
import StarRating from "@/components/star-rating"
import LoginModal from "@/components/login-modal"
import RegisterModal from "@/components/register-modal"
import { useSession } from "next-auth/react"
import { useCreatePlace } from '@/hooks/usePlaceManagement'

// Place types
const placeTypes = [
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "cafe", label: "Café", icon: "☕" },
  { id: "bar", label: "Bar", icon: "🍸" },
  { id: "attraction", label: "Attraction", icon: "🏛️" },
] as const

// Feature sets for each place type
const placeFeatures = {
  restaurant: [
    { id: "authentic", label: "Authentic Cuisine" },
    { id: "fusion", label: "Fusion Cuisine" },
    { id: "local-ingredients", label: "Local Ingredients" },
    { id: "vegetarian", label: "Vegetarian Options" },
    { id: "vegan", label: "Vegan Options" },
    { id: "signature-dish", label: "Signature Dish" },
    { id: "english-menu", label: "English Menu" },
  ],
  cafe: [
    { id: "wifi", label: "Good WiFi" },
    { id: "power-outlets", label: "Power Outlets" },
    { id: "workspace", label: "Workspace Friendly" },
    { id: "specialty-coffee", label: "Specialty Coffee" },
    { id: "pet-friendly", label: "Pet Friendly" },
    { id: "pastry", label: "Good Pastry Selection" },
  ],
  bar: [
    { id: "craft", label: "Craft Selection" },
    { id: "local-spirits", label: "Local Spirits" },
    { id: "live-music", label: "Live Music" },
    { id: "food-menu", label: "Good Food Menu" },
    { id: "outdoor", label: "Outdoor Seating" },
    { id: "lively", label: "Lively Atmosphere" },
  ],
  attraction: [
    { id: "hidden-gem", label: "Hidden Gem" },
    { id: "photo-spots", label: "Great Photo Spots" },
    { id: "local-experience", label: "Local Experience" },
    { id: "morning", label: "Best in Morning" },
    { id: "evening", label: "Best at Sunset/Evening" },
    { id: "english-guidance", label: "English Guidance" },
  ],
}

// Price ranges in TWD
const priceRanges = [
  { value: 0, label: "Free" },
  { value: 200, label: "NT$1-200" },
  { value: 400, label: "NT$200-400" },
  { value: 600, label: "NT$400-600" },
  { value: 800, label: "NT$600-800" },
  { value: 1000, label: "NT$800-1000" },
  { value: 1500, label: "NT$1000-1500" },
  { value: 2000, label: "NT$1500-2000" },
  { value: 2500, label: "NT$2000+" },
]

// Updated schema with essential and optional fields
const formSchema = z.object({
  // Essential fields
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  placeType: z.string().min(1, {
    message: "Please select a place type.",
  }),
  features: z.array(z.string()).optional(),
  foodQuality: z.number().min(0).max(5),
  service: z.number().min(0).max(5),
  value: z.number().min(0).max(5),
  cleanliness: z.number().min(0).max(5),
  comment: z.string().min(10, {
    message: "Comment must be at least 10 characters.",
  }),

  // Optional fields
  priceRange: z.number().optional(),
  googleMapsLink: z.string().url().optional().or(z.literal("")),
  photos: z.array(z.string()).optional(),
})

type FeatureChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

// Feature Chip component
function FeatureChip({ label, selected, onClick }: FeatureChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        selected ? "bg-[#3F72AF] text-white" : "bg-white border border-[#DBE2EF] text-[#112D4E] hover:bg-[#F9F7F7]"
      }`}
    >
      {label}
    </button>
  )
}

// Confetti animation component
function Confetti() {
  return (
    <div className="confetti-container">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
          }}
        />
      ))}
      <style jsx>{`
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          opacity: 0;
          transform: translateY(0) rotate(0deg);
          animation: confetti-fall 3s ease-out forwards;
        }
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(-100%) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  )
}

// List of Taipei districts for extraction
const taipeiDistricts = [
  'Zhongzheng', 'Datong', 'Zhongshan', 'Songshan', 'Daan', 'Wanhua',
  'Xinyi', 'Shilin', 'Beitou', 'Neihu', 'Nangang', 'Wenshan'
];

export default function AddPlaceForm() {
  // All hooks at the top
  const { data: session, status } = useSession();
  const [photos, setPhotos] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      placeType: "",
      features: [],
      foodQuality: 0,
      service: 0,
      value: 0,
      cleanliness: 0,
      comment: "",
      priceRange: 500, // Default to mid-range price
      googleMapsLink: "",
      photos: [],
    },
  });

  // Watch for placeType changes to reset features
  const watchPlaceType = form.watch("placeType");
  // Watch all rating fields to calculate overall rating
  const foodQuality = form.watch("foodQuality");
  const service = form.watch("service");
  const value = form.watch("value");
  const cleanliness = form.watch("cleanliness");

  // Calculate overall rating
  const overallRating = useMemo(() => {
    const sum = foodQuality + service + value + cleanliness;
    const count = [foodQuality, service, value, cleanliness].filter((r) => r > 0).length;
    return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  }, [foodQuality, service, value, cleanliness]);

  useEffect(() => {
    if (watchPlaceType) {
      setSelectedFeatures([]);
      form.setValue("features", []);
    }
  }, [watchPlaceType, form]);

  // Toggle feature selection
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) => {
      const newFeatures = prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId];
      form.setValue("features", newFeatures);
      return newFeatures;
    });
  };

  // Format price for display
  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    if (price === 200) return "NT$1-200";
    if (price === 400) return "NT$200-400";
    if (price === 600) return "NT$400-600";
    if (price === 800) return "NT$600-800";
    if (price === 1000) return "NT$800-1000";
    if (price === 1500) return "NT$1000-1500";
    if (price === 2000) return "NT$1500-2000";
    if (price >= 2500) return "NT$2000+";
    return `NT$${price}`;
  };

  const createPlace = useCreatePlace({
    onSuccess: () => {
      setShowSuccessDialog(true);
      setShowConfetti(true);
    },
    onError: (error) => {
      setSubmitError(error.message || 'Failed to create place. Please try again.');
    }
  });

  // Now, after all hooks, do your early return
  if (status !== "authenticated" || !session?.user) {
    return (
      <>
        <div className="bg-[#F9F7F7] rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-[#DBE2EF] rounded-full mx-auto flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-[#3F72AF]" />
          </div>
          <h3 className="text-xl font-medium text-[#112D4E] mb-2">Sign in to add a place</h3>
          <p className="text-[#3F72AF] mb-6">
            Join our community to share your favorite places and help others discover great spots in Taipei.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              onClick={() => setShowLoginModal(true)}
              variant="outline"
              className="flex items-center border-[1px]"
            >
              Log in
            </Button>
            <Button onClick={() => setShowRegisterModal(true)} className="bg-[#3F72AF] flex items-center">
              Join
            </Button>
          </div>
        </div>

        <LoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          onRegisterClick={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />

        <RegisterModal
          open={showRegisterModal}
          onOpenChange={setShowRegisterModal}
          onLoginClick={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      </>
    );
  }

  const handleExistingPlace = (place: any) => {
    // In a real app, this would redirect to the place's page
    alert(`Redirecting to ${place.name}&apos;s page to add a review`)
  }

  const addPhoto = () => {
    // In a real app, this would open a file picker
    const mockPhoto = `/placeholder.svg?height=300&width=300&query=restaurant`
    const newPhotos = [...photos, mockPhoto]
    setPhotos(newPhotos)
    form.setValue("photos", newPhotos)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitError(null);
    // Sanitize googleMapsLink
    let googleMapsLink = values.googleMapsLink;
    if (!googleMapsLink || googleMapsLink.trim() === "") {
      googleMapsLink = undefined;
    }
    // Extract district from address
    let extractedDistrict = "";
    for (const district of taipeiDistricts) {
      if (values.address.toLowerCase().includes(district.toLowerCase())) {
        extractedDistrict = district;
        break;
      }
    }
    // Map form values to PlaceCreationPayload with correct field names
    const payload = {
      title: values.name, 
      description: values.comment,
      placeType: values.placeType as import('@/types').PlaceType, // Changed from 'type' to 'placeType'
      district: extractedDistrict as import('@/types').District,
      address: values.address,
      features: values.features,
      priceLevel: values.priceRange, // Changed from 'price_range' to 'priceLevel'
      imageUrl: values.photos?.[0], // or handle multiple photos as needed
      openingHours: undefined, // TODO: Add to form if needed
      phone: undefined,        // TODO: Add to form if needed
      website: undefined,      // TODO: Add to form if needed
      googleMapsLink: googleMapsLink,
      slug: undefined,         // TODO: Add to form if needed
      tags: [],                // TODO: Add to form if needed
    };
    
    try {
      createPlace.mutate(payload);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to create place. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Interactive Title Section */}
      <div className="bg-gradient-to-r from-[#3F72AF] to-[#112D4E] rounded-lg p-6 mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div className="w-full h-full relative">
            {[...Array(5)].map((_, i) => (
              <Sparkles
                key={i}
                className={`absolute text-white h-6 w-6 animate-pulse`}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center mb-4">
          <div className="bg-white p-2 rounded-full mr-4">
            <MapPinned className="h-8 w-8 text-[#3F72AF]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Share Your Favorite Place</h1>
        </div>

        <p className="text-[#DBE2EF] mb-6 max-w-2xl">
          Help others discover amazing spots in Taipei! Your recommendations make our community guide better for
          everyone.
        </p>

        <div className="flex flex-wrap gap-3">
          {["Restaurants", "Cafés", "Hidden Gems", "Local Favorites"].map((tag, i) => (
            <span
              key={i}
              className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-opacity-30 transition-all cursor-default"
              onMouseEnter={(e) => {
                e.currentTarget.classList.add("scale-110")
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove("scale-110")
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center mt-6 text-white text-sm">
          <Heart className="h-4 w-4 mr-1 text-red-300" />
          <span className="mr-4">{Math.floor(Math.random() * 100) + 150} places shared this month</span>
          <Share2 className="h-4 w-4 mr-1" />
          <span>Join the community of local guides</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {submitError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
              {submitError}
            </div>
          )}
          {/* Essential Fields Section */}
          <div className="space-y-6">
            {/* Place Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Place Name</FormLabel>
                  <FormControl>
                    <PlaceSearch value={field.value} onChange={field.onChange} onExistingPlace={handleExistingPlace} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="Full address" {...field} />
                      <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Place Type */}
            <FormField
              control={form.control}
              name="placeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Place Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                    >
                      {placeTypes.map((type) => (
                        <div
                          key={type.id}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            field.value === type.id
                              ? "border-[#3F72AF] bg-[#F9F7F7]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => field.onChange(type.id)}
                        >
                          <span className="text-2xl mb-1">{type.icon}</span>
                          <RadioGroupItem value={type.id} id={`type-${type.id}`} className="sr-only" />
                          <Label htmlFor={`type-${type.id}`} className="cursor-pointer">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Features - only show if a place type is selected */}
            {watchPlaceType && (
              <FormField
                control={form.control}
                name="features"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Features</FormLabel>
                    <FormDescription>Select what makes this place special</FormDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {placeFeatures[watchPlaceType as keyof typeof placeFeatures]?.map((feature) => (
                        <FeatureChip
                          key={feature.id}
                          label={feature.label}
                          selected={selectedFeatures.includes(feature.id)}
                          onClick={() => toggleFeature(feature.id)}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Rating Section */}
            <div className="bg-[#F9F7F7] p-4 rounded-lg">
              <h3 className="text-base font-medium mb-4 flex items-center">
                <Star className="h-5 w-5 text-[#FFD700] mr-2" />
                Rate Your Experience
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="foodQuality"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel>Food Quality</FormLabel>
                        <span className="text-sm font-medium">{field.value > 0 ? `${field.value}/5` : ""}</span>
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
                    <FormItem className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel>Service</FormLabel>
                        <span className="text-sm font-medium">{field.value > 0 ? `${field.value}/5` : ""}</span>
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
                    <FormItem className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel>Value for Money</FormLabel>
                        <span className="text-sm font-medium">{field.value > 0 ? `${field.value}/5` : ""}</span>
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
                    <FormItem className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel>Cleanliness</FormLabel>
                        <span className="text-sm font-medium">{field.value > 0 ? `${field.value}/5` : ""}</span>
                      </div>
                      <FormControl>
                        <StarRating value={field.value} onChange={field.onChange} size="md" allowHalf={true} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Overall Rating */}
              {overallRating > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-[#FFD700] mr-2" />
                      <span className="font-medium">Overall Rating</span>
                    </div>
                    <span className="text-lg font-bold text-[#3F72AF]">{overallRating}/5</span>
                  </div>
                  <div className="flex justify-center">
                    <StarRating value={overallRating} onChange={() => {}} size="lg" allowHalf={true} readOnly={true} />
                  </div>
                </div>
              )}
            </div>

            {/* Review Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share what you loved about this place! What would you tell a friend?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Fields Toggle */}
            {!showOptionalFields && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-500">Want to add more details?</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOptionalFields(true)}
                  className="text-[#3F72AF]"
                >
                  Add optional details
                </Button>
              </div>
            )}

            {/* Optional Fields Section */}
            {showOptionalFields && (
              <div className="border-t pt-6 mt-6 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium text-gray-700">Optional Details</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOptionalFields(false)}
                    className="h-8 text-gray-500"
                  >
                    <X className="h-4 w-4 mr-1" /> Hide
                  </Button>
                </div>

                {/* Price Range Slider */}
                <FormField
                  control={form.control}
                  name="priceRange"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center">
                        <span className="mr-2">Price Range</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Optional</span>
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Slider
                              defaultValue={[value || 0]}
                              min={0}
                              max={2500}
                              step={200}
                              onValueChange={(vals) => onChange(vals[0])}
                              className="py-4 flex-1 mr-4"
                            />
                            <span className="text-sm font-medium bg-[#3F72AF] text-white px-3 py-1 rounded-full">
                              {formatPrice(value || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Free</span>
                            <span>NT$400</span>
                            <span>NT$800</span>
                            <span>NT$1500</span>
                            <span>NT$2000+</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Google Maps Link */}
                <FormField
                  control={form.control}
                  name="googleMapsLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center">
                        <span className="mr-2">Google Maps Link</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Optional</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="https://maps.google.com/..." {...field} />
                          <LinkIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photos */}
                <FormField
                  control={form.control}
                  name="photos"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center">
                        <span className="mr-2">Photos</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Optional</span>
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {photos.map((photo, index) => (
                            <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                              <img
                                src={photo || "/placeholder.svg"}
                                alt={`Photo ${index + 1}`}
                                className="object-cover w-full h-full"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newPhotos = [...photos]
                                  newPhotos.splice(index, 1)
                                  setPhotos(newPhotos)
                                  form.setValue("photos", newPhotos)
                                }}
                                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addPhoto}
                            className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-[#3F72AF] transition-colors"
                          >
                            <div className="flex flex-col items-center text-gray-500 hover:text-[#3F72AF]">
                              <Camera className="h-6 w-6 mb-1" />
                              <span className="text-xs">Add Photo</span>
                            </div>
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-[#3F72AF] hover:bg-[#112D4E] py-6 text-base" disabled={createPlace.status === 'pending'}>
            {createPlace.status === 'pending' ? "Submitting..." : "Share Place"}
          </Button>
        </form>
      </Form>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          {showConfetti && <Confetti />}
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-[#3F72AF] animate-bounce">
              <span className="inline-block transform -rotate-12">🎉</span> Amazing!{" "}
              <span className="inline-block transform rotate-12">🎊</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#3F72AF] to-[#112D4E] rounded-full flex items-center justify-center mb-4 animate-pulse">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>

            {overallRating > 0 && (
              <div className="flex flex-col items-center mb-4">
                <p className="text-lg font-medium text-[#112D4E]">You rated this place</p>
                <div className="flex items-center mt-1">
                  <StarRating value={overallRating} onChange={() => {}} size="lg" allowHalf={true} readOnly={true} />
                  <span className="ml-2 text-xl font-bold text-[#FFD700]">{overallRating}</span>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-gray-600 max-w-xs mt-2">
              Your place has been added and will be visible after a quick review. Thank you for helping others discover
              great spots in Taipei!
            </p>

            <div className="w-full mt-6 bg-[#F9F7F7] p-4 rounded-lg">
              <p className="text-center text-sm font-medium text-[#3F72AF]">
                You&apos;ve earned the &quot;Local Guide&quot; badge for your contribution!
              </p>
              <div className="flex justify-center mt-2">
                <span className="inline-block bg-[#FFD700] text-[#112D4E] text-xs font-bold px-3 py-1 rounded-full">
                  +50 points
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false)
                // Reset form
                form.reset()
                setSelectedFeatures([])
                setPhotos([])
                setShowOptionalFields(false)
              }}
              className="sm:flex-1"
            >
              Add Another Place
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false)
                // In a real app, this would redirect to the place page
                window.location.href = "/explore"
              }}
              className="bg-[#3F72AF] hover:bg-[#112D4E] sm:flex-1"
            >
              Explore Places
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
