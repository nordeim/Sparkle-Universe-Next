// Component Prop Types
// Generated on 2025-08-23T16:03:08.079Z

import { ReactNode, CSSProperties, MouseEvent, KeyboardEvent, FocusEvent } from 'react'

// Base component props
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  id?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  children?: ReactNode;
}

// Button component props (matching shadcn/ui)
export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'sparkle' | 'glow';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Card component props
export interface CardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  header?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  padding?: boolean | string | number;
}

// Input component props
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time';
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string | boolean;
  label?: string;
  helpText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// Modal/Dialog props
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

// Table props
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  rowKey?: keyof T | ((row: T) => string | number);
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

// Select component props
export interface SelectOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps<T = any> extends BaseComponentProps {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  label?: string;
  helpText?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
}

// Toast props
export interface ToastProps {
  id?: string;
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Avatar props
export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  fallback?: string | ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
}

// Badge props
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

// Progress props
export interface ProgressProps extends BaseComponentProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}
