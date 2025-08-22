// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Users, 
  Trophy, 
  MessageSquare, 
  Youtube, 
  Zap,
  ArrowRight,
  Star,
  Heart,
  Rocket,
  Shield,
  Globe
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Enhanced contrast with deeper gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-100 via-gray-50 to-pink-100 dark:from-violet-950/30 dark:via-gray-950 dark:to-pink-950/30">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="container relative mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/50 px-4 py-2 shadow-md">
              <Sparkles className="mr-2 h-5 w-5 text-violet-700 dark:text-violet-400" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Welcome to the Sparkle Universe</span>
            </div>
            
            <h1 className="mb-6 bg-gradient-to-r from-violet-700 via-pink-700 to-cyan-700 dark:from-violet-400 dark:via-pink-400 dark:to-cyan-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              Where Fans Become Stars
            </h1>
            
            <p className="mb-10 text-xl text-gray-700 dark:text-gray-300 sm:text-2xl">
              Join the ultimate community platform for Sparkle YouTube fans. 
              Connect, create, and celebrate your passion in a vibrant, gamified universe.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl transition-all">
                  <Rocket className="mr-2 h-5 w-5" />
                  Join the Universe
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-400 transition-all">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">100K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Fans</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">50K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Daily Posts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">1M+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sparkles Earned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced contrast and card backgrounds */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              Everything You Need to Shine
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Discover features designed to make your fan experience extraordinary
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-xl transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400">
                  <Youtube className="h-6 w-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-gray-100">YouTube Integration</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Deep integration with YouTube for watch parties, timestamp discussions, and clip creation
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-400">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-gray-100">Gamification</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Earn XP, unlock achievements, complete quests, and climb the leaderboards
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-gray-100">Community</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Join groups, follow creators, participate in events, and make lasting friendships
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-gray-100">Real-time Chat</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Live discussions, instant notifications, and collaborative spaces for fans
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-gray-100">Creator Tools</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Analytics, monetization, fan funding, and professional content creation tools
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-gray-900 dark:text-gray-100">Safe & Secure</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  AI-powered moderation, privacy controls, and a positive community environment
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Achievement Showcase - Enhanced background and badge contrast */}
      <section className="bg-gray-100 dark:bg-gray-800/50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              Unlock Legendary Achievements
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Complete challenges and earn exclusive badges
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              <Star className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
              First Post
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-pink-100 dark:bg-pink-900/50 text-pink-900 dark:text-pink-300 border-pink-200 dark:border-pink-800">
              <Heart className="mr-2 h-4 w-4" />
              Community Favorite
            </Badge>
            <Badge className="bg-purple-100 dark:bg-purple-900/50 px-4 py-2 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              <Trophy className="mr-2 h-4 w-4" />
              Top Creator
            </Badge>
            <Badge className="bg-amber-100 dark:bg-amber-900/50 px-4 py-2 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800">
              <Sparkles className="mr-2 h-4 w-4" />
              Legendary Status
            </Badge>
            <Badge className="bg-cyan-100 dark:bg-cyan-900/50 px-4 py-2 text-cyan-900 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800">
              <Globe className="mr-2 h-4 w-4" />
              Global Champion
            </Badge>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced contrast and depth */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 border-none shadow-xl">
            <CardContent className="p-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
                Ready to Join the Sparkle Universe?
              </h2>
              <p className="mb-8 text-lg text-gray-700 dark:text-gray-300">
                Start your journey today and become part of something amazing
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl transition-all">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-400 transition-all">
                    Learn More
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer - Enhanced contrast */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              <span className="font-bold text-gray-900 dark:text-gray-100">Sparkle Universe</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                Contact
              </Link>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 Sparkle Universe. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
