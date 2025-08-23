// Component Prop Types
// Generated on 2025-08-23T06:58:20.009Z

import { ReactNode, CSSProperties, MouseEvent, KeyboardEvent, FocusEvent, ChangeEvent } from 'react'

// Base component props
export interface BaseComponentProps {
  className?: string
  style?: CSSProperties
  id?: string
  'data-testid'?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-hidden'?: boolean
}

// Interactive component props
export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean
  loading?: boolean
  onClick?: (event: MouseEvent<HTMLElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
  onFocus?: (event: FocusEvent<HTMLElement>) => void
  onBlur?: (event: FocusEvent<HTMLElement>) => void
  tabIndex?: number
}

// Form component props
export interface FormComponentProps<T = any> extends InteractiveComponentProps {
  name?: string
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  onSubmit?: (value: T) => void
  error?: string
  required?: boolean
  placeholder?: string
  label?: string
  helpText?: string
}

// Layout component props
export interface LayoutComponentProps extends BaseComponentProps {
  children?: ReactNode
  as?: keyof JSX.IntrinsicElements
  gap?: number | string
  padding?: number | string
  margin?: number | string
  direction?: 'row' | 'column'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}

// Modal/Dialog props
export interface ModalProps extends BaseComponentProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  footer?: ReactNode
}

// Table component props
export interface TableColumn<T = any> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T, index: number) => ReactNode
  headerRender?: () => ReactNode
  className?: string
  headerClassName?: string
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T, index: number) => void
  rowKey?: keyof T | ((row: T) => string | number)
  selectedRows?: T[]
  onSelectionChange?: (rows: T[]) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  sorting?: {
    sortBy?: keyof T | string
    sortOrder?: 'asc' | 'desc'
    onSort: (column: keyof T | string) => void
  }
}

// Chart component props
export interface ChartProps extends BaseComponentProps {
  data: any[]
  type?: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar'
  width?: number | string
  height?: number | string
  colors?: string[]
  showLegend?: boolean
  showTooltip?: boolean
  showGrid?: boolean
  animate?: boolean
  responsive?: boolean
}

// Card component props
export interface CardProps extends BaseComponentProps {
  children?: ReactNode
  title?: string
  subtitle?: string
  header?: ReactNode
  footer?: ReactNode
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  padding?: boolean | number | string
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
}

// Button component props
export interface ButtonProps extends InteractiveComponentProps {
  children?: ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  type?: 'button' | 'submit' | 'reset'
}

// Input component props
export interface InputProps extends FormComponentProps<string> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  prefix?: string
  suffix?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  autoComplete?: string
  autoFocus?: boolean
  readOnly?: boolean
}

// Select component props
export interface SelectOption<T = any> {
  value: T
  label: string
  disabled?: boolean
  group?: string
}

export interface SelectProps<T = any> extends FormComponentProps<T> {
  options: SelectOption<T>[]
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  loadingText?: string
  noOptionsText?: string
  onSearch?: (query: string) => void
}

// Toast/Notification props
export interface ToastProps {
  id?: string
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  closable?: boolean
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}