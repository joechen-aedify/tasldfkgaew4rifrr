import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import './Login.css'

/**
 * Login component with email and password authentication
 * Validates input and handles authentication flow
 */
const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    useTheme() // Apply theme

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true })
        }
    }, [isAuthenticated, navigate])

    /**
     * Handle form submission
     * Validates credentials and navigates to dashboard on success
     */
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const success = await login(email, password)

            if (success) {
                navigate('/dashboard', { replace: true })
            } else {
                setError('Invalid email or password. Please try again.')
            }
        } catch (err) {
            setError('An error occurred during login. Please try again.')
            console.error('Login error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Welcome Backs</h1>
                    <p className="login-subtitle">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="login-field">
                        <label htmlFor="email" className="login-label">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            placeholder="Enter your email"
                            required
                            autoComplete="email"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password" className="login-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            disabled={isLoading}
                            minLength={1}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading || !email || !password}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="login-footer">
                        <p className="login-footer-text">
                            Don't have an account?{' '}
                            <Link to="/signup" className="login-link">
                                Create one here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login

