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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type UserFilter = 'all' | 'active' | 'verified' | 'banned' | 'admin' | 'new'
type SortField = 'username' | 'email' | 'createdAt' | 'level' | 'posts' | 'followers'
type SortOrder = 'asc' | 'desc'
type BulkActionType = 'email' | 'role' | 'delete' | 'verify' | 'ban' | 'unban'

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
    action: BulkActionType
    users: string[]
  }>({ open: false, action: 'email', users: [] })
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

  const { data, isLoading, refetch } = api.admin.getUsers.useQuery({
    search: debouncedSearch,
    filter,
    sortField,
    sortOrder,
    page,
    limit: 50,
  })

  const banUser = api.admin.banUser.useMutation({
    onSuccess: () => {
      toast.success('User banned successfully')
      refetch()
    },
  })

  const unbanUser = api.admin.unbanUser.useMutation({
    onSuccess: () => {
      toast.success('User unbanned successfully')
      refetch()
    },
  })

  const verifyUser = api.admin.verifyUser.useMutation({
    onSuccess: () => {
      toast.success('User verified successfully')
      refetch()
    },
  })

  const updateUserRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success('User role updated successfully')
      refetch()
    },
  })

  const deleteUser = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success('User deleted successfully')
      refetch()
    },
  })

  const sendEmail = api.admin.sendUserEmail.useMutation({
    onSuccess: () => {
      toast.success('Email sent successfully')
    },
  })

  const bulkAction = api.admin.bulkUserAction.useMutation({
    onSuccess: () => {
      toast.success('Bulk action completed successfully')
      setSelectedUsers({})
      refetch()
    },
  })

  const selectedUserIds = useMemo(
    () => Object.keys(selectedUsers).filter(id => selectedUsers[id]),
    [selectedUsers]
  )

  const allUsersSelected = useMemo(
    () => data?.users?.length ? data.users.length > 0 && data.users.every(user => selectedUsers[user.id]) : false,
    [data?.users, selectedUsers]
  )

  const someUsersSelected = useMemo(
    () => data?.users?.some(user => selectedUsers[user.id]) && !allUsersSelected,
    [data?.users, selectedUsers, allUsersSelected]
  )

  const handleSelectAll = useCallback(() => {
    if (allUsersSelected) {
      setSelectedUsers({})
    } else {
      const newSelected: SelectedUsers = {}
      data?.users?.forEach(user => {
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

  const handleBulkAction = useCallback((action: BulkActionType) => {
    if (selectedUserIds.length === 0) {
      toast.error('No users selected', {
        description: 'Please select at least one user to perform this action.',
      })
      return
    }

    setBulkActionDialog({
      open: true,
      action,
      users: selectedUserIds,
    })
  }, [selectedUserIds])

  const executeBulkAction = useCallback(async (action: BulkActionType, params?: any) => {
    await bulkAction.mutateAsync({
      action,
      userIds: bulkActionDialog.users,
      params,
    })
    setBulkActionDialog({ open: false, action: 'email', users: [] })
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

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: { label: 'Admin', className: 'bg-red-500 text-white' },
      MODERATOR: { label: 'Moderator', className: 'bg-orange-500 text-white' },
      CREATOR: { label: 'Creator', className: 'bg-purple-500 text-white' },
      VERIFIED_CREATOR: { label: 'Verified Creator', className: 'bg-purple-600 text-white' },
      SYSTEM: { label: 'System', className: 'bg-gray-800 text-white' },
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
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, permissions, and account settings
        </p>
      </div>

      <UserAnalytics />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-[300px]"
                />
              </div>

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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allUsersSelected}
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
                ) : !data?.users || data.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No users found matching your criteria
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.users.map((user) => (
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
                            
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            {['USER', 'CREATOR', 'VERIFIED_CREATOR', 'MODERATOR', 'ADMIN', 'SYSTEM'].map(role => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => updateUserRole.mutate({
                                  userId: user.id,
                                  role: role as any
                                })}
                                disabled={user.role === role}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Make {role.toLowerCase().replace('_', ' ')}
                              </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator />
                            
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
                                  reason: 'Manual ban by admin',
                                  deleteContent: false
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

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {data.users?.length || 0} of {data.totalCount} users
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

      {selectedUser && (
        <UserDetailsDialog
          user={data?.users?.find(u => u.id === selectedUser)}
          onClose={() => setSelectedUser(null)}
          onAction={(action: any, params: any) => {
            refetch()
          }}
        />
      )}

      <BulkActionDialog
        open={bulkActionDialog.open}
        action={bulkActionDialog.action}
        userCount={bulkActionDialog.users.length}
        onConfirm={executeBulkAction}
        onCancel={() => setBulkActionDialog({ open: false, action: 'email', users: [] })}
      />
    </div>
  )
}
