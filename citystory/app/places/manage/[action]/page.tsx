'use client';

import { notFound } from 'next/navigation';
import { PlaceForm } from '@/components/places/PlaceForm';
import { getManagedPlaceDetails, createPlace, updatePlace } from '@/lib/api/services/placeManagementService';
import type { ManagedPlace } from '@/types';
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
      place = await getManagedPlaceDetails(searchParams.id);
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

function PlaceFormWrapper({ initialData }: { initialData?: ManagedPlace }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const handleSubmit = async (data: PlaceFormData) => {
    try {
      if (initialData) {
        await updatePlace(
          initialData.id,
          {
            ...data,
            description: "",
          }
        );
        toast({
          title: 'Place updated',
          description: 'The place has been updated successfully.',
        });
      } else {
        await createPlace(
          {
            ...data,
            description: "",
          }
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

  // Note: Photo upload would need to be handled differently with the new service
  // This is commented out as we'd need to implement it in placeManagementService
  /*
  const handlePhotoUpload = async (files: File[]) => {
    if (!initialData) return;
    
    try {
      // Need to implement this in placeManagementService
      // await uploadPlacePhotos(initialData.id, files);
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
  */

  return (
    <PlaceForm
      initialData={initialData}
      onSubmit={handleSubmit}
      // Removed photo upload until implemented in new service
      // onPhotoUpload={initialData ? handlePhotoUpload : undefined}
    />
  );
} 