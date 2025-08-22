Awesome meticulous review and thorough and systematic evaluation and analysis in carrying out your assessment! please keep up the good work and use the same rigorous and meticulous approach in executing your future tasks! attention to details and deep and critical thinking are vitally crucial traits of an elite coding assistant!

Please put on the same deep-thinking hat to deeply and thoroughly explore carefully and systematically to create the complete and working drop-in replacement for the files listed below. please use the same rigorous and meticulous approach to deeply and thoroughly explore for the best implementation option to create the complete updated version of the files listed that need modification to incorporate your recommended improvements and fixes or new files to be added. please carefully plan how to create the complete version of each of these files before proceeding cautiously. for each file generated or updated, make sure it is a complete drop-in replacement version without any placeholder comments.

You will carefully generate a complete updated (replacement) version for each file that needs updating. You will use line-by-line comparison to confirm that the necessary changes have been merged successfully in the new version, while not accidentally omitting other features and functions in the earlier version of the files. Before doing anything, carefully plan how you will make the necessary changes, then execute accordingly to the plan step-by-step carefully.

Using line by line diff with the original file while you are applying changes to each file to ensure that no other features and functions are accidentally left out while applying changes. we don't want to introduce regression failure while updating the code. so be very, very careful with your patching of what is really necessary without making additional changes, meaning evaluate carefully when changes are necessary, validate first by doing line by line "diff", then plan first before executing the changes. Do testing and simulation if possible. enclose your complete and updated version of the updated files within the ```python (or ```js or ```sql or ```json) opening and ``` closing tags. After generating each new and complete version of a file, do a thorough review with the original version. Complete the review and validation before giving your summary and conclusion of task completion. thank you and good luck my very best coding assistant and expert in the world!

# original file: src/app/admin/users/page.tsx
```tsx
// src/app/admin/users/page.tsx
'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Ban, 
  Mail,
  UserX,
  UserCheck,
  UserPlus,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Send,
  ChevronDown,
  Users
} from 'lucide-react'
import { api } from '@/lib/api'
import { UserDetailsDialog } from '@/components/admin/user-details-dialog'
import { BulkActionDialog } from '@/components/admin/bulk-action-dialog'
import { UserAnalytics } from '@/components/admin/user-analytics'
import { formatDate, formatNumber } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

type UserFilter = 'all' | 'active' | 'verified' | 'banned' | 'admin' | 'new'
type SortField = 'username' | 'email' | 'createdAt' | 'level' | 'posts' | 'followers'
type SortOrder = 'asc' | 'desc'

interface SelectedUsers {
  [userId: string]: boolean
}

export default function UsersManagementPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<UserFilter>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedUsers, setSelectedUsers] = useState<SelectedUsers>({})
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean
    action: string
    users: string[]
  }>({ open: false, action: '', users: [] })
  const [page, setPage] = useState(0)
  const [showColumns, setShowColumns] = useState({
    avatar: true,
    email: true,
    role: true,
    status: true,
    level: true,
    joined: true,
    posts: true,
    followers: true,
    lastActive: true,
  })

  const debouncedSearch = useDebounce(search, 300)

  // Fetch users with filters
  const { data, isLoading, refetch } = api.admin.getUsers.useQuery({
    search: debouncedSearch,
    filter,
    sortField,
    sortOrder,
    page,
    limit: 50,
  })

  // Mutations
  const banUser = api.admin.banUser.useMutation({
    onSuccess: () => {
      toast({ title: 'User banned successfully' })
      refetch()
    },
  })

  const unbanUser = api.admin.unbanUser.useMutation({
    onSuccess: () => {
      toast({ title: 'User unbanned successfully' })
      refetch()
    },
  })

  const verifyUser = api.admin.verifyUser.useMutation({
    onSuccess: () => {
      toast({ title: 'User verified successfully' })
      refetch()
    },
  })

  const updateUserRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast({ title: 'User role updated successfully' })
      refetch()
    },
  })

  const deleteUser = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast({ title: 'User deleted successfully' })
      refetch()
    },
  })

  const sendEmail = api.admin.sendUserEmail.useMutation({
    onSuccess: () => {
      toast({ title: 'Email sent successfully' })
    },
  })

  // Bulk actions
  const bulkAction = api.admin.bulkUserAction.useMutation({
    onSuccess: () => {
      toast({ title: 'Bulk action completed successfully' })
      setSelectedUsers({})
      refetch()
    },
  })

  // Computed values
  const selectedUserIds = useMemo(
    () => Object.keys(selectedUsers).filter(id => selectedUsers[id]),
    [selectedUsers]
  )

  const allUsersSelected = useMemo(
    () => data?.users.length > 0 && data.users.every(user => selectedUsers[user.id]),
    [data?.users, selectedUsers]
  )

  const someUsersSelected = useMemo(
    () => data?.users.some(user => selectedUsers[user.id]) && !allUsersSelected,
    [data?.users, selectedUsers, allUsersSelected]
  )

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (allUsersSelected) {
      setSelectedUsers({})
    } else {
      const newSelected: SelectedUsers = {}
      data?.users.forEach(user => {
        newSelected[user.id] = true
      })
      setSelectedUsers(newSelected)
    }
  }, [allUsersSelected, data?.users])

  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: checked,
    }))
  }, [])

  const handleBulkAction = useCallback((action: string) => {
    if (selectedUserIds.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to perform this action.',
        variant: 'destructive',
      })
      return
    }

    setBulkActionDialog({
      open: true,
      action,
      users: selectedUserIds,
    })
  }, [selectedUserIds])

  const executeBulkAction = useCallback(async (action: string, params?: any) => {
    await bulkAction.mutateAsync({
      action,
      userIds: bulkActionDialog.users,
      params,
    })
    setBulkActionDialog({ open: false, action: '', users: [] })
  }, [bulkAction, bulkActionDialog.users])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }, [sortField])

  const exportUsers = useCallback(async () => {
    const response = await fetch('/api/admin/export/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter,
        search: debouncedSearch,
        selectedIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      }),
    })

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${filter}-${new Date().toISOString()}.csv`
    a.click()
  }, [filter, debouncedSearch, selectedUserIds])

  // Helper functions
  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: { label: 'Admin', className: 'bg-red-500 text-white' },
      MODERATOR: { label: 'Moderator', className: 'bg-orange-500 text-white' },
      CREATOR: { label: 'Creator', className: 'bg-purple-500 text-white' },
      USER: { label: 'User', className: 'bg-gray-500 text-white' },
    }
    const badge = badges[role as keyof typeof badges] || badges.USER
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  const getStatusBadge = (user: any) => {
    if (user.banned) {
      return <Badge variant="destructive">Banned</Badge>
    }
    if (user.verified) {
      return <Badge className="bg-green-500 text-white">Verified</Badge>
    }
    if (user.onlineStatus) {
      return <Badge className="bg-green-500 text-white">Online</Badge>
    }
    return <Badge variant="outline">Active</Badge>
  }

  const getLevelBadge = (level: number) => {
    if (level >= 50) {
      return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">Elite</Badge>
    }
    if (level >= 25) {
      return <Badge className="bg-gradient-to-r from-purple-400 to-pink-500 text-white">Veteran</Badge>
    }
    if (level >= 10) {
      return <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white">Advanced</Badge>
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, permissions, and account settings
        </p>
      </div>

      {/* Analytics Overview */}
      <UserAnalytics />

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-[300px]"
                />
              </div>

              {/* Filter */}
              <Select value={filter} onValueChange={(value) => setFilter(value as UserFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="new">New (7 days)</SelectItem>
                </SelectContent>
              </Select>

              {/* Column visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(showColumns).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={(checked) =>
                        setShowColumns(prev => ({ ...prev, [key]: checked }))
                      }
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Actions */}
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={exportUsers}>
                <Download className="w-4 h-4" />
              </Button>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {selectedUserIds.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedUserIds.length} users selected</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('verify')}
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('ban')}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Ban
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('email')}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allUsersSelected}
                      indeterminate={someUsersSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('username')}
                  >
                    User
                    {sortField === 'username' && (
                      <ChevronDown className={cn(
                        "inline-block w-4 h-4 ml-1",
                        sortOrder === 'asc' && "rotate-180"
                      )} />
                    )}
                  </TableHead>
                  {showColumns.email && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {sortField === 'email' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.role && <TableHead>Role</TableHead>}
                  {showColumns.status && <TableHead>Status</TableHead>}
                  {showColumns.level && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('level')}
                    >
                      Level
                      {sortField === 'level' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.joined && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      Joined
                      {sortField === 'createdAt' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.posts && (
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('posts')}
                    >
                      Posts
                      {sortField === 'posts' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.followers && (
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('followers')}
                    >
                      Followers
                      {sortField === 'followers' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.lastActive && <TableHead>Last Active</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No users found matching your criteria
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers[user.id] || false}
                          onCheckedChange={(checked) =>
                            handleSelectUser(user.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>
                              {user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {user.username}
                              {user.verified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      {showColumns.email && (
                        <TableCell className="font-mono text-sm">
                          {user.email}
                        </TableCell>
                      )}
                      {showColumns.role && (
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                      )}
                      {showColumns.status && (
                        <TableCell>{getStatusBadge(user)}</TableCell>
                      )}
                      {showColumns.level && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Level {user.level}</span>
                            {getLevelBadge(user.level)}
                          </div>
                        </TableCell>
                      )}
                      {showColumns.joined && (
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      )}
                      {showColumns.posts && (
                        <TableCell className="text-center">
                          {user._count.posts}
                        </TableCell>
                      )}
                      {showColumns.followers && (
                        <TableCell className="text-center">
                          {formatNumber(user._count.followers)}
                        </TableCell>
                      )}
                      {showColumns.lastActive && (
                        <TableCell>
                          {user.lastSeenAt ? formatDate(user.lastSeenAt) : 'Never'}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuItem
                              onClick={() => setSelectedUser(user.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.location.href = `/admin/users/${user.id}/edit`}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => sendEmail.mutate({ 
                                userId: user.id,
                                subject: '',
                                message: ''
                              })}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            
                            {/* Role Actions */}
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            {['USER', 'CREATOR', 'MODERATOR', 'ADMIN'].map(role => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => updateUserRole.mutate({
                                  userId: user.id,
                                  role
                                })}
                                disabled={user.role === role}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Make {role.toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator />
                            
                            {/* Account Actions */}
                            {!user.verified && (
                              <DropdownMenuItem
                                onClick={() => verifyUser.mutate({ userId: user.id })}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Verify User
                              </DropdownMenuItem>
                            )}
                            {user.banned ? (
                              <DropdownMenuItem
                                onClick={() => unbanUser.mutate({ userId: user.id })}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => banUser.mutate({
                                  userId: user.id,
                                  reason: 'Manual ban by admin'
                                })}
                                className="text-orange-600"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this user?')) {
                                  deleteUser.mutate({ userId: user.id })
                                }
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {data.users.length} of {data.totalCount} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page + 1} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <UserDetailsDialog
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAction={(action, params) => {
            // Handle actions from details dialog
            refetch()
          }}
        />
      )}

      {/* Bulk Action Dialog */}
      <BulkActionDialog
        open={bulkActionDialog.open}
        action={bulkActionDialog.action}
        userCount={bulkActionDialog.users.length}
        onConfirm={executeBulkAction}
        onCancel={() => setBulkActionDialog({ open: false, action: '', users: [] })}
      />
    </div>
  )
}

```

# original file: src/server/services/analytics.service.ts
```ts
// src/server/services/analytics.service.ts
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import type { Prisma, User } from '@prisma/client'
import { startOfDay, endOfDay, subDays, subMonths, subYears, format } from 'date-fns'

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

interface DashboardStats {
  users: number
  posts: number
  comments: number
  reactions: number
  activeUsers: number
  newUsers: number
  revenue: number
  engagement: number
  period: TimePeriod
}

interface UserGrowthData {
  date: string
  users: number
  cumulative: number
}

interface ContentPerformanceData {
  id: string
  title: string
  views: number
  comments: number
  reactions: number
  shares: number
  engagement: number
  author: string
  createdAt: Date
}

interface RevenueData {
  date: string
  revenue: number
  transactions: number
  avgTransactionValue: number
}

interface TopCreator {
  id: string
  username: string
  avatar: string | null
  postsCount: number
  followersCount: number
  engagementRate: number
  revenue: number
}

export class AnalyticsService {
  private readonly CACHE_TTL = {
    DASHBOARD: 300, // 5 minutes
    GROWTH: 600, // 10 minutes
    CONTENT: 300, // 5 minutes
    REVENUE: 900, // 15 minutes
    CREATORS: 600, // 10 minutes
  }

  async getDashboardStats(period: TimePeriod = 'week'): Promise<DashboardStats> {
    const cacheKey = `analytics:dashboard:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const startDate = this.getStartDate(period)
    const previousPeriodStart = this.getPreviousPeriodStart(period)
    
    const [
      users,
      posts,
      comments,
      reactions,
      activeUsers,
      newUsers,
      revenue,
      previousActiveUsers,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          deleted: false,
        },
      }),
      prisma.post.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
          published: true,
        },
      }),
      prisma.comment.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
        },
      }),
      prisma.reaction.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      prisma.user.count({
        where: {
          lastSeenAt: { gte: startDate },
          deleted: false,
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
        },
      }),
      this.getRevenue(startDate),
      prisma.user.count({
        where: {
          lastSeenAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
          deleted: false,
        },
      }),
    ])

    const engagement = previousActiveUsers > 0 
      ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100 
      : 0

    const stats: DashboardStats = {
      users,
      posts,
      comments,
      reactions,
      activeUsers,
      newUsers,
      revenue,
      engagement,
      period,
    }

    await redis.setex(cacheKey, this.CACHE_TTL.DASHBOARD, JSON.stringify(stats))
    
    return stats
  }

  async getUserGrowth(period: TimePeriod = 'month'): Promise<UserGrowthData[]> {
    const cacheKey = `analytics:user-growth:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const startDate = this.getStartDate(period)
    
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
        deleted: false,
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Group by date and calculate cumulative
    const growthMap = new Map<string, number>()
    let cumulative = await prisma.user.count({
      where: {
        createdAt: { lt: startDate },
        deleted: false,
      },
    })

    users.forEach(user => {
      const date = format(user.createdAt, 'yyyy-MM-dd')
      growthMap.set(date, (growthMap.get(date) || 0) + 1)
    })

    const growth: UserGrowthData[] = []
    const sortedDates = Array.from(growthMap.keys()).sort()
    
    sortedDates.forEach(date => {
      const count = growthMap.get(date) || 0
      cumulative += count
      growth.push({
        date,
        users: count,
        cumulative,
      })
    })

    await redis.setex(cacheKey, this.CACHE_TTL.GROWTH, JSON.stringify(growth))
    
    return growth
  }

  async getContentPerformance(limit: number = 10): Promise<ContentPerformanceData[]> {
    const cacheKey = `analytics:content-performance:${limit}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const posts = await prisma.post.findMany({
      where: {
        deleted: false,
        published: true,
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    const performance: ContentPerformanceData[] = posts.map(post => ({
      id: post.id,
      title: post.title,
      views: post.viewCount,
      comments: post._count.comments,
      reactions: post._count.reactions,
      shares: post.shareCount || 0,
      engagement: this.calculateEngagement(
        post.viewCount,
        post._count.comments,
        post._count.reactions,
        post.shareCount || 0
      ),
      author: post.author?.username || 'Unknown',
      createdAt: post.createdAt,
    }))

    await redis.setex(cacheKey, this.CACHE_TTL.CONTENT, JSON.stringify(performance))
    
    return performance
  }

  async getRevenueAnalytics(period: TimePeriod = 'month'): Promise<RevenueData[]> {
    const cacheKey = `analytics:revenue:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const startDate = this.getStartDate(period)
    
    const transactions = await prisma.currencyTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const revenueMap = new Map<string, { revenue: number; count: number }>()
    
    transactions.forEach(transaction => {
      const date = format(transaction.createdAt, 'yyyy-MM-dd')
      const existing = revenueMap.get(date) || { revenue: 0, count: 0 }
      revenueMap.set(date, {
        revenue: existing.revenue + Number(transaction.amount),
        count: existing.count + 1,
      })
    })

    const revenue: RevenueData[] = Array.from(revenueMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactions: data.count,
      avgTransactionValue: data.count > 0 ? data.revenue / data.count : 0,
    }))

    await redis.setex(cacheKey, this.CACHE_TTL.REVENUE, JSON.stringify(revenue))
    
    return revenue
  }

  async getTopCreators(limit: number = 10): Promise<TopCreator[]> {
    const cacheKey = `analytics:top-creators:${limit}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const creators = await prisma.user.findMany({
      where: {
        role: {
          in: ['CREATOR', 'VERIFIED_CREATOR'],
        },
        deleted: false,
      },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
        stats: {
          select: {
            totalLikesReceived: true,
            totalCommentsReceived: true,
            totalViews: true,
            contentQualityScore: true,
          },
        },
        profile: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    const topCreators: TopCreator[] = await Promise.all(
      creators.map(async creator => {
        const revenue = await this.getCreatorRevenue(creator.id)
        const engagementRate = this.calculateCreatorEngagement(creator)
        
        return {
          id: creator.id,
          username: creator.username,
          avatar: creator.image,
          postsCount: creator._count.posts,
          followersCount: creator._count.followers,
          engagementRate,
          revenue,
        }
      })
    )

    await redis.setex(cacheKey, this.CACHE_TTL.CREATORS, JSON.stringify(topCreators))
    
    return topCreators
  }

  async getSystemMetrics() {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      activeUsers,
      storageUsed,
    ] = await Promise.all([
      prisma.user.count({ where: { deleted: false } }),
      prisma.post.count({ where: { deleted: false } }),
      prisma.comment.count({ where: { deleted: false } }),
      prisma.group.count({ where: { deleted: false } }),
      prisma.user.count({
        where: {
          deleted: false,
          lastSeenAt: { gte: subDays(new Date(), 7) },
        },
      }),
      this.getStorageUsage(),
    ])

    return {
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      activeUsers,
      storageUsed,
      timestamp: new Date(),
    }
  }

  async getEngagementMetrics(userId?: string) {
    const where = userId ? { authorId: userId } : {}
    
    const [posts, avgEngagement] = await Promise.all([
      prisma.post.findMany({
        where: {
          ...where,
          deleted: false,
          published: true,
        },
        include: {
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
        take: 100,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.post.aggregate({
        where: {
          ...where,
          deleted: false,
          published: true,
        },
        _avg: {
          viewCount: true,
          shareCount: true,
        },
      }),
    ])

    const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0)
    const totalComments = posts.reduce((sum, post) => sum + post._count.comments, 0)
    const totalReactions = posts.reduce((sum, post) => sum + post._count.reactions, 0)
    const totalShares = posts.reduce((sum, post) => sum + (post.shareCount || 0), 0)

    return {
      posts: posts.length,
      totalViews,
      totalComments,
      totalReactions,
      totalShares,
      avgViews: avgEngagement._avg.viewCount || 0,
      avgShares: avgEngagement._avg.shareCount || 0,
      engagementRate: this.calculateEngagement(totalViews, totalComments, totalReactions, totalShares),
    }
  }

  private getStartDate(period: TimePeriod): Date {
    const now = new Date()
    switch (period) {
      case 'day':
        return startOfDay(now)
      case 'week':
        return subDays(now, 7)
      case 'month':
        return subMonths(now, 1)
      case 'quarter':
        return subMonths(now, 3)
      case 'year':
        return subYears(now, 1)
      default:
        return subDays(now, 7)
    }
  }

  private getPreviousPeriodStart(period: TimePeriod): Date {
    const now = new Date()
    switch (period) {
      case 'day':
        return subDays(startOfDay(now), 1)
      case 'week':
        return subDays(now, 14)
      case 'month':
        return subMonths(now, 2)
      case 'quarter':
        return subMonths(now, 6)
      case 'year':
        return subYears(now, 2)
      default:
        return subDays(now, 14)
    }
  }

  private async getRevenue(since: Date): Promise<number> {
    const result = await prisma.currencyTransaction.aggregate({
      where: {
        createdAt: { gte: since },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    })
    
    return Number(result._sum.amount || 0)
  }

  private async getCreatorRevenue(userId: string): Promise<number> {
    const result = await prisma.creatorPayout.aggregate({
      where: {
        userId,
        status: 'COMPLETED',
      },
      _sum: {
        finalAmount: true,
      },
    })
    
    return Number(result._sum.finalAmount || 0)
  }

  private calculateEngagement(views: number, comments: number, reactions: number, shares: number): number {
    if (views === 0) return 0
    
    const interactions = comments + reactions + shares
    return (interactions / views) * 100
  }

  private calculateCreatorEngagement(creator: any): number {
    if (!creator.stats) return 0
    
    const { totalViews, totalLikesReceived, totalCommentsReceived } = creator.stats
    
    if (totalViews === 0) return 0
    
    const interactions = totalLikesReceived + totalCommentsReceived
    return (interactions / totalViews) * 100
  }

  private async getStorageUsage(): Promise<string> {
    try {
      const result = await prisma.$queryRaw<[{ size: string }]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `
      return result[0]?.size || 'Unknown'
    } catch (error) {
      logger.error('Failed to get storage usage:', error)
      return 'Unknown'
    }
  }
}

export const analyticsService = new AnalyticsService()

```

# original file: src/server/services/system.service.ts
```ts
// src/server/services/system.service.ts
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { checkDatabaseConnection } from '@/lib/db'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  database: boolean
  redis: boolean
  timestamp: Date
  details?: Record<string, any>
}

interface SystemMetrics {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalGroups: number
  activeUsers: number
  databaseSize: string
  cacheSize: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  uptime: number
}

interface SystemInfo {
  platform: string
  arch: string
  cpuCores: number
  totalMemory: string
  nodeVersion: string
  environment: string
  hostname: string
}

interface BackgroundJob {
  name: string
  status: 'running' | 'idle' | 'failed'
  lastRun?: Date
  nextRun?: Date
  error?: string
}

export class SystemService {
  private healthCheckInterval: NodeJS.Timer | null = null
  private metricsCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60000 // 1 minute

  async getSystemHealth(): Promise<SystemHealth> {
    const [dbHealth, redisHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
    ])

    const allHealthy = dbHealth.connected && redisHealth
    
    return {
      status: allHealthy ? 'healthy' : dbHealth.connected || redisHealth ? 'degraded' : 'down',
      database: dbHealth.connected,
      redis: redisHealth,
      timestamp: new Date(),
      details: {
        database: dbHealth,
        redis: redisHealth ? { connected: true } : { connected: false },
      },
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const cacheKey = 'system-metrics'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      activeUsers,
      databaseSize,
      cacheSize,
      systemStats,
    ] = await Promise.all([
      prisma.user.count({ where: { deleted: false } }),
      prisma.post.count({ where: { deleted: false } }),
      prisma.comment.count({ where: { deleted: false } }),
      prisma.group.count({ where: { deleted: false } }),
      this.getActiveUsersCount(),
      this.getDatabaseSize(),
      this.getCacheSize(),
      this.getSystemStats(),
    ])

    const metrics: SystemMetrics = {
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      activeUsers,
      databaseSize,
      cacheSize,
      ...systemStats,
    }

    this.setCached(cacheKey, metrics)
    return metrics
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpuCores: os.cpus().length,
      totalMemory: this.formatBytes(os.totalmem()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      hostname: os.hostname(),
    }
  }

  async getBackgroundJobs(): Promise<BackgroundJob[]> {
    // This would integrate with your job queue system
    // For now, returning mock data
    return [
      {
        name: 'Email Queue',
        status: 'running',
        lastRun: new Date(Date.now() - 5 * 60 * 1000),
        nextRun: new Date(Date.now() + 5 * 60 * 1000),
      },
      {
        name: 'Analytics Aggregation',
        status: 'idle',
        lastRun: new Date(Date.now() - 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 23 * 60 * 60 * 1000),
      },
      {
        name: 'Cache Cleanup',
        status: 'running',
        lastRun: new Date(Date.now() - 10 * 60 * 1000),
        nextRun: new Date(Date.now() + 50 * 60 * 1000),
      },
      {
        name: 'Backup',
        status: 'idle',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    ]
  }

  async runHealthChecks(): Promise<Record<string, boolean>> {
    const checks: Record<string, boolean> = {}

    // Database check
    const dbHealth = await this.checkDatabaseHealth()
    checks.database = dbHealth.connected

    // Redis check
    checks.redis = await this.checkRedisHealth()

    // Disk space check
    checks.diskSpace = await this.checkDiskSpace()

    // Memory check
    checks.memory = this.checkMemory()

    // API endpoints check
    checks.api = await this.checkApiEndpoints()

    return checks
  }

  async clearCache(): Promise<void> {
    try {
      await redis.flushdb()
      this.metricsCache.clear()
      logger.info('System cache cleared')
    } catch (error) {
      logger.error('Failed to clear cache:', error)
      throw new Error('Failed to clear system cache')
    }
  }

  async optimizeDatabase(): Promise<void> {
    try {
      // Run VACUUM ANALYZE on PostgreSQL
      await prisma.$executeRawUnsafe('VACUUM ANALYZE')
      logger.info('Database optimization completed')
    } catch (error) {
      logger.error('Database optimization failed:', error)
      throw new Error('Failed to optimize database')
    }
  }

  async getErrorLogs(limit: number = 100): Promise<any[]> {
    // This would integrate with your logging system
    // For now, returning from audit log
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'SYSTEM_ACTION',
          metadata: {
            path: ['level'],
            equals: 'error',
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      })
      return logs
    } catch (error) {
      logger.error('Failed to fetch error logs:', error)
      return []
    }
  }

  async getPerformanceMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {}

    // Database query performance
    const dbStats = await this.getDatabasePerformance()
    metrics.database = dbStats

    // Redis performance
    const redisStats = await this.getRedisPerformance()
    metrics.redis = redisStats

    // API response times
    metrics.api = await this.getApiPerformance()

    // Resource usage
    metrics.resources = {
      cpu: this.getCpuUsage(),
      memory: this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
    }

    return metrics
  }

  startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth()
        if (health.status !== 'healthy') {
          logger.warn('System health degraded:', health)
        }
      } catch (error) {
        logger.error('Health check failed:', error)
      }
    }, intervalMs)
  }

  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  // Private helper methods

  private async checkDatabaseHealth(): Promise<{ connected: boolean; latency?: number; error?: string }> {
    return checkDatabaseConnection()
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      await redis.ping()
      return true
    } catch {
      return false
    }
  }

  private async checkDiskSpace(): Promise<boolean> {
    try {
      const diskUsage = await this.getDiskUsage()
      return diskUsage < 90 // Less than 90% used
    } catch {
      return false
    }
  }

  private checkMemory(): boolean {
    const usage = this.getMemoryUsage()
    return usage < 90 // Less than 90% used
  }

  private async checkApiEndpoints(): Promise<boolean> {
    // Check critical API endpoints
    try {
      await prisma.user.count({ take: 1 })
      return true
    } catch {
      return false
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return prisma.user.count({
      where: {
        deleted: false,
        lastSeenAt: { gte: fiveMinutesAgo },
      },
    })
  }

  private async getDatabaseSize(): Promise<string> {
    try {
      const result = await prisma.$queryRaw<[{ size: string }]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `
      return result[0]?.size || 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  private async getCacheSize(): Promise<string> {
    try {
      const info = await redis.info('memory')
      const match = info.match(/used_memory_human:([^\r\n]+)/)
      return match ? match[1] : 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  private async getSystemStats(): Promise<{ cpuUsage: number; memoryUsage: number; diskUsage: number; uptime: number }> {
    return {
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      diskUsage: await this.getDiskUsage(),
      uptime: process.uptime(),
    }
  }

  private getCpuUsage(): number {
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdle += cpu.times.idle
    })

    const idle = totalIdle / cpus.length
    const total = totalTick / cpus.length
    const usage = 100 - ~~(100 * idle / total)
    
    return Math.min(100, Math.max(0, usage))
  }

  private getMemoryUsage(): number {
    const total = os.totalmem()
    const free = os.freemem()
    return Math.round((1 - free / total) * 100)
  }

  private async getDiskUsage(): Promise<number> {
    try {
      if (os.platform() === 'win32') {
        return 50 // Default for Windows
      }
      
      const { stdout } = await execAsync("df -h / | awk 'NR==2 {print $(NF-1)}'")
      return parseInt(stdout.trim().replace('%', ''), 10)
    } catch {
      return 50 // Default value
    }
  }

  private async getDatabasePerformance(): Promise<any> {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC 
        LIMIT 10
      `
      return result
    } catch {
      return []
    }
  }

  private async getRedisPerformance(): Promise<any> {
    try {
      const info = await redis.info('stats')
      const stats: Record<string, string> = {}
      
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':')
        if (key && value) {
          stats[key] = value
        }
      })
      
      return stats
    } catch {
      return {}
    }
  }

  private async getApiPerformance(): Promise<any> {
    // This would integrate with your APM system
    // For now, returning mock data
    return {
      avgResponseTime: 45,
      p95ResponseTime: 120,
      p99ResponseTime: 250,
      requestsPerSecond: 150,
    }
  }

  private getCached<T>(key: string): T | null {
    const cached = this.metricsCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T
    }
    return null
  }

  private setCached(key: string, data: any): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let unitIndex = 0
    let value = bytes

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex++
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`
  }
}

export const systemService = new SystemService()

```

# original file: src/server/services/watch-party.service.ts
```ts
// src/server/services/watch-party.service.ts
import { PrismaClient, EventStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NotificationService } from './notification.service'
import { generateSecureToken } from '@/lib/security'

export class WatchPartyService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async createWatchParty(input: {
    title: string
    description?: string
    youtubeVideoId: string
    scheduledStart: Date
    maxParticipants: number
    isPublic: boolean
    hostId: string
  }) {
    // Generate unique party code
    const partyCode = generateSecureToken(6).toUpperCase()

    const watchParty = await this.db.watchParty.create({
      data: {
        ...input,
        partyCode,
        youtubeVideoUrl: `https://youtube.com/watch?v=${input.youtubeVideoId}`,
        currentParticipants: 1, // Host counts as participant
      },
      include: {
        host: {
          include: {
            profile: true,
          },
        },
        video: true,
      },
    })

    // Add host as participant
    await this.db.watchPartyParticipant.create({
      data: {
        partyId: watchParty.id,
        userId: input.hostId,
        role: 'host',
      },
    })

    // Notify followers if public
    if (input.isPublic) {
      const followers = await this.db.follow.findMany({
        where: { followingId: input.hostId },
        select: { followerId: true },
      })

      for (const follower of followers) {
        await this.notificationService.createNotification({
          type: 'WATCH_PARTY_INVITE',
          userId: follower.followerId,
          actorId: input.hostId,
          entityId: watchParty.id,
          entityType: 'watchParty',
          title: 'Watch Party Starting Soon',
          message: `is hosting "${watchParty.title}"`,
          actionUrl: `/watch-party/${watchParty.id}`,
        })
      }
    }

    return watchParty
  }

  async joinParty(partyId: string, userId: string) {
    const party = await this.db.watchParty.findUnique({
      where: { id: partyId },
      include: { participants: true },
    })

    if (!party) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Watch party not found',
      })
    }

    if (party.currentParticipants >= party.maxParticipants) {
      throw new TRPCError({
        code: 'RESOURCE_EXHAUSTED',
        message: 'Watch party is full',
      })
    }

    // Check if already participant
    const existing = party.participants.find(p => p.userId === userId)
    if (existing) {
      return existing
    }

    // Add participant
    const participant = await this.db.watchPartyParticipant.create({
      data: {
        partyId,
        userId,
        role: 'viewer',
      },
    })

    // Update participant count
    await this.db.watchParty.update({
      where: { id: partyId },
      data: { currentParticipants: { increment: 1 } },
    })

    return participant
  }

  async getUpcomingParties(params: {
    limit: number
    cursor?: string
  }) {
    const parties = await this.db.watchParty.findMany({
      where: {
        isPublic: true,
        scheduledStart: { gte: new Date() },
        cancelledAt: null,
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { scheduledStart: 'asc' },
      include: {
        host: {
          include: {
            profile: true,
          },
        },
        video: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    let nextCursor: string | undefined = undefined
    if (parties.length > params.limit) {
      const nextItem = parties.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: parties,
      nextCursor,
    }
  }
}

```

