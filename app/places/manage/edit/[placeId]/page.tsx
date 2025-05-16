"use client";

import EditPlaceForm from "@/components/edit-place-form";
import { useParams } from "next/navigation";

export default function EditPlacePage() {
  const params = useParams();
  // placeId will be available as a string in params
  const placeId = typeof params.placeId === "string" ? params.placeId : Array.isArray(params.placeId) ? params.placeId[0] : "";

  if (!placeId) {
    return <div className="text-center py-12 text-red-600">Invalid place ID.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Edit Place</h1>
      <EditPlaceForm placeId={placeId} />
    </div>
  );
} 