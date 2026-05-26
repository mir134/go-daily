import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  login as apiLogin,
  logout as apiLogout,
  checkAuthStatus,
} from '../api/client'

interface AuthContextValue {
  isAuthenticated: boolean
  loading: boolean
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
      .then((authenticated) => {
        setIsAuthenticated(authenticated)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = useCallback(async (password: string) => {
    await apiLogin(password)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}