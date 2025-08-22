// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Mail, 
  Lock, 
  Sparkles, 
  ArrowRight,
  Github,
  Chrome,
  Twitter,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate login
    setTimeout(() => {
      setIsLoading(false)
      router.push('/dashboard')
    }, 2000)
  }

  const handleOAuthSignIn = (provider: string) => {
    setIsLoading(true)
    // Handle OAuth sign in
    console.log(`Signing in with ${provider}`)
  }

  return (
    <Card className="w-full max-w-md border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 dark:from-violet-400 dark:to-pink-400 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Sign in to continue to Sparkle Universe
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* OAuth Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
            className="hover:bg-gradient-to-r hover:from-violet-50 hover:to-pink-50 dark:hover:from-violet-950/50 dark:hover:to-pink-950/50 transition-all"
          >
            <Chrome className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuthSignIn('github')}
            disabled={isLoading}
            className="hover:bg-gradient-to-r hover:from-violet-50 hover:to-pink-50 dark:hover:from-violet-950/50 dark:hover:to-pink-950/50 transition-all"
          >
            <Github className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuthSignIn('twitter')}
            disabled={isLoading}
            className="hover:bg-gradient-to-r hover:from-violet-50 hover:to-pink-50 dark:hover:from-violet-950/50 dark:hover:to-pink-950/50 transition-all"
          >
            <Twitter className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-9 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-violet-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-9 pr-9 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-violet-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
            />
            <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
              Remember me for 30 days
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-lg transition-all hover:shadow-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 w-full">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            Sign up for free
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
