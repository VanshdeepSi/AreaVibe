"use client";

import { useState, useEffect } from "react";
import { User, Shield, Star, MapPin, Lock, CheckCircle2, Loader2, LogOut, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [user, setUser] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
        fetchMyRatings(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsAuthenticated(true);
      setUser(session.user);
      fetchMyRatings(session.user.id);
    }
  };

  const fetchMyRatings = async (userId: string) => {
    const { data, error } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (!error && data) {
      setRatings(data);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 5000);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) showToast(error.message);
      else showToast("Sign up successful! Please check your email to verify (if enabled), or you are now logged in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) showToast(error.message);
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/profile',
      }
    });
    if (error) {
      showToast(error.message);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full overflow-y-auto custom-scroll flex flex-col items-center justify-center bg-slate-950 p-6 relative">
        {notification && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-slate-200 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-brand" />
            <p className="font-medium text-sm">{notification}</p>
          </div>
        )}

        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl z-10 mt-12">
          <div className="w-12 h-12 bg-brand/20 text-brand rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">
            {isSignUp ? "Create an Account" : "Sign in to AreaVibe"}
          </h2>
          <p className="text-slate-400 text-center mb-8">
            Join the community to submit real ratings and unlock detailed resident notes.
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
                placeholder="name@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand hover:bg-brand/90 disabled:opacity-50 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignUp ? "Sign Up" : "Sign In with Email"}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-slate-900 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 mb-6"
          >
            {/* Google G logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className="text-center text-sm text-slate-400">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setNotification("");
              }}
              className="text-brand hover:text-brand-hover font-semibold transition-colors"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalRatings = ratings.length;
  const avgOverall = ratings.length > 0 
    ? (ratings.reduce((acc, curr) => acc + ((curr.noise_score + curr.air_score + curr.water_score + curr.safety_score) / 4), 0) / ratings.length).toFixed(1)
    : 0;

  return (
    <div className="h-full overflow-y-auto custom-scroll bg-slate-950 p-6 md:p-12 relative">
      <button 
        onClick={handleLogout}
        className="absolute top-6 right-6 md:top-12 md:right-12 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-colors flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline text-sm font-medium">Log out</span>
      </button>

      <div className="max-w-4xl mx-auto mt-12 md:mt-0">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-brand to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-brand/20 shrink-0">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="truncate w-full">
            <h1 className="text-3xl font-bold mb-2 truncate">Contributor</h1>
            <p className="text-slate-400 flex items-center gap-2 truncate">
              <Shield className="w-4 h-4 text-emerald-400" /> {user?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-slate-400 mb-2">Total Locations Rated</h3>
            <p className="text-4xl font-bold">{totalRatings}</p>
          </div>
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-slate-400 mb-2">Your Avg Score</h3>
            <p className="text-4xl font-bold text-brand">{avgOverall}</p>
          </div>
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-slate-400 mb-2">Level</h3>
            <p className="text-4xl font-bold text-cyan-400">
              {totalRatings > 10 ? "Expert Guide" : totalRatings > 0 ? "Contributor" : "New User"}
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Your Recent Contributions</h2>
        
        {ratings.length === 0 ? (
          <div className="p-8 border border-dashed border-white/20 rounded-2xl text-center text-slate-500">
            You haven't submitted any ratings yet. Head over to the Map to rate your neighborhood!
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((item) => {
              const score = ((item.noise_score + item.air_score + item.water_score + item.safety_score) / 4).toFixed(1);
              return (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 border border-white/10 rounded-xl gap-4">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="truncate">
                      <h4 className="font-semibold truncate">{item.location_name}</h4>
                      <p className="text-sm text-slate-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-brand/10 text-brand px-3 py-1 rounded-full font-semibold shrink-0 w-fit">
                    <Star className="w-4 h-4 fill-brand" /> {score}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
