import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function JoinScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      // Map ugly Firebase errors to user-friendly messages
      let friendlyMessage = 'An unexpected error occurred. Please try again.';
      if (err.code === 'auth/invalid-credential') friendlyMessage = 'Incorrect email or password.';
      else if (err.code === 'auth/email-already-in-use') friendlyMessage = 'This email is already registered. Please sign in instead.';
      else if (err.code === 'auth/weak-password') friendlyMessage = 'Password should be at least 6 characters long.';
      else if (err.code === 'auth/invalid-email') friendlyMessage = 'Please enter a valid email address.';
      else if (err.code === 'auth/user-not-found') friendlyMessage = 'No account found with this email.';
      else if (err.code === 'auth/wrong-password') friendlyMessage = 'Incorrect password. Please try again.';
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] p-8 glass-panel rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -ml-16 -mb-16 transition-transform duration-700 group-hover:scale-150"></div>

      <div className="relative z-10 text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-sm text-gray-400 font-medium">
          Sign in to access your enterprise chat.
        </p>
      </div>

      {error && (
        <div className="relative z-10 mb-6 p-4 text-sm text-center text-red-200 bg-red-900/40 border border-red-500/30 rounded-xl backdrop-blur-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
        {!isLogin && (
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 neon-border-focus transition-all duration-300 outline-none"
              placeholder="e.g. John Doe"
              required={!isLogin}
            />
          </div>
        )}
        
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 neon-border-focus transition-all duration-300 outline-none"
            placeholder="john@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 neon-border-focus transition-all duration-300 outline-none"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 flex justify-center items-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isLogin ? (
            <><LogIn className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" /> Access Terminal</>
          ) : (
            <><UserPlus className="w-5 h-5 group-hover/btn:scale-110 transition-transform" /> Initialize Account</>
          )}
        </button>
      </form>

      <div className="relative z-10 mt-8 text-center">
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-sm font-medium text-gray-400 hover:text-cyan-400 transition-colors duration-300"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
