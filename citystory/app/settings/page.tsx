"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, Bell, Shield, Globe, Moon, Sun, Save, Loader2, Lock, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/context/AuthContext'
import { getUserDisplayName, getUserInitials } from "@/lib/utils"

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const [isSaving, setIsSaving] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
    }, 1500)
  }

  const handlePasswordChange = () => {
    // Reset states
    setPasswordError(null)
    setPasswordSuccess(false)

    // Validate inputs
    if (!currentPassword) {
      setPasswordError("Current password is required")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don&apos;t match")
      return
    }

    // Simulate API call
    setIsChangingPassword(true)

    setTimeout(() => {
      // In a real app, you would verify the current password and update to the new one
      // For demo purposes, we&apos;ll just simulate success
      setIsChangingPassword(false)
      setPasswordSuccess(true)

      // Reset form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordSuccess(false)
      }, 5000)
    }, 1500)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // In a real app, you would update the theme here
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/" className="inline-flex items-center text-[#3F72AF] hover:text-[#112D4E] mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Use a single Tabs component that wraps both the sidebar and content */}
        <Tabs
          defaultValue="profile"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col md:flex-row w-full gap-8"
        >
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col items-center py-4">
                  <Avatar className="h-20 w-20 mb-4">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={getUserDisplayName(user || {})} />
                    ) : (
                      <AvatarFallback className="bg-[#3F72AF] text-white text-xl">
                        {getUserInitials(user || {})}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h3 className="font-medium text-lg text-[#112D4E]">{getUserDisplayName(user || {})}</h3>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                </div>

                <div className="mt-4">
                  <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
                    <TabsTrigger
                      value="profile"
                      className="justify-start px-3 py-2 data-[state=active]:bg-[#F9F7F7] data-[state=active]:text-[#3F72AF] text-left"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="justify-start px-3 py-2 data-[state=active]:bg-[#F9F7F7] data-[state=active]:text-[#3F72AF] text-left"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger
                      value="notifications"
                      className="justify-start px-3 py-2 data-[state=active]:bg-[#F9F7F7] data-[state=active]:text-[#3F72AF] text-left"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy"
                      className="justify-start px-3 py-2 data-[state=active]:bg-[#F9F7F7] data-[state=active]:text-[#3F72AF] text-left"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Privacy
                    </TabsTrigger>
                    <TabsTrigger
                      value="appearance"
                      className="justify-start px-3 py-2 data-[state=active]:bg-[#F9F7F7] data-[state=active]:text-[#3F72AF] text-left"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Appearance
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card className="border-none shadow-sm">
              <TabsContent value="profile" className="m-0">
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your personal information and profile settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={user?.name} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" defaultValue={user?.username} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={user?.email} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself"
                        className="min-h-[100px]"
                        defaultValue="Coffee enthusiast and explorer. I love discovering hidden cafés and sharing my finds with the community."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" defaultValue="Xinyi District, Taipei" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-[#3F72AF]" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="security" className="m-0">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your password and account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>

                    {passwordError && (
                      <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>{passwordError}</p>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-start">
                        <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>Password changed successfully!</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Password must be at least 8 characters</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <div className="pt-2">
                      <Button onClick={handlePasswordChange} className="bg-[#3F72AF]" disabled={isChangingPassword}>
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="outline" className="border-[#3F72AF] text-[#3F72AF]">
                          Set Up
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <h3 className="text-lg font-medium mb-4">Login Sessions</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        You&apos;re currently logged in on this device. You can log out of all other devices if you suspect
                        unauthorized access.
                      </p>
                      <Button variant="outline" className="border-[#3F72AF] text-[#3F72AF]">
                        Log Out of All Other Devices
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="notifications" className="m-0">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications on your device</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notification-types">Notification Types</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="new-reviews" className="rounded border-gray-300" defaultChecked />
                          <label htmlFor="new-reviews" className="text-sm">
                            New reviews on your places
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="place-updates"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <label htmlFor="place-updates" className="text-sm">
                            Updates to places you&apos;ve saved
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="new-followers"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <label htmlFor="new-followers" className="text-sm">
                            New followers
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="community-updates"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <label htmlFor="community-updates" className="text-sm">
                            Community updates
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-[#3F72AF]" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="privacy" className="m-0">
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Manage your privacy and security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-gray-500">Control who can see your profile</p>
                      </div>
                      <Select defaultValue="public">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="followers">Followers Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Contributions Visibility</Label>
                        <p className="text-sm text-gray-500">Control who can see your contributions</p>
                      </div>
                      <Select defaultValue="public">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="followers">Followers Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="location-sharing">Location Sharing</Label>
                        <p className="text-sm text-gray-500">Share your current location when adding places</p>
                      </div>
                      <Switch id="location-sharing" defaultChecked />
                    </div>

                    <div className="pt-4">
                      <Button variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        Delete Account
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-[#3F72AF]" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="appearance" className="m-0">
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize how the app looks and feels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dark-mode">Dark Mode</Label>
                        <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4 text-gray-500" />
                        <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                        <Moon className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="zh">Traditional Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="ko">Korean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Time Format</Label>
                      <Select defaultValue="12h">
                        <SelectTrigger>
                          <SelectValue placeholder="Select time format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-[#3F72AF]" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
