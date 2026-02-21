import React, { useState } from 'react';
import { Project } from '../types';
import { createProject } from '../lib/storage';
import { Plus, Trash2, Sparkles, ArrowRight, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
    projects: Project[];
    onProjectsChange: (projects: Project[]) => void;
    onOpenProject: (id: string) => void;
    onDeleteProject?: (id: string) => void;
}

export default function ProjectDashboard({ projects, onProjectsChange, onOpenProject, onDeleteProject }: DashboardProps) {
    const [newName, setNewName] = useState('');
    const [showInput, setShowInput] = useState(false);

    const handleCreate = () => {
        const name = newName.trim() || `Project ${projects.length + 1}`;
        const project = createProject(name);
        const updated = [...projects, project];
        onProjectsChange(updated);
        setNewName('');
        setShowInput(false);
        onOpenProject(project.id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('このプロジェクトを削除しますか？')) return;
        if (onDeleteProject) {
            onDeleteProject(id);
        } else {
            onProjectsChange(projects.filter(p => p.id !== id));
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getCompletionPercentage = (p: Project) => {
        const b = p.brandData;
        let filled = 0;
        let total = 10;
        if (b.name.en) filled++;
        if (b.taglineLong.en) filled++;
        if (b.definition.en) filled++;
        if (b.coreValues.length > 0) filled++;
        if (b.mission.en) filled++;
        if (b.vision.en) filled++;
        if (b.essence.en) filled++;
        if (b.bxPhilosophy.en) filled++;
        if (b.bxPrinciples.length > 0) filled++;
        if (b.manifesto.en.length > 0) filled++;
        return Math.round((filled / total) * 100);
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-black font-sans">
            {/* Header */}
            <header className="border-b border-zinc-200 bg-white">
                <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                            <Sparkles className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="font-black text-xl tracking-tighter uppercase">BIS Generator</h1>
                            <p className="text-xs text-zinc-400 font-medium">Brand Identity System</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInput(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors"
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-8 py-12">
                {/* New project input */}
                <AnimatePresence>
                    {showInput && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="mb-8"
                        >
                            <div className="bg-white border-2 border-black rounded-2xl p-6 flex items-center gap-4">
                                <Folder size={20} className="text-zinc-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleCreate();
                                        if (e.key === 'Escape') setShowInput(false);
                                    }}
                                    placeholder="プロジェクト名を入力（例：My Personal Brand）"
                                    className="flex-1 text-lg font-medium bg-transparent border-none outline-none placeholder:text-zinc-300"
                                />
                                <button
                                    onClick={handleCreate}
                                    className="px-5 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors"
                                >
                                    作成
                                </button>
                                <button
                                    onClick={() => setShowInput(false)}
                                    className="px-4 py-2 text-zinc-400 text-sm font-bold hover:text-black transition-colors"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Projects section header */}
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="font-black text-sm uppercase tracking-widest text-zinc-400">
                        Projects ({projects.length})
                    </h2>
                    <div className="flex-1 h-px bg-zinc-200" />
                </div>

                {/* Empty state */}
                {projects.length === 0 && !showInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32"
                    >
                        <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                            <Folder size={32} className="text-zinc-300" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">まだプロジェクトがありません</h3>
                        <p className="text-zinc-400 text-sm mb-6">新しいプロジェクトを作成して、ブランドアイデンティティの構築を始めましょう</p>
                        <button
                            onClick={() => setShowInput(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors"
                        >
                            <Plus size={16} />
                            最初のプロジェクトを作成
                        </button>
                    </motion.div>
                )}

                {/* Project grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {projects.map((project, index) => {
                            const completion = getCompletionPercentage(project);
                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => onOpenProject(project.id)}
                                    className="group bg-white border border-zinc-200 rounded-2xl p-6 cursor-pointer hover:border-black hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                                >
                                    {/* Completion bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100">
                                        <div
                                            className="h-full bg-black transition-all duration-500"
                                            style={{ width: `${completion}%` }}
                                        />
                                    </div>

                                    <div className="flex items-start justify-between mb-4 pt-2">
                                        <div className="flex-1">
                                            <h3 className="font-black text-base tracking-tight group-hover:text-black transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                                                {project.brandData.name.en || 'Brand Undefined'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, project.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Brand name preview */}
                                    {project.brandData.taglineLong.en && (
                                        <p className="text-xs text-zinc-500 italic mb-4 line-clamp-2">
                                            "{project.brandData.taglineLong.en}"
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-zinc-400">
                                                {formatDate(project.updatedAt)}
                                            </span>
                                            <span className="text-[10px] font-black text-zinc-300 bg-zinc-100 px-2 py-0.5 rounded-full">
                                                {completion}%
                                            </span>
                                        </div>
                                        <ArrowRight size={14} className="text-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
