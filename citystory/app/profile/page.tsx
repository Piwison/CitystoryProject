'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import GuideLevelBadge from '@/components/auth/GuideLevelBadge';
import GuidePointsHistory, { PointEvent } from '@/components/auth/GuidePointsHistory';
import { User } from '@/context/AuthContext';

// Mock data - In a real app, this would come from API calls
const mockUserDetails = {
  level: 2,
  points: 350,
  nextLevelPoints: 500,
  savedPlaces: 12,
  contributions: 8,
  badges: 5,
};

const mockPointEvents: PointEvent[] = [
  {
    id: '1',
    eventType: 'place_contribution',
    points: 50,
    description: 'Added Taipei Night Market',
    timestamp: '2023-10-15T10:30:00Z',
  },
  {
    id: '2',
    eventType: 'review_submission',
    points: 20,
    description: 'Review for Taipei 101',
    timestamp: '2023-10-12T14:20:00Z',
  },
  {
    id: '3',
    eventType: 'helpful_vote',
    points: 5,
    description: 'Your review was voted helpful',
    timestamp: '2023-10-10T09:15:00Z',
  },
  {
    id: '4',
    eventType: 'photo_upload',
    points: 10,
    description: 'Photo uploaded to Elephant Mountain Trail',
    timestamp: '2023-10-05T16:45:00Z',
  },
  {
    id: '5',
    eventType: 'level_up',
    points: 0,
    description: 'Reached Explorer Level',
    timestamp: '2023-09-28T11:10:00Z',
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, authType } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Update avatar URL if user changes
  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const userInitials = getInitials(user.name || user.username);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-8 items-center md:items-start">
        <div className="relative group">
          <Avatar className="h-32 w-32">
            <AvatarImage src={avatarUrl} alt={user.name} />
            <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-0 right-0 bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              // Here would be code to open a file picker/modal
              alert('Avatar upload functionality will be implemented');
            }}
          >
            Change
          </Button>
        </div>

        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
          <p className="text-gray-500 mb-3">@{user.username}</p>
          
          <GuideLevelBadge 
            level={mockUserDetails.level}
            currentPoints={mockUserDetails.points}
            nextLevelPoints={mockUserDetails.nextLevelPoints}
            className="mb-4"
          />
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
            <div className="text-center">
              <span className="block font-semibold text-lg">{mockUserDetails.contributions}</span>
              <span className="text-gray-500">Contributions</span>
            </div>
            <div className="text-center">
              <span className="block font-semibold text-lg">{mockUserDetails.savedPlaces}</span>
              <span className="text-gray-500">Saved Places</span>
            </div>
            <div className="text-center">
              <span className="block font-semibold text-lg">{mockUserDetails.badges}</span>
              <span className="text-gray-500">Badges</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="saved">Saved Places</TabsTrigger>
          <TabsTrigger value="badges">Badges & Points</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <div className="mt-1 text-gray-900">{user.name}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1 text-gray-900">@{user.username}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 text-gray-900">{user.email}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {user.email && <span className="text-green-600">✓ Verified</span>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Authentication Type</label>
                <div className="mt-1 text-gray-900 capitalize">
                  {authType || 'Standard'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <div className="mt-1 text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="contributions" className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Contributions</h2>
            <p className="text-gray-500">
              This section will display all places, reviews, and photos you've contributed.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="saved" className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Saved Places</h2>
            <p className="text-gray-500">
              This section will display all places you've saved for future reference.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="badges" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Badges & Achievements</h2>
              <p className="text-gray-500">
                This section will display all badges and achievements you've earned.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <GuidePointsHistory pointEvents={mockPointEvents} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 