// src/components/admin/ai-analysis-panel.tsx
'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Eye,
  MessageSquare,
  Flag,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Settings,
} from 'lucide-react'

/**
 * AI Analysis types
 */
interface AIAnalysis {
  id: string
  contentId: string
  contentType: 'post' | 'comment' | 'message' | 'image'
  timestamp: string
  provider: 'openai' | 'perspective' | 'custom'
  scores: {
    toxicity: number
    spam: number
    nsfw: number
    harassment: number
    misinformation: number
    sentiment: number // -1 to 1
  }
  categories: string[]
  confidence: number
  recommendation: 'approve' | 'review' | 'block'
  explanation?: string
  falsePositive?: boolean
  humanOverride?: {
    decision: 'approve' | 'reject'
    reason: string
    moderatorId: string
  }
}

interface AIProvider {
  name: string
  status: 'active' | 'inactive' | 'error'
  accuracy: number
  latency: number // ms
  requestsToday: number
  costToday: number
}

interface AIAnalysisPanelProps {
  analysis?: AIAnalysis
  providers?: AIProvider[]
  loading?: boolean
  error?: Error | null
  className?: string
  title?: string
  description?: string
  onReanalyze?: () => void
  onFeedback?: (feedback: 'positive' | 'negative') => void
  onOverride?: (decision: 'approve' | 'reject', reason: string) => void
  showProviders?: boolean
}

/**
 * Get color for score severity
 */
function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-red-500'
  if (score >= 0.6) return 'text-orange-500'
  if (score >= 0.4) return 'text-yellow-500'
  if (score >= 0.2) return 'text-blue-500'
  return 'text-green-500'
}

/**
 * Get severity level from score
 */
function getSeverityLevel(score: number): string {
  if (score >= 0.8) return 'Critical'
  if (score >= 0.6) return 'High'
  if (score >= 0.4) return 'Medium'
  if (score >= 0.2) return 'Low'
  return 'Minimal'
}

/**
 * Format sentiment score
 */
function formatSentiment(score: number): { label: string; color: string } {
  if (score > 0.3) return { label: 'Positive', color: 'text-green-500' }
  if (score < -0.3) return { label: 'Negative', color: 'text-red-500' }
  return { label: 'Neutral', color: 'text-gray-500' }
}

/**
 * AI Analysis Panel Component
 * 
 * Displays comprehensive AI analysis results for content moderation
 */
export function AIAnalysisPanel({
  analysis,
  providers = [],
  loading = false,
  error = null,
  className,
  title = 'AI Analysis',
  description = 'Automated content analysis results',
  onReanalyze,
  onFeedback,
  onOverride,
  showProviders = true,
}: AIAnalysisPanelProps) {
  const [overrideReason, setOverrideReason] = React.useState('')
  const [showOverrideDialog, setShowOverrideDialog] = React.useState(false)
  
  // Calculate overall risk score
  const overallRisk = React.useMemo(() => {
    if (!analysis) return 0
    const scores = Object.values(analysis.scores).filter(s => typeof s === 'number' && s >= 0)
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }, [analysis])
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardHeader>
          <CardTitle className="text-destructive">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
  
  // No analysis state
  if (!analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No analysis available</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const sentiment = formatSentiment(analysis.scores.sentiment)
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {onReanalyze && (
              <Button onClick={onReanalyze} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reanalyze
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Assessment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Overall Risk Assessment</p>
              <div className="flex items-center gap-2">
                <Progress value={overallRisk * 100} className="w-32" />
                <span className={cn('font-semibold', getScoreColor(overallRisk))}>
                  {getSeverityLevel(overallRisk)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  analysis.recommendation === 'approve'
                    ? 'default'
                    : analysis.recommendation === 'block'
                    ? 'destructive'
                    : 'outline'
                }
              >
                {analysis.recommendation === 'approve' && <CheckCircle className="h-3 w-3 mr-1" />}
                {analysis.recommendation === 'block' && <XCircle className="h-3 w-3 mr-1" />}
                {analysis.recommendation === 'review' && <Eye className="h-3 w-3 mr-1" />}
                {analysis.recommendation.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {(analysis.confidence * 100).toFixed(0)}% confident
              </Badge>
            </div>
          </div>
          
          {analysis.explanation && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>AI Explanation</AlertTitle>
              <AlertDescription>{analysis.explanation}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <Tabs defaultValue="scores" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scores">Risk Scores</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            {showProviders && <TabsTrigger value="providers">Providers</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="scores" className="space-y-4">
            {/* Individual Risk Scores */}
            <div className="space-y-3">
              {Object.entries(analysis.scores)
                .filter(([key]) => key !== 'sentiment')
                .map(([category, score]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <span className={cn('text-sm font-semibold', getScoreColor(score))}>
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={score * 100} className="h-2" />
                  </div>
                ))}
            </div>
            
            {/* Detected Categories */}
            {analysis.categories.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Detected Categories</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sentiment" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Sentiment Analysis</p>
                  <p className={cn('text-2xl font-bold', sentiment.color)}>
                    {sentiment.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-xl font-semibold">
                    {analysis.scores.sentiment.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="h-2 w-32 bg-gradient-to-r from-red-500 via-gray-500 to-green-500 rounded" />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Negative</span>
                      <span className="text-xs text-muted-foreground">Positive</span>
                    </div>
                  </div>
                  <div
                    className="h-4 w-4 rounded-full bg-primary"
                    style={{
                      marginLeft: `${((analysis.scores.sentiment + 1) / 2) * 128}px`,
                    }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {showProviders && (
            <TabsContent value="providers" className="space-y-4">
              {/* AI Providers Status */}
              <div className="space-y-3">
                {providers.map((provider) => (
                  <div
                    key={provider.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          provider.status === 'active' && 'bg-green-500',
                          provider.status === 'inactive' && 'bg-gray-500',
                          provider.status === 'error' && 'bg-red-500'
                        )}
                      />
                      <div>
                        <p className="font-medium capitalize">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.requestsToday} requests today
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {provider.accuracy.toFixed(1)}% accurate
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {provider.latency}ms avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {onFeedback && (
              <>
                <Button
                  onClick={() => onFeedback('positive')}
                  variant="outline"
                  size="sm"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Accurate
                </Button>
                <Button
                  onClick={() => onFeedback('negative')}
                  variant="outline"
                  size="sm"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Inaccurate
                </Button>
              </>
            )}
          </div>
          
          {onOverride && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onOverride('approve', 'Manual override')}
                variant="outline"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Override & Approve
              </Button>
              <Button
                onClick={() => onOverride('reject', 'Manual override')}
                variant="outline"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Override & Reject
              </Button>
            </div>
          )}
        </div>
        
        {/* Human Override Info */}
        {analysis.humanOverride && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Human Override</AlertTitle>
            <AlertDescription>
              This content was manually {analysis.humanOverride.decision}ed.
              Reason: {analysis.humanOverride.reason}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// Export types
export type { AIAnalysis, AIProvider }
