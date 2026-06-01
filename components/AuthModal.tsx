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
<<<<<<< Updated upstream
    onAuthSuccess: (email: string) => Promise<void>;
=======
    onAuthSuccess: (uid: string, email: string) => Promise<void>;
    hasGuestAnalysis?: boolean;
>>>>>>> Stashed changes
}

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    initialMode,
    onClose,
    onAuthSuccess,
    hasGuestAnalysis = false
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
<<<<<<< Updated upstream
        } catch (err) {
            setAuthError("An unexpected error occurred.");
=======
        } catch (err: any) {
            setAuthError(err?.message || "An unexpected error occurred. Check console for details.");
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        } catch (err) {
            setAuthError("An unexpected error occurred during Google Login.");
=======
        } catch (err: any) {
            setAuthError(err?.message || "An unexpected error occurred during Google Login.");
>>>>>>> Stashed changes
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
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white/95 backdrop-blur-lg border border-zinc-200/80 rounded-2xl p-7 max-w-sm w-full shadow-2xl relative text-left">
                <button
                    onClick={handleClose}
                    className="absolute top-4.5 right-4.5 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer bg-transparent border-0"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-zinc-900 mb-1.5">
                        {authMode === 'login' 
                            ? 'Welcome Back' 
                            : hasGuestAnalysis 
                                ? 'Save Your Analysis' 
                                : 'Create Account'}
                    </h2>
                    <p className="text-zinc-500 text-xs font-light leading-relaxed">
                        {authMode === 'login'
                            ? 'Enter your credentials to access your career roadmap.'
                            : hasGuestAnalysis
                                ? 'Sign up for a free account to save your resume analysis, unlock your custom learning plan, and start interview practice.'
                                : 'Join CareerPilot to start tracking your readiness score.'}
                    </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-0.5">Email Address</label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
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
                              className={`w-full bg-white/60 border rounded-xl p-2.5 pl-10 text-xs text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder-zinc-400 shadow-sm ${emailError ? 'border-red-400' : 'border-zinc-200/80'}`}
                              placeholder="you@example.com"
                           />
                        </div>
                        {emailError && (
                           <p className="text-red-500 text-[10px] mt-1 ml-0.5">{emailError}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-0.5">Password</label>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                           <input
                              type="password"
                              required
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              className="w-full bg-white/60 border border-zinc-200/80 rounded-xl p-2.5 pl-10 text-xs text-zinc-800 outline-none focus:border-zinc-400 focus:bg-white transition-all placeholder-zinc-400 shadow-sm"
                              placeholder="••••••••"
                           />
                        </div>
                        {authMode === 'signup' && (
                           <div className="mt-2.5 text-[10px] text-zinc-400 space-y-0.5 ml-0.5">
                              <p className="text-zinc-500 font-bold mb-1 uppercase tracking-wider">Password Requirements:</p>
                              <p className={passwordInput.length >= 8 ? 'text-zinc-800 font-medium' : 'text-zinc-400 font-light'}>• Minimum 8 characters</p>
                              <p className={/\d/.test(passwordInput) ? 'text-zinc-800 font-medium' : 'text-zinc-400 font-light'}>• At least one number (0-9)</p>
                              <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordInput) ? 'text-zinc-800 font-medium' : 'text-zinc-400 font-light'}>• At least one special character (!@#...)</p>
                           </div>
                        )}
                        {authMode === 'login' && (
                           <div className="flex justify-end mt-1.5 ml-0.5">
                              <button
                                 type="button"
                                 onClick={handleForgotPassword}
                                 className="text-[10px] text-zinc-500 hover:text-zinc-900 transition-colors bg-transparent border-0 cursor-pointer"
                              >
                                 Forgot Password?
                              </button>
                           </div>
                        )}
                    </div>

                    {authError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center space-x-2 text-red-800 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                            <span>{authError}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm border-0 cursor-pointer"
                    >
                        {isAuthLoading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span className="text-xs">{authMode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                            </>
                        ) : (
                            <>
                                {authMode === 'login' ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                                <span className="text-xs font-bold">{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                            </>
                        )}
                    </button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-white px-2 text-zinc-400">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200/80 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                        <span className="text-xs font-bold">Google</span>
                    </button>
                </form>

                <div className="mt-5 pt-5 border-t border-zinc-200 text-center">
                    <button
                        onClick={() => {
                            setAuthMode(authMode === 'login' ? 'signup' : 'login');
                            setAuthError('');
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold transition-colors bg-transparent border-0 cursor-pointer"
                    >
                        {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
};
