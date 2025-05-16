"use client";

import { Button } from "../../../citystory/components/ui/button";
import ManagedPlacesList from "../../../citystory/components/places/ManagedPlacesList";
import Link from "next/link";

export default function ManagePlacesPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">Your Managed Places</h1>
        <Link href="/places/create">
          <Button variant="default" size="lg">+ Create New Place</Button>
        </Link>
      </div>
      <ManagedPlacesList />
    </div>
  );
} 