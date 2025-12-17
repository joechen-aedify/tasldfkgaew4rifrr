import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { loadConfig } from '../config'
import { getApiUrl } from '../utils/api'

/**
 * Authentication context interface
 */
interface AuthContextType {
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<boolean>
    signup: (email: string, password: string) => Promise<boolean>
    logout: () => void
    user: { email: string } | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication provider component
 * Manages authentication state and provides auth methods to children
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        // Check if user is already logged in (from localStorage)
        const token = localStorage.getItem('userToken')
        const userData = localStorage.getItem('userData')
        return !!(token && userData)
    })

    const [user, setUser] = useState<{ email: string } | null>(() => {
        const userData = localStorage.getItem('userData')
        if (userData) {
            try {
                return JSON.parse(userData)
            } catch {
                return null
            }
        }
        return null
    })

    /**
     * Login function - authenticates user via API and sets authentication state
     * @param email - User email address
     * @param password - User password
     * @returns Promise resolving to true if login successful, false otherwise
     */
    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // Basic validation
            if (!email || !password) {
                return false
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                return false
            }

            // Call local AUTH module API (using VITE_API_URL from .env)
            const response = await fetch(getApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.message || errorData.error || response.statusText
                console.error('Login failed:', errorMessage)
                // Store error message for potential display (could be enhanced with error state)
                return false
            }

            const data = await response.json()
            const token = data.token
            const userData = { email: data.user?.email || email }

            // Store authentication data
            localStorage.setItem('userToken', token)
            localStorage.setItem('userData', JSON.stringify(userData))

            setIsAuthenticated(true)
            setUser(userData)

            return true
        } catch (error) {
            console.error('Login error:', error)
            return false
        }
    }

    /**
     * Signup function - registers new user via API and sets authentication state
     * @param email - User email address
     * @param password - User password
     * @returns Promise resolving to true if signup successful, false otherwise
     */
    const signup = async (email: string, password: string): Promise<boolean> => {
        try {
            // Basic validation
            if (!email || !password) {
                return false
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                return false
            }

            // Password strength validation (minimum 8 characters, uppercase, lowercase, number)
            if (password.length < 8) {
                return false
            }

            const hasUpperCase = /[A-Z]/.test(password)
            const hasLowerCase = /[a-z]/.test(password)
            const hasNumber = /[0-9]/.test(password)

            if (!hasUpperCase || !hasLowerCase || !hasNumber) {
                return false
            }

            // Call local AUTH module API (using VITE_API_URL from .env)
            const response = await fetch(getApiUrl('/api/auth/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.message || errorData.error || response.statusText
                console.error('Signup failed:', errorMessage)
                // Store error message for potential display (could be enhanced with error state)
                return false
            }

            const data = await response.json()
            const userData = { email: data.user?.email || email }

            // After successful registration, automatically log in
            // Call login API to get token
            const loginResponse = await fetch(getApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            })

            if (!loginResponse.ok) {
                console.warn('User registered but auto-login failed')
                return false
            }

            const loginData = await loginResponse.json()
            const token = loginData.token

            // Store authentication data
            localStorage.setItem('userToken', token)
            localStorage.setItem('userData', JSON.stringify(userData))

            setIsAuthenticated(true)
            setUser(userData)

            return true
        } catch (error) {
            console.error('Signup error:', error)
            return false
        }
    }

    /**
     * Logout function - clears authentication state and storage
     */
    const logout = () => {
        localStorage.removeItem('userToken')
        localStorage.removeItem('userData')
        setIsAuthenticated(false)
        setUser(null)
    }

    // Auto-login with testing account on mount if not already authenticated
    useEffect(() => {
        const autoLogin = async () => {
            // Check if already authenticated
            const token = localStorage.getItem('userToken')
            const userData = localStorage.getItem('userData')
            if (token && userData) {
                return // Already logged in
            }

            try {
                const config = await loadConfig()
                const authModule = config.defaultModules?.find((m: any) => m.name === 'authentication')
                const testingAccount = authModule?.testingAccount

                if (testingAccount?.email && testingAccount?.password) {
                    // Auto-login with testing account via local API
                    const response = await fetch(getApiUrl('/api/auth/login'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: testingAccount.email,
                            password: testingAccount.password,
                        }),
                    })

                    if (response.ok) {
                        const data = await response.json()
                        const token = data.token
                        const userData = { email: data.user?.email || testingAccount.email }

                        // Store authentication data
                        localStorage.setItem('userToken', token)
                        localStorage.setItem('userData', JSON.stringify(userData))

                        setIsAuthenticated(true)
                        setUser(userData)
                        console.log('Auto-logged in with testing account:', testingAccount.email)
                    } else {
                        console.warn('Auto-login failed:', await response.text())
                    }
                }
            } catch (error) {
                console.warn('Failed to auto-login with testing account:', error)
            }
        }

        autoLogin()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run once on mount

    // Sync authentication state with localStorage changes
    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('userToken')
            const userData = localStorage.getItem('userData')
            const authenticated = !!(token && userData)

            setIsAuthenticated(authenticated)
            if (authenticated && userData) {
                try {
                    setUser(JSON.parse(userData))
                } catch {
                    setUser(null)
                }
            } else {
                setUser(null)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, signup, logout, user }}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Hook to access authentication context
 * @returns AuthContextType with authentication state and methods
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

