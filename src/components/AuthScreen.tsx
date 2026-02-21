import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthScreen() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('確認メールを送信しました。メールをチェックしてください。');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white border border-black p-12 rounded-[2rem] shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-black" />

                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mb-6">
                        <Sparkles className="text-white" size={32} />
                    </div>
                    <h1 className="font-black text-4xl tracking-tighter uppercase mb-2">Login</h1>
                    <p className="text-xs text-zinc-400 font-bold tracking-[0.2em] uppercase">BIS Strategic Concierge</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-black transition-all font-medium"
                            placeholder="name@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-black transition-all font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Create Account' : 'Sign In')}
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="mt-8 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {isSignUp ? (
                        <>すでにアカウントをお持ちですか？ <button onClick={() => setIsSignUp(false)} className="text-black border-b border-black">ログイン</button></>
                    ) : (
                        <>アカウントをお持ちでないですか？ <button onClick={() => setIsSignUp(true)} className="text-black border-b border-black">新規登録</button></>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
