// src/hooks/use-toast.ts
import { toast } from 'sonner'
export { toast as useToast }

// src/hooks/use-debounce.ts
import { useEffect, useState } from 'react'
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}
