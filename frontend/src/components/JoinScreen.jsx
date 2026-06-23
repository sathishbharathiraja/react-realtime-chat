import React, { useState } from 'react';
import { LogIn, UserPlus, MessageSquare } from 'lucide-react';
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
    <div className="w-full max-w-md p-10 bg-white border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="p-3 bg-indigo-600 rounded-lg text-white mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
          {isLogin ? 'Sign in to CorpChat' : 'Create an Account'}
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          {isLogin ? 'Enter your enterprise credentials' : 'Register your corporate email'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              placeholder="e.g. John Doe"
              required={!isLogin}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            placeholder="john@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 flex justify-center items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isLogin ? (
            <><LogIn className="w-4 h-4" /> Continue</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Register</>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
