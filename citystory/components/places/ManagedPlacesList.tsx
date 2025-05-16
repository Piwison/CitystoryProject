"use client";

import { useGetManagedPlaces, useDeletePlace } from '@/hooks/usePlaceManagement';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ManagedPlace } from '@/types';
import { Input } from '@/components/ui/input';

export default function ManagedPlacesList() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: places, isLoading, error } = useGetManagedPlaces(userId || "", { enabled: !!userId });
  const deletePlace = useDeletePlace();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("name-asc");

  if (!userId) {
    return <div className="text-center py-12 text-gray-500">Please sign in to view your managed places.</div>;
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading your places...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-600">Failed to load your places.</div>;
  }
  if (!places || places.length === 0) {
    return <div className="text-center py-12 text-gray-500">You haven't added any places yet.</div>;
  }

  // Filtering
  let filtered = places.filter((place: ManagedPlace) =>
    place.title.toLowerCase().includes(filter.toLowerCase())
  );

  // Sorting
  filtered = filtered.sort((a, b) => {
    if (sort === "name-asc") return a.title.localeCompare(b.title);
    if (sort === "name-desc") return b.title.localeCompare(a.title);
    if (sort === "status") return (a.moderationStatus || '').localeCompare(b.moderationStatus || '');
    return 0;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center justify-between">
        <Input
          placeholder="Filter by name..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="name-asc">Sort: Name A-Z</option>
          <option value="name-desc">Sort: Name Z-A</option>
          <option value="status">Sort: Status</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((place: ManagedPlace) => (
              <tr key={place.id} className="border-t">
                <td className="px-4 py-2 font-medium">{place.title}</td>
                <td className="px-4 py-2">{place.address}</td>
                <td className="px-4 py-2">
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-100">
                    {place.moderationStatus || 'pending'}
                  </span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <Link href={`/places/edit?id=${place.id}`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deletePlace.isPending && deletingId === place.id}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this place?')) {
                        setDeletingId(place.id);
                        deletePlace.mutate(place.id, {
                          onSettled: () => setDeletingId(null),
                        });
                      }
                    }}
                  >
                    {deletePlace.isPending && deletingId === place.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 