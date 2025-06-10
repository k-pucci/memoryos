// components/ThemeProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

// Provide default values to avoid the "must be used within a Provider" error
const defaultThemeContext: ThemeContextType = {
  theme: 'dark',
  toggleTheme: () => {}
}

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true)
    try {
      const storedTheme = localStorage.getItem('theme') as Theme | null
      
      if (storedTheme) {
        setTheme(storedTheme)
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light')
      }
    } catch (error) {
      // Handle localStorage errors (e.g., in environments where it's not available)
      console.error("Failed to access localStorage:", error)
    }
  }, [])

  // Update HTML class when theme changes
  useEffect(() => {
    if (!mounted) return
    
    try {
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      localStorage.setItem('theme', theme)
    } catch (error) {
      console.error("Failed to update theme:", error)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}