'use client';

import { useRouter } from 'next/navigation';
import { PlaceList } from '@/components/places/PlaceList';
import { Place } from '@/types/place';

export default function PlacesPage() {
  const router = useRouter();

  const handlePlaceClick = (place: Place) => {
    router.push(`/places/${place.id}`);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Explore Places</h1>
      <PlaceList onPlaceClick={handlePlaceClick} />
    </div>
  );
} 