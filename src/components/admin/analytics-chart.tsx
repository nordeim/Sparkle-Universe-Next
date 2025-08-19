// src/components/admin/analytics-chart.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Users, FileText, Heart, MessageSquare, Download, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { formatNumber, formatPercentage } from '@/lib/utils'

interface ChartData {
  date: string
  users: number
  posts: number
  comments: number
  reactions: number
  revenue: number
}

export function AnalyticsChart() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalRevenue: 0,
    growthRate: 0,
  })

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockData = generateMockData(timeRange)
      setData(mockData)
      setStats({
        totalUsers: 15234,
        totalPosts: 4567,
        totalComments: 12890,
        totalRevenue: 45678.90,
        growthRate: 0.15,
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (range: string): ChartData[] => {
    const days = range === 'day' ? 24 : range === 'week' ? 7 : range === 'month' ? 30 : 365
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      users: Math.floor(Math.random() * 100) + 50,
      posts: Math.floor(Math.random() * 50) + 20,
      comments: Math.floor(Math.random() * 200) + 100,
      reactions: Math.floor(Math.random() * 500) + 200,
      revenue: Math.random() * 1000 + 500,
    }))
  }

  const exportData = () => {
    const csv = [
      ['Date', 'Users', 'Posts', 'Comments', 'Reactions', 'Revenue'],
      ...data.map(row => [row.date, row.users, row.posts, row.comments, row.reactions, row.revenue.toFixed(2)])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${Date.now()}.csv`
    a.click()
  }

  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6']

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>Platform performance and growth metrics</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">24 Hours</SelectItem>
                <SelectItem value="week">7 Days</SelectItem>
                <SelectItem value="month">30 Days</SelectItem>
                <SelectItem value="year">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportData} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-primary" />
              <span className={`text-sm flex items-center ${stats.growthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.growthRate > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {formatPercentage(Math.abs(stats.growthRate))}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-secondary" />
              <span className="text-sm text-green-500 flex items-center">
                <TrendingUp className="h-4 w-4" />
                12%
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{formatNumber(stats.totalPosts)}</p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <MessageSquare className="h-8 w-8 text-accent" />
            <div className="mt-2">
              <p className="text-2xl font-bold">{formatNumber(stats.totalComments)}</p>
              <p className="text-sm text-muted-foreground">Comments</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <Heart className="h-8 w-8 text-destructive" />
            <div className="mt-2">
              <p className="text-2xl font-bold">${formatNumber(stats.totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">User Activity</TabsTrigger>
            <TabsTrigger value="content">Content Metrics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8B5CF6" name="New Users" />
                <Line type="monotone" dataKey="reactions" stroke="#EC4899" name="Reactions" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="posts" fill="#10B981" name="Posts" />
                <Bar dataKey="comments" fill="#F59E0B" name="Comments" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="revenue" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Chart Type Selector */}
        <div className="mt-4 flex justify-center gap-2">
          <Button
            size="sm"
            variant={chartType === 'line' ? 'default' : 'outline'}
            onClick={() => setChartType('line')}
          >
            Line
          </Button>
          <Button
            size="sm"
            variant={chartType === 'bar' ? 'default' : 'outline'}
            onClick={() => setChartType('bar')}
          >
            Bar
          </Button>
          <Button
            size="sm"
            variant={chartType === 'area' ? 'default' : 'outline'}
            onClick={() => setChartType('area')}
          >
            Area
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AnalyticsChart
