"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserPlus, Loader2, Mail, Lock, UserIcon, AlertCircle } from "lucide-react"
import { useAuth } from '@/context/AuthContext'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "next-auth/react"
import { FcGoogle } from "react-icons/fc"
import { useRouter, useSearchParams } from "next/navigation"

const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  password_confirm: z.string().min(8, { message: "Please confirm your password (min 8 characters)" }),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords do not match",
  path: ["password_confirm"],
});

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginClick: () => void
}

export default function RegisterModal({ open, onOpenChange, onLoginClick }: RegisterModalProps) {
  const { register } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [ssoError, setSsoError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setSsoError('Google SSO failed. Please try again or use another sign up method.');
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      password_confirm: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    setIsLoading(true)
    try {
      await register({ username: values.username, email: values.email, password: values.password, password_confirm: values.password_confirm })
      onOpenChange(false)
      form.reset()
    } catch (error) {
      setError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#112D4E]">Create an account</DialogTitle>
          <DialogDescription className="text-center">
            Join our community and start sharing your favorite places
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Google SSO Button */}
          {ssoError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{ssoError}</AlertDescription>
            </Alert>
          )}
          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white border text-gray-700 hover:bg-gray-50"
            onClick={async () => {
              setIsLoading(true);
              setSsoError(null);
              try {
                const result = await signIn("google", { callbackUrl: "/", redirect: true });
                if (!result || result.error) {
                  setSsoError('Google SSO was cancelled or failed. Please try again.');
                }
              } catch (e) {
                setSsoError('Google SSO failed. Please try again.');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            variant="outline"
          >
            <FcGoogle className="h-5 w-5" />
            Sign up with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center my-2">
            <hr className="flex-grow border-gray-200" />
            <span className="mx-2 text-gray-400 text-xs">or</span>
            <hr className="flex-grow border-gray-200" />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="johndoe" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="you@example.com" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input type="password" placeholder="Confirm password" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-[#3F72AF]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign up
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-[#3F72AF]" onClick={onLoginClick} disabled={isLoading}>
              Log in
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
