// src/components/admin/user-analytics.tsx
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Star,
  MessageSquare,
  FileText,
  Heart,
  Share2,
  Eye,
  DollarSign,
  Zap,
  Target,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatNumber, formatPercentage, formatRelativeTime } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'

interface UserAnalyticsProps {
  userId?: string
  period?: 'day' | 'week' | 'month' | 'year'
}

interface UserStats {
  totalPosts: number
  totalComments: number
  totalReactions: number
  totalViews: number
  accountAge: number
  level: number
  experience: number
  sparklePoints: number
  premiumPoints: number
  followersCount: number
  followingCount: number
  engagementRate: number
  contentQualityScore: number
  reputationScore: number
}

interface ActivityData {
  date: string
  posts: number
  comments: number
  reactions: number
}

interface EngagementData {
  type: string
  value: number
  percentage: number
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export function UserAnalytics({ userId, period = 'week' }: UserAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [engagementData, setEngagementData] = useState<EngagementData[]>([])
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [userId, period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual tRPC call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with actual API response
      setStats({
        totalPosts: 42,
        totalComments: 128,
        totalReactions: 523,
        totalViews: 8420,
        accountAge: 90,
        level: 12,
        experience: 4250,
        sparklePoints: 15000,
        premiumPoints: 500,
        followersCount: 234,
        followingCount: 189,
        engagementRate: 8.5,
        contentQualityScore: 85,
        reputationScore: 920,
      })
      
      setActivityData([
        { date: 'Mon', posts: 2, comments: 8, reactions: 15 },
        { date: 'Tue', posts: 1, comments: 12, reactions: 20 },
        { date: 'Wed', posts: 3, comments: 6, reactions: 18 },
        { date: 'Thu', posts: 0, comments: 10, reactions: 25 },
        { date: 'Fri', posts: 2, comments: 15, reactions: 30 },
        { date: 'Sat', posts: 1, comments: 5, reactions: 12 },
        { date: 'Sun', posts: 2, comments: 9, reactions: 22 },
      ])
      
      setEngagementData([
        { type: 'Posts', value: 42, percentage: 25 },
        { type: 'Comments', value: 128, percentage: 35 },
        { type: 'Reactions', value: 523, percentage: 40 },
      ])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No analytics data available
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalPosts)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last {period}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalComments)}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last {period}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagementRate}%</div>
            <Progress value={stats.engagementRate * 10} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Age</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accountAge}d</div>
            <p className="text-xs text-muted-foreground">
              Member since Oct 2024
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            Comprehensive user activity and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="gamification">Gamification</TabsTrigger>
              <TabsTrigger value="monetization">Monetization</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Content Quality</span>
                    <span className="text-sm font-medium">{stats.contentQualityScore}%</span>
                  </div>
                  <Progress value={stats.contentQualityScore} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reputation Score</span>
                    <span className="text-sm font-medium">{formatNumber(stats.reputationScore)}</span>
                  </div>
                  <Progress value={(stats.reputationScore / 1000) * 100} />
                </div>
              </div>
              
              {/* Engagement Pie Chart */}
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4">
              {/* Activity Line Chart */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="posts" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="comments" 
                      stroke="#EC4899" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reactions" 
                      stroke="#10B981" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{formatNumber(stats.totalViews)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Total Views</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{formatNumber(stats.followersCount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Followers</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{formatNumber(stats.totalReactions)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Reactions</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="gamification" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      <span className="text-3xl font-bold">Level {stats.level}</span>
                    </div>
                    <Progress value={(stats.experience % 1000) / 10} className="mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {stats.experience % 1000} / 1000 XP to next level
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">Sparkle Points</span>
                        </div>
                        <span className="font-bold">{formatNumber(stats.sparklePoints)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Premium Points</span>
                        </div>
                        <span className="font-bold">{formatNumber(stats.premiumPoints)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* XP Progress Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">XP Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { source: 'Posts', xp: 420, color: 'bg-purple-500' },
                      { source: 'Comments', xp: 640, color: 'bg-pink-500' },
                      { source: 'Reactions', xp: 261, color: 'bg-green-500' },
                      { source: 'Daily Login', xp: 300, color: 'bg-blue-500' },
                      { source: 'Achievements', xp: 500, color: 'bg-yellow-500' },
                    ].map((item) => (
                      <div key={item.source} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{item.source}</span>
                          <span className="font-medium">{item.xp} XP</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color}`}
                            style={{ width: `${(item.xp / 640) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monetization" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Subscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mb-2">FREE TIER</Badge>
                    <p className="text-xs text-muted-foreground">
                      Upgrade to unlock premium features
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Lifetime Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">$0.00</p>
                    <p className="text-xs text-muted-foreground">
                      Total spent on platform
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Mock Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Point History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { date: 'Jan', sparkle: 5000, premium: 100 },
                          { date: 'Feb', sparkle: 7000, premium: 150 },
                          { date: 'Mar', sparkle: 9000, premium: 200 },
                          { date: 'Apr', sparkle: 11000, premium: 300 },
                          { date: 'May', sparkle: 13000, premium: 400 },
                          { date: 'Jun', sparkle: 15000, premium: 500 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="sparkle" 
                          stackId="1"
                          stroke="#8B5CF6" 
                          fill="#8B5CF6" 
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="premium" 
                          stackId="1"
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
