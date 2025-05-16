'use client';

import { notFound } from 'next/navigation';
import { PlaceForm } from '@/components/places/PlaceForm';
import { placeService } from '@/lib/services/placeService';
import type { Place } from '@/types/place';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

// Match PlaceFormData type from PlaceForm
interface PlaceFormData {
  name: string;
  address: string;
  type: 'restaurant' | 'cafe' | 'bar' | 'attraction';
  priceRange: number;
  googleMapsLink?: string;
}

export default async function PlaceActionPage({ params, searchParams }: any) {
  if (!params || !searchParams) {
    notFound();
  }
  const { action } = params;
  const isEdit = action === 'edit';

  // If editing, fetch the place data
  let place = undefined;
  if (isEdit) {
    if (!searchParams.id) {
      notFound();
    }
    try {
      place = await placeService.getPlaceById(searchParams.id);
    } catch (error) {
      notFound();
    }
  }

  if (action !== 'create' && action !== 'edit') {
    notFound();
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-8">
        {isEdit ? 'Edit Place' : 'Create New Place'}
      </h1>
      
      <PlaceFormWrapper initialData={place} />
    </div>
  );
}

function PlaceFormWrapper({ initialData }: { initialData?: Place }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const accessToken = session?.accessToken || session?.user?.accessToken;

  const handleSubmit = async (data: PlaceFormData) => {
    try {
      if (initialData) {
        await placeService.updatePlace(
          initialData.id,
          {
            ...data,
            description: "",
            category: data.type,
            latitude: 0,
            longitude: 0,
          },
          accessToken
        );
        toast({
          title: 'Place updated',
          description: 'The place has been updated successfully.',
        });
      } else {
        await placeService.createPlace(
          {
            ...data,
            description: "",
            category: data.type,
            latitude: 0,
            longitude: 0,
          },
          accessToken
        );
        toast({
          title: 'Place created',
          description: 'The new place has been created successfully.',
        });
      }
      router.push('/places');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save place. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUpload = async (files: File[]) => {
    if (!initialData) return;
    
    try {
      await placeService.uploadPlacePhotos(initialData.id, files);
      toast({
        title: 'Photos uploaded',
        description: 'The photos have been uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload photos. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <PlaceForm
      initialData={initialData}
      onSubmit={handleSubmit}
      onPhotoUpload={initialData ? handlePhotoUpload : undefined}
    />
  );
} 