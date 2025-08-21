// src/components/admin/bulk-action-dialog.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Mail,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { UserRole } from '@prisma/client'

type BulkActionType = 'email' | 'role' | 'verify' | 'ban' | 'unban' | 'delete'

interface BulkActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: BulkActionType
  selectedCount: number
  onConfirm: (params: any) => void
}

const actionConfig: Record<BulkActionType, {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'destructive' | 'warning'
  requiresReason: boolean
  requiresParams: boolean
}> = {
  email: {
    title: 'Send Bulk Email',
    description: 'Send an email notification to selected users',
    icon: Mail,
    variant: 'default',
    requiresReason: false,
    requiresParams: true,
  },
  role: {
    title: 'Change User Role',
    description: 'Update the role for selected users',
    icon: Shield,
    variant: 'warning',
    requiresReason: true,
    requiresParams: true,
  },
  verify: {
    title: 'Verify Users',
    description: 'Mark selected users as verified',
    icon: UserCheck,
    variant: 'default',
    requiresReason: false,
    requiresParams: false,
  },
  ban: {
    title: 'Ban Users',
    description: 'Ban selected users from the platform',
    icon: Ban,
    variant: 'destructive',
    requiresReason: true,
    requiresParams: true,
  },
  unban: {
    title: 'Unban Users',
    description: 'Remove ban from selected users',
    icon: UserCheck,
    variant: 'default',
    requiresReason: false,
    requiresParams: false,
  },
  delete: {
    title: 'Delete Users',
    description: 'Permanently delete selected users and their content',
    icon: Trash2,
    variant: 'destructive',
    requiresReason: true,
    requiresParams: true,
  },
}

export function BulkActionDialog({
  open,
  onOpenChange,
  action,
  selectedCount,
  onConfirm,
}: BulkActionDialogProps) {
  const [reason, setReason] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('USER')
  const [deleteContent, setDeleteContent] = useState(false)
  const [banDuration, setBanDuration] = useState('permanent')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const config = actionConfig[action]
  const Icon = config.icon

  const handleConfirm = async () => {
    setIsProcessing(true)
    
    const params: any = {
      action,
      reason: config.requiresReason ? reason : undefined,
    }

    switch (action) {
      case 'email':
        params.subject = emailSubject
        params.content = emailContent
        break
      case 'role':
        params.newRole = newRole
        break
      case 'ban':
        params.duration = banDuration
        break
      case 'delete':
        params.deleteContent = deleteContent
        break
    }

    try {
      await onConfirm(params)
      onOpenChange(false)
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const isValid = () => {
    if (config.requiresReason && !reason.trim()) return false
    
    switch (action) {
      case 'email':
        return emailSubject.trim() && emailContent.trim()
      case 'delete':
        return confirmDelete
      default:
        return true
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${
              config.variant === 'destructive' ? 'text-red-500' :
              config.variant === 'warning' ? 'text-yellow-500' :
              'text-blue-500'
            }`} />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description} for {selectedCount} user{selectedCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Action-specific fields */}
          {action === 'email' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <input
                  id="subject"
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter email content..."
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={5}
                />
              </div>
            </>
          )}
          
          {action === 'role' && (
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="CREATOR">Creator</SelectItem>
                  <SelectItem value="VERIFIED_CREATOR">Verified Creator</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {action === 'ban' && (
            <div className="space-y-2">
              <Label>Ban Duration</Label>
              <RadioGroup value={banDuration} onValueChange={setBanDuration}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="24h" id="24h" />
                  <Label htmlFor="24h">24 hours</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7d" id="7d" />
                  <Label htmlFor="7d">7 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30d" id="30d" />
                  <Label htmlFor="30d">30 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="permanent" id="permanent" />
                  <Label htmlFor="permanent">Permanent</Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          {action === 'delete' && (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. Users and their data will be permanently deleted.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deleteContent"
                  checked={deleteContent}
                  onCheckedChange={(checked) => setDeleteContent(checked as boolean)}
                />
                <Label htmlFor="deleteContent">
                  Also delete all content created by these users
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmDelete"
                  checked={confirmDelete}
                  onCheckedChange={(checked) => setConfirmDelete(checked as boolean)}
                />
                <Label htmlFor="confirmDelete" className="text-red-600">
                  I understand this action is permanent and irreversible
                </Label>
              </div>
            </>
          )}
          
          {/* Reason field */}
          {config.requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason {action === 'delete' && '(for audit log)'}
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          {/* Summary */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Summary</AlertTitle>
            <AlertDescription>
              This action will affect {selectedCount} user{selectedCount !== 1 ? 's' : ''}.
              {action === 'delete' && deleteContent && ' All their content will also be deleted.'}
              {action === 'ban' && ` They will be banned for ${banDuration === 'permanent' ? 'permanently' : banDuration}.`}
              {action === 'role' && ` Their role will be changed to ${newRole}.`}
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant={config.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={!isValid() || isProcessing}
          >
            {isProcessing ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {action === 'delete' ? 'Delete' : 'Confirm'} {selectedCount} User{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
