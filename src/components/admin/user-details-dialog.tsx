// src/components/admin/user-details-dialog.tsx
import React from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Activity,
  CreditCard,
  Award,
  AlertCircle,
  Check,
  X,
  Clock,
  Smartphone,
  Globe,
  Hash,
  Star,
  TrendingUp,
  DollarSign,
  Lock,
  Unlock,
} from 'lucide-react'
import type { User as UserType, UserRole, UserStatus } from '@prisma/client'

interface UserDetailsDialogProps {
  user: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleColors: Record<UserRole, string> = {
  USER: 'default',
  CREATOR: 'secondary',
  VERIFIED_CREATOR: 'success',
  MODERATOR: 'warning',
  ADMIN: 'destructive',
  SYSTEM: 'outline',
}

const statusColors: Record<UserStatus, string> = {
  PENDING_VERIFICATION: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  BANNED: 'destructive',
  DELETED: 'secondary',
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  if (!user) return null

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never'
    return format(new Date(date), 'PPP')
  }

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return 'Never'
    return format(new Date(date), 'PPp')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Complete profile and activity information
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{user.username || 'No username'}</h3>
                  <Badge variant={roleColors[user.role as UserRole] as any}>
                    {user.role}
                  </Badge>
                  <Badge variant={statusColors[user.status as UserStatus] as any}>
                    {user.status}
                  </Badge>
                  {user.verified && (
                    <Badge variant="outline" className="gap-1">
                      <Check className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">{user.email}</p>
                
                {user.profile?.bio && (
                  <p className="text-sm mt-2">{user.profile.bio}</p>
                )}
                
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {user.id}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="gamification">Gamification</TabsTrigger>
                <TabsTrigger value="monetization">Monetization</TabsTrigger>
              </TabsList>
              
              {/* Account Tab */}
              <TabsContent value="account" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    icon={User}
                    label="Display Name"
                    value={user.profile?.displayName || user.username || 'Not set'}
                  />
                  <InfoItem
                    icon={Mail}
                    label="Email Verified"
                    value={user.emailVerified ? 'Yes' : 'No'}
                    valueColor={user.emailVerified ? 'text-green-600' : 'text-red-600'}
                  />
                  <InfoItem
                    icon={Smartphone}
                    label="Phone Number"
                    value={user.phoneNumber ? '•••• ' + user.phoneNumber.slice(-4) : 'Not set'}
                  />
                  <InfoItem
                    icon={Globe}
                    label="Location"
                    value={user.profile?.location || 'Not set'}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Last Seen"
                    value={formatDateTime(user.lastSeenAt)}
                  />
                  <InfoItem
                    icon={Activity}
                    label="Online Status"
                    value={user.onlineStatus || 'OFFLINE'}
                  />
                </div>
                
                {user.profile?.socialLinks && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Social Links</h4>
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(user.profile.socialLinks, null, 2)}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    icon={Lock}
                    label="Two-Factor Auth"
                    value={user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    valueColor={user.twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'}
                  />
                  <InfoItem
                    icon={Shield}
                    label="Auth Provider"
                    value={user.authProvider || 'LOCAL'}
                  />
                  <InfoItem
                    icon={AlertCircle}
                    label="Failed Login Attempts"
                    value={user.failedLoginAttempts?.toString() || '0'}
                  />
                  <InfoItem
                    icon={Clock}
                    label="Account Locked Until"
                    value={user.accountLockedUntil ? formatDateTime(user.accountLockedUntil) : 'Not locked'}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Password Changed"
                    value={formatDate(user.lastPasswordChangedAt)}
                  />
                  <InfoItem
                    icon={Mail}
                    label="Email Verification Token"
                    value={user.emailVerificationToken ? 'Present' : 'None'}
                  />
                </div>
                
                {user.loginHistory && user.loginHistory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recent Login History</h4>
                    <div className="space-y-1">
                      {user.loginHistory.slice(0, 5).map((login: any, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          {formatDateTime(login.timestamp)} - {login.ipAddress} - {login.success ? 'Success' : 'Failed'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4 mt-4">
                {user.stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                      icon={TrendingUp}
                      label="Total Posts"
                      value={user.stats.totalPosts?.toString() || '0'}
                    />
                    <InfoItem
                      icon={TrendingUp}
                      label="Total Comments"
                      value={user.stats.totalComments?.toString() || '0'}
                    />
                    <InfoItem
                      icon={Star}
                      label="Likes Received"
                      value={user.stats.totalLikesReceived?.toString() || '0'}
                    />
                    <InfoItem
                      icon={Star}
                      label="Likes Given"
                      value={user.stats.totalLikesGiven?.toString() || '0'}
                    />
                    <InfoItem
                      icon={User}
                      label="Followers"
                      value={user.stats.totalFollowers?.toString() || '0'}
                    />
                    <InfoItem
                      icon={User}
                      label="Following"
                      value={user.stats.totalFollowing?.toString() || '0'}
                    />
                    <InfoItem
                      icon={Activity}
                      label="Active Days"
                      value={user.stats.totalActiveDays?.toString() || '0'}
                    />
                    <InfoItem
                      icon={Clock}
                      label="Time Spent"
                      value={`${user.stats.totalTimeSpent || 0} min`}
                    />
                  </div>
                )}
              </TabsContent>
              
              {/* Gamification Tab */}
              <TabsContent value="gamification" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    icon={Award}
                    label="Level"
                    value={user.level?.toString() || '1'}
                  />
                  <InfoItem
                    icon={Star}
                    label="Experience (XP)"
                    value={user.experience?.toLocaleString() || '0'}
                  />
                  <InfoItem
                    icon={DollarSign}
                    label="Sparkle Points"
                    value={user.sparklePoints?.toLocaleString() || '0'}
                  />
                  <InfoItem
                    icon={DollarSign}
                    label="Premium Points"
                    value={user.premiumPoints?.toLocaleString() || '0'}
                  />
                  <InfoItem
                    icon={Award}
                    label="Achievements"
                    value={user._count?.achievements?.toString() || '0'}
                  />
                  <InfoItem
                    icon={TrendingUp}
                    label="Reputation Score"
                    value={user.reputationScore?.toString() || '0'}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Login Streak"
                    value={`${user.loginStreak || 0} days`}
                  />
                  <InfoItem
                    icon={Star}
                    label="Subscription Tier"
                    value={user.subscription?.tier || 'FREE'}
                  />
                </div>
              </TabsContent>
              
              {/* Monetization Tab */}
              <TabsContent value="monetization" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    icon={DollarSign}
                    label="Creator Revenue Share"
                    value={user.creatorRevenueShare ? `${(Number(user.creatorRevenueShare) * 100).toFixed(0)}%` : 'N/A'}
                  />
                  <InfoItem
                    icon={DollarSign}
                    label="Total Revenue Earned"
                    value={user.totalRevenueEarned ? `$${(Number(user.totalRevenueEarned) / 100).toFixed(2)}` : '$0.00'}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Last Payout Date"
                    value={formatDate(user.lastPayoutDate)}
                  />
                  <InfoItem
                    icon={CreditCard}
                    label="Subscription Status"
                    value={user.subscription?.status || 'INACTIVE'}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Subscription Expires"
                    value={formatDate(user.subscription?.expiresAt)}
                  />
                  <InfoItem
                    icon={DollarSign}
                    label="Lifetime Value"
                    value={user.stats?.lifetimeValue ? `$${(Number(user.stats.lifetimeValue) / 100).toFixed(2)}` : '$0.00'}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  valueColor?: string
}

function InfoItem({ icon: Icon, label, value, valueColor }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${valueColor || ''}`}>{value}</p>
      </div>
    </div>
  )
}
