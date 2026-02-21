import React, { useState, useEffect } from 'react';
import { Project } from './types';
import {
    loadProjectsLocal,
    saveProjectsLocal,
    fetchProjectsSupabase,
    saveProjectSupabase,
    deleteProjectSupabase
} from './lib/storage';
import { supabase } from './lib/supabase';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectView from './components/ProjectView';
import AuthScreen from './components/AuthScreen';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Auth state listener
    useEffect(() => {
        let cancelled = false;

        supabase.auth.getSession()
            .then(({ data: { session }, error }) => {
                if (cancelled) return;
                if (error) {
                    console.error('Session error:', error);
                    setError(error.message);
                }
                setUser(session?.user ?? null);
                setLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Unexpected auth error:', err);
                setError(String(err));
                setLoading(false);
            });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    // Load projects when user changes
    useEffect(() => {
        if (loading) return;

        if (user) {
            fetchProjectsSupabase()
                .then(data => {
                    if (data) setProjects(data);
                })
                .catch(err => console.error('Fetch projects error:', err));
        } else {
            setProjects(loadProjectsLocal());
        }
    }, [user, loading]);

    // Handle project updates
    const handleProjectUpdate = async (updated: Project) => {
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));

        if (user) {
            await saveProjectSupabase(updated);
        } else {
            saveProjectsLocal(projects.map(p => p.id === updated.id ? updated : p));
        }
    };

    const handleProjectsChange = (newProjects: Project[]) => {
        setProjects(newProjects);
        if (!user) saveProjectsLocal(newProjects);
        else {
            // For new projects added via dashboard, save each new one
        }
    };

    const handleProjectDelete = async (id: string) => {
        const remaining = projects.filter(p => p.id !== id);
        setProjects(remaining);
        if (user) {
            await deleteProjectSupabase(id);
        } else {
            saveProjectsLocal(remaining);
        }
    };

    const activeProject = projects.find(p => p.id === activeProjectId);

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
                <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full">
                    <h2 className="font-black text-lg mb-2 text-red-500">接続エラー</h2>
                    <p className="text-sm text-zinc-600 mb-4">{error}</p>
                    <button
                        onClick={() => { setError(null); setLoading(false); }}
                        className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold"
                    >
                        再試行
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    if (activeProject) {
        return (
            <ProjectView
                project={activeProject}
                onProjectUpdate={handleProjectUpdate}
                onBack={() => setActiveProjectId(null)}
            />
        );
    }

    return (
        <div className="relative">
            {/* User Profile / Logout Mini Bar */}
            <div className="fixed top-6 right-32 z-[60] flex items-center gap-4 bg-white/80 backdrop-blur border border-zinc-200 px-4 py-2 rounded-full shadow-sm text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2 text-zinc-600">
                    <UserIcon size={12} className="text-zinc-400" />
                    <span className="max-w-[140px] truncate normal-case">{user.email}</span>
                </div>
                <div className="w-px h-3 bg-zinc-200" />
                <button onClick={() => supabase.auth.signOut()} className="hover:text-red-500 transition-colors flex items-center gap-1">
                    <LogOut size={12} />
                    Sign Out
                </button>
            </div>

            <ProjectDashboard
                projects={projects}
                onProjectsChange={handleProjectsChange}
                onOpenProject={setActiveProjectId}
                onDeleteProject={handleProjectDelete}
            />
        </div>
    );
}
