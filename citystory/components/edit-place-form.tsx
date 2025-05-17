"use client"

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, MapPin, Camera, Star, X, LinkIcon, Award, PartyPopper, Share2, MapPinned, Sparkles } from "lucide-react";
import StarRating from "@/components/star-rating";
import { useGetManagedPlaceDetails, useUpdatePlace } from '@/hooks/usePlaceManagement';
import { PlaceType, PlaceUpdatePayload } from '@/types';

// Place types and features (reuse from add form)
const placeTypes = [
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "cafe", label: "Café", icon: "☕" },
  { id: "bar", label: "Bar", icon: "🍸" },
  { id: "attraction", label: "Attraction", icon: "🏛️" },
] as const;

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
};

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
];

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  placeType: z.string().min(1, { message: "Please select a place type." }),
  features: z.array(z.string()).optional(),
  priceRange: z.number().optional(),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters." }),
  photos: z.array(z.string()).optional(),
  googleMapsLink: z.string().optional(),
});

type EditPlaceFormProps = {
  placeId: string;
};

export default function EditPlaceForm({ placeId }: EditPlaceFormProps) {
  const { data: place, isLoading, error } = useGetManagedPlaceDetails(placeId);
  const updatePlace = useUpdatePlace({
    onSuccess: () => setShowSuccessDialog(true),
    onError: (error: any) => setSubmitError(error.message || "Failed to update place"),
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: place?.title || "",
      address: place?.address || "",
      placeType: place?.placeType || "",
      features: place?.features || [],
      priceRange: place?.priceLevel || 0,
      comment: place?.description || "",
      photos: place?.imageUrl ? [place.imageUrl] : [],
      googleMapsLink: place?.googleMapsLink || "",
    },
  });

  // Prefill form when place data loads
  useEffect(() => {
    if (place) {
      form.reset({
        name: place.title || "",
        address: place.address || "",
        placeType: place.placeType || "",
        features: place.features || [],
        priceRange: place.priceLevel || 0,
        comment: place.description || "",
        photos: place.imageUrl ? [place.imageUrl] : [],
        googleMapsLink: place.googleMapsLink || "",
      });
      setPhotos(place.imageUrl ? [place.imageUrl] : []);
      setSelectedFeatures(place.features || []);
    }
  }, [place, form]);

  // Feature selection logic
  const watchPlaceType = form.watch("placeType");
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

  const addPhoto = () => {
    const mockPhoto = `/placeholder.svg?height=300&width=300&query=restaurant`;
    const newPhotos = [...photos, mockPhoto];
    setPhotos(newPhotos);
    form.setValue("photos", newPhotos);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitError(null);
    // Extract district from address (reuse logic from add form)
    const taipeiDistricts = [
      'Zhongzheng', 'Datong', 'Zhongshan', 'Songshan', 'Daan', 'Wanhua',
      'Xinyi', 'Shilin', 'Beitou', 'Neihu', 'Nangang', 'Wenshan'
    ];
    let extractedDistrict = "";
    for (const district of taipeiDistricts) {
      if (values.address.toLowerCase().includes(district.toLowerCase())) {
        extractedDistrict = district;
        break;
      }
    }
    const payload: PlaceUpdatePayload = {
      title: values.name,
      description: values.comment,
      placeType: values.placeType as PlaceType,
      district: extractedDistrict as import('@/types').District | undefined,
      address: values.address,
      features: values.features,
      priceLevel: values.priceRange,
      imageUrl: values.photos?.[0],
      googleMapsLink: values.googleMapsLink,
      // Add other fields as needed
    };
    updatePlace.mutate({ placeId, data: payload });
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading place details...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-600">Failed to load place details.</div>;
  }

  return (
    <div className="space-y-6">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Place</h1>
        </div>
        <p className="text-[#DBE2EF] mb-6 max-w-2xl">
          Update the details for this place. Your changes help keep our community guide accurate!
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {submitError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
              {submitError}
            </div>
          )}
          <div className="space-y-6">
            {/* Place Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Place Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Place name" {...field} />
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
            {/* Features */}
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
                        <button
                          key={feature.id}
                          type="button"
                          onClick={() => toggleFeature(feature.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            selectedFeatures.includes(feature.id)
                              ? "bg-[#3F72AF] text-white"
                              : "bg-white border border-[#DBE2EF] text-[#112D4E] hover:bg-[#F9F7F7]"
                          }`}
                        >
                          {feature.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {/* Review Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this place..."
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
                                  const newPhotos = [...photos];
                                  newPhotos.splice(index, 1);
                                  setPhotos(newPhotos);
                                  form.setValue("photos", newPhotos);
                                }}
                                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const mockPhoto = `/placeholder.svg?height=300&width=300&query=restaurant`;
                              const newPhotos = [...photos, mockPhoto];
                              setPhotos(newPhotos);
                              form.setValue("photos", newPhotos);
                            }}
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
          <Button type="submit" className="w-full bg-[#3F72AF] hover:bg-[#112D4E] py-6 text-base" disabled={updatePlace.status === 'pending'}>
            {updatePlace.status === 'pending' ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-[#3F72AF] animate-bounce">
              <span className="inline-block transform -rotate-12">🎉</span> Updated! <span className="inline-block transform rotate-12">🎊</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#3F72AF] to-[#112D4E] rounded-full flex items-center justify-center mb-4 animate-pulse">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <p className="text-center text-sm text-gray-600 max-w-xs mt-2">
              Your changes have been saved. Thank you for keeping the guide up to date!
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-[#3F72AF] hover:bg-[#112D4E] sm:flex-1"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 