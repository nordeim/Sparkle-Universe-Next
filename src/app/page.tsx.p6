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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="container relative mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full bg-primary/10 px-4 py-2">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Welcome to the Sparkle Universe</span>
            </div>
            
            <h1 className="mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              Where Fans Become Stars
            </h1>
            
            <p className="mb-10 text-xl text-muted-foreground sm:text-2xl">
              Join the ultimate community platform for Sparkle YouTube fans. 
              Connect, create, and celebrate your passion in a vibrant, gamified universe.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  <Rocket className="mr-2 h-5 w-5" />
                  Join the Universe
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold">100K+</div>
                <div className="text-sm text-muted-foreground">Active Fans</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-muted-foreground">Daily Posts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">1M+</div>
                <div className="text-sm text-muted-foreground">Sparkles Earned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything You Need to Shine
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover features designed to make your fan experience extraordinary
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Youtube className="h-6 w-6" />
                </div>
                <CardTitle>YouTube Integration</CardTitle>
                <CardDescription>
                  Deep integration with YouTube for watch parties, timestamp discussions, and clip creation
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle>Gamification</CardTitle>
                <CardDescription>
                  Earn XP, unlock achievements, complete quests, and climb the leaderboards
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Community</CardTitle>
                <CardDescription>
                  Join groups, follow creators, participate in events, and make lasting friendships
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Real-time Chat</CardTitle>
                <CardDescription>
                  Live discussions, instant notifications, and collaborative spaces for fans
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>Creator Tools</CardTitle>
                <CardDescription>
                  Analytics, monetization, fan funding, and professional content creation tools
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Safe & Secure</CardTitle>
                <CardDescription>
                  AI-powered moderation, privacy controls, and a positive community environment
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Achievement Showcase */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Unlock Legendary Achievements
            </h2>
            <p className="text-lg text-muted-foreground">
              Complete challenges and earn exclusive badges
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2">
              <Star className="mr-2 h-4 w-4" />
              First Post
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Heart className="mr-2 h-4 w-4" />
              Community Favorite
            </Badge>
            <Badge className="bg-purple-500/10 px-4 py-2 text-purple-500">
              <Trophy className="mr-2 h-4 w-4" />
              Top Creator
            </Badge>
            <Badge className="bg-amber-500/10 px-4 py-2 text-amber-500">
              <Sparkles className="mr-2 h-4 w-4" />
              Legendary Status
            </Badge>
            <Badge className="bg-pink-500/10 px-4 py-2 text-pink-500">
              <Globe className="mr-2 h-4 w-4" />
              Global Champion
            </Badge>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-12 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Ready to Join the Sparkle Universe?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Start your journey today and become part of something amazing
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-bold">Sparkle Universe</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Sparkle Universe. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
