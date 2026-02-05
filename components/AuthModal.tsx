import React, { useState } from 'react';
import {
    AlertCircle,
    Loader2,
    Lock,
    LogIn,
    Mail,
    UserPlus,
    X
} from 'lucide-react';
import { AuthService } from '../services/authService';

interface AuthModalProps {
    isOpen: boolean;
    initialMode: 'login' | 'signup';
    onClose: () => void;
    onAuthSuccess: (email: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    initialMode,
    onClose,
    onAuthSuccess
}) => {
    // Form State
    const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [emailError, setEmailError] = useState('');
    const [authError, setAuthError] = useState('');
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    // Reset mode when initialMode changes
    React.useEffect(() => {
        setAuthMode(initialMode);
    }, [initialMode]);

    const handleClose = () => {
        setAuthError('');
        setEmailInput('');
        setPasswordInput('');
        setEmailError('');
        onClose();
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        // Empty field validation
        if (!emailInput.trim()) {
            setAuthError('Please enter your email address.');
            return;
        }
        if (!passwordInput) {
            setAuthError('Please enter your password.');
            return;
        }

        // Format validation
        if (!AuthService.isValidEmail(emailInput)) {
            setAuthError('Please enter a valid email address (e.g., you@example.com).');
            return;
        }
        // Password format validation only for signup (login validates against database)
        if (authMode === 'signup' && !AuthService.isValidPassword(passwordInput)) {
            const errors = AuthService.getPasswordValidationErrors(passwordInput);
            setAuthError('Password requirements: ' + errors.join(', '));
            return;
        }

        setIsAuthLoading(true);
        try {
            if (authMode === 'signup') {
                const result = await AuthService.signup(emailInput, passwordInput);
                if (result.success) {
                    // Auto login after signup
                    await onAuthSuccess(emailInput);
                    handleClose();
                } else {
                    setAuthError(result.message || 'Signup failed.');
                }
            } else {
                const result = await AuthService.login(emailInput, passwordInput);
                if (result.success) {
                    await onAuthSuccess(emailInput);
                    handleClose();
                } else {
                    setAuthError(result.message || 'Login failed.');
                }
            }
        } catch (err) {
            setAuthError("An unexpected error occurred.");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await AuthService.loginWithGoogle();
            if (result.success && result.email) {
                await onAuthSuccess(result.email);
                handleClose();
            } else {
                setAuthError(result.message || 'Google Login failed.');
            }
        } catch (err) {
            setAuthError("An unexpected error occurred during Google Login.");
        }
    };

    const handleForgotPassword = async () => {
        if (!emailInput) {
            setAuthError("Please enter your email address to reset password.");
            return;
        }
        const result = await AuthService.resetPassword(emailInput);
        alert(result.message);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        {authMode === 'login'
                            ? 'Enter your credentials to access your career plan.'
                            : 'Join CareerPilot to start your journey.'}
                    </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                            <input
                                type="email"
                                required
                                value={emailInput}
                                onChange={(e) => {
                                    setEmailInput(e.target.value);
                                    if (emailError && AuthService.isValidEmail(e.target.value)) {
                                        setEmailError('');
                                    }
                                }}
                                onBlur={() => {
                                    if (emailInput.trim() && !AuthService.isValidEmail(emailInput)) {
                                        setEmailError('Please enter a valid email address');
                                    } else {
                                        setEmailError('');
                                    }
                                }}
                                className={`w-full bg-zinc-900 border rounded-xl p-3 pl-10 text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-zinc-600 ${emailError ? 'border-red-500' : 'border-zinc-800'}`}
                                placeholder="you@example.com"
                            />
                        </div>
                        {emailError && (
                            <p className="text-red-400 text-xs mt-1 ml-1">{emailError}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                            <input
                                type="password"
                                required
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-10 text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-zinc-600"
                                placeholder="••••••••"
                            />
                        </div>
                        {authMode === 'signup' && (
                            <div className="mt-2 text-xs text-zinc-500 space-y-0.5">
                                <p className="text-zinc-400 font-medium mb-1">Password requirements:</p>
                                <p className={passwordInput.length >= 8 ? 'text-emerald-400' : ''}>• Minimum 8 characters</p>
                                <p className={/\d/.test(passwordInput) ? 'text-emerald-400' : ''}>• At least one number (0-9)</p>
                                <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordInput) ? 'text-emerald-400' : ''}>• At least one special character (!@#$%^&*...)</p>
                            </div>
                        )}
                        {authMode === 'login' && (
                            <div className="flex justify-end mt-2">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}
                    </div>

                    {authError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{authError}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isAuthLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{authMode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                            </>
                        ) : (
                            <>
                                {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                            </>
                        )}
                    </button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0a0a0a] px-2 text-zinc-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-zinc-900 font-semibold py-3 rounded-xl transition-all hover:bg-zinc-100 flex items-center justify-center space-x-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span>Google</span>
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                    <button
                        onClick={() => {
                            setAuthMode(authMode === 'login' ? 'signup' : 'login');
                            setAuthError('');
                        }}
                        className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
                    >
                        {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
};
