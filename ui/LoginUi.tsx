"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaLock, FaGoogle, FaUser, FaPaperPlane, FaEye, FaEyeSlash, FaCheckCircle, FaCircle, FaArrowLeft } from 'react-icons/fa';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail 
} from 'firebase/auth';
import toast from 'react-hot-toast';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasNumber;

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found': return 'No account found with this email.';
      case 'auth/wrong-password': return 'Incorrect password. Try again.';
      case 'auth/invalid-email': return 'That email address is not valid.';
      case 'auth/email-already-in-use': return 'This email is already registered.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/too-many-requests': return 'Too many failed attempts. Try later.';
      default: return 'Authentication failed. Please check your details.';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !isPasswordValid) {
      toast.error("Please meet all password requirements.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setNeedsVerification(true);
          setLoading(false);
          return;
        }
        toast.success('Welcome back!');
        router.push(returnTo);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await sendEmailVerification(userCredential.user);
        setNeedsVerification(true);
        toast.success('Verification email sent!');
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);

    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login', 
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      
      toast.success("Reset link sent! Check your inbox.", {
        duration: 5000,
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success('New link sent to your inbox!');
    } catch (error: any) {
      toast.error('Wait a moment before resending.');
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Successfully signed in!');
      router.push(returnTo);
    } catch (error: any) {
      toast.error(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {needsVerification ? (
        <motion.div
          key="verification"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaPaperPlane className="text-orange-500 text-2xl animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">Verify Email</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-8">
            We've sent a secure link to <span className="text-white font-bold">{email}</span>. 
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleResendLink}
              className="w-full py-2.5 md:py-3 border border-zinc-800 rounded-lg text-orange-500 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all"
            >
              Resend Link
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-zinc-500 text-[9px] uppercase font-bold tracking-widest hover:text-white transition-colors"
            >
              I've verified, let me in
            </button>
            <button
              onClick={() => setNeedsVerification(false)}
              className="flex items-center justify-center gap-2 w-full text-zinc-600 text-[9px] uppercase font-bold tracking-widest hover:text-orange-500 transition-colors pt-2"
            >
              <FaArrowLeft size={10} /> Change Email / Go Back
            </button>
          </div>
        </motion.div>
      ) : isForgotPassword ? (
        <motion.div
          key="forgot-password"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <div className="mb-6">
            <button 
              onClick={() => setIsForgotPassword(false)}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest"
            >
              <FaArrowLeft /> Back to Login
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">Reset Pass</h2>
            <p className="mt-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Enter email to receive recovery link</p>
          </div>
          <form className="mt-6 space-y-5" onSubmit={handleResetPassword}>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                <FaEnvelope className="h-3.5 w-3.5 text-zinc-600 group-focus-within:text-orange-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 md:py-3 bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="EMAIL ADDRESS"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          key="auth-form"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <div className="text-center">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">{isLogin ? 'Sign In' : 'Join Us'}</h2>
            <p className="mt-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {isLogin ? "Need an account? " : "Already a member? "}
              <button onClick={() => { setIsLogin(!isLogin); setPassword(''); }} className="text-orange-500 hover:text-orange-400 transition-colors">
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
          <form className="mt-4 space-y-5" onSubmit={handleEmailAuth}>
            <div className="space-y-4">
              {!isLogin && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <FaUser className="h-3.5 w-3.5 text-zinc-600 group-focus-within:text-orange-500" />
                  </div>
                  <input type="text" required={!isLogin} value={name} onChange={(e) => setName(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 md:py-3 bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all" placeholder="FULL NAME" />
                </div>
              )}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                  <FaEnvelope className="h-3.5 w-3.5 text-zinc-600 group-focus-within:text-orange-500" />
                </div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 md:py-3 bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all" placeholder="EMAIL ADDRESS" />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                  <FaLock className="h-3.5 w-3.5 text-zinc-600 group-focus-within:text-orange-500" />
                </div>
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 md:py-3 bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all" placeholder="PASSWORD" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              {isLogin && (
                <div className="flex justify-end px-1">
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[9px] text-zinc-500 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors">Forgot Password?</button>
                </div>
              )}
              {!isLogin && password.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-2 space-y-2">
                  <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-wider">
                    {hasMinLength ? <FaCheckCircle className="text-emerald-500" /> : <FaCircle className="text-zinc-800" />}
                    <span className={hasMinLength ? "text-emerald-500" : "text-zinc-500"}>8+ Characters</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-wider">
                    {hasNumber ? <FaCheckCircle className="text-emerald-500" /> : <FaCircle className="text-zinc-800" />}
                    <span className={hasNumber ? "text-emerald-500" : "text-zinc-500"}>Includes a Number</span>
                  </div>
                </motion.div>
              )}
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 px-4 bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20">{loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}</button>
          </form>
          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.4em] font-black"><span className="px-3 bg-black text-zinc-500">Quick Access</span></div>
          </div>
          <button onClick={handleGoogleAuth} disabled={loading} className="w-full flex items-center justify-center space-x-3 py-2.5 md:py-3 border border-zinc-800 rounded-lg text-white text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 transition-all active:scale-95">
            <FaGoogle className="h-3.5 w-3.5 text-orange-500" /><span>Sign in with Google</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LoginUi() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-10 md:mt-14 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6 bg-black p-5 md:p-8 rounded-2xl shadow-2xl border border-white/5"
      >
        <Suspense fallback={<div className="text-center text-zinc-500 uppercase text-[10px] font-bold tracking-widest animate-pulse py-20">Loading Secure Access...</div>}>
          <LoginContent />
        </Suspense>
        <div className="pt-2"><p className="text-center text-[8px] text-zinc-600 uppercase tracking-widest leading-relaxed">Encrypted End-to-End • BostonClean Security</p></div>
      </motion.div>
    </div>
  );
}