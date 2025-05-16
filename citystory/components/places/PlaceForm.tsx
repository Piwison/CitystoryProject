import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PhotoUpload } from './PhotoUpload';
import PlaceTypeSelector from './PlaceTypeSelector';

// Taipei districts
const TAIPEI_DISTRICTS = [
  "Beitou", "Daan", "Datong", "Nangang", "Neihu", "Shilin", 
  "Songshan", "Wanhua", "Wenshan", "Xinyi", "Zhongshan", "Zhongzheng"
];

// price ranges in TWD
const PRICE_RANGES = [
  { value: '0', label: 'Free' },
  { value: '200', label: 'NT$1-200' },
  { value: '400', label: 'NT$200-400' },
  { value: '600', label: 'NT$400-600' },
  { value: '800', label: 'NT$600-800' },
  { value: '1000', label: 'NT$800-1000' },
  { value: '1500', label: 'NT$1000-1500' },
  { value: '2000', label: 'NT$1500-2000' },
  { value: '2500', label: 'NT$2000+' },
];

// Status options (for admins)
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// Define full Place type
interface Place {
  id?: string;
  name: string;
  address: string;
  district: string;
  type: 'restaurant' | 'cafe' | 'bar' | 'attraction' | 'hotel' | 'shopping';
  priceRange: string;
  description?: string;
  googleMapsLink?: string;
  slug?: string;
  features?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Validations
const placeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(5, 'Enter a valid address'),
  district: z.string().min(1, 'District is required'),
  type: z.enum(['restaurant', 'cafe', 'bar', 'attraction', 'hotel', 'shopping']),
  priceRange: z.string(),
  description: z.string().optional(),
  googleMapsLink: z.string().url('Invalid Google Maps URL').optional().or(z.literal('')),
  features: z.array(z.string()).optional(),
  slug: z.string().optional(),
  customSlug: z.boolean().default(false),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

type PlaceFormData = z.infer<typeof placeFormSchema>;

interface PlaceFormProps {
  initialData?: Partial<Place>;
  onSubmit: (data: PlaceFormData) => Promise<void>;
  onPhotoUpload?: (files: File[]) => Promise<void>;
  isAdmin?: boolean;
}

export function PlaceForm({ 
  initialData, 
  onSubmit, 
  onPhotoUpload,
  isAdmin = false,
}: PlaceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [placeType, setPlaceType] = useState(initialData?.type || 'restaurant');

  const form = useForm<PlaceFormData>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      district: initialData?.district || '',
      type: initialData?.type || 'restaurant',
      priceRange: initialData?.priceRange || '0',
      description: initialData?.description || '',
      googleMapsLink: initialData?.googleMapsLink || '',
      features: initialData?.features || [],
      slug: initialData?.slug || '',
      customSlug: !!initialData?.slug,
      status: initialData?.status || 'pending',
    },
  });

  // Generate slug based on name
  useEffect(() => {
    const name = form.watch('name');
    if (name && !form.watch('customSlug')) {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setGeneratedSlug(slug);
      form.setValue('slug', slug);
    }
  }, [form.watch('name'), form.watch('customSlug')]);

  // Handle geocoding request
  const handleGeocode = async () => {
    const address = form.watch('address');
    if (!address) return;

    setIsGeocoding(true);
    try {
      // In a real implementation, call the geocoding API
      // For now, we're just simulating a success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just set a district based on a simple algorithm
      const districtIndex = Math.floor(Math.random() * TAIPEI_DISTRICTS.length);
      form.setValue('district', TAIPEI_DISTRICTS[districtIndex]);
      
      // Here you would also set coordinates
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handlePlaceTypeChange = (type: string) => {
    setPlaceType(type as any);
    // Reset features when changing place type
    form.setValue('features', []);
  };

  const handleSubmit = async (data: PlaceFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting place:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter place name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <Input placeholder="Enter full address" {...field} />
                      </FormControl>
                      <Button 
                        type="button"
                        variant="outline"
                        className="ml-2"
                        onClick={handleGeocode}
                        disabled={isGeocoding || !form.watch('address')}
                      >
                        {isGeocoding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Validate'
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      Click validate to confirm address and auto-detect district
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TAIPEI_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="googleMapsLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Maps Link (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter Google Maps URL" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this place..." 
                      className="min-h-[100px]" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Place Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <PlaceTypeSelector 
                  name="type"
                  onChange={handlePlaceTypeChange}
                />
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="priceRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Range</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select price range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRICE_RANGES.map((price) => (
                        <SelectItem key={price.value} value={price.value}>
                          {price.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="customSlug"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Use custom URL slug
                      </FormLabel>
                      <FormDescription>
                        Customize the URL for this place
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('customSlug') && (
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom URL Slug</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">
                            /places/
                          </span>
                          <Input {...field} placeholder="my-custom-url" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!form.watch('customSlug') && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Generated URL:</span>
                  <span className="text-sm font-medium">
                    /places/{generatedSlug || '(enter-name-first)'}
                  </span>
                </div>
              )}
            </div>

            {isAdmin && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Only administrators can change the status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {onPhotoUpload && (
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload onUpload={onPhotoUpload} />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : initialData?.id ? (
              'Update Place'
            ) : (
              'Create Place'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 