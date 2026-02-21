import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Sparkles, Loader2, CheckCircle2, Layers } from "lucide-react";
import { BrandData, Message, Project } from "../types";
import html2canvas from 'html2canvas';
import { callAI, parseAiResponse, buildConversationHistory, extractBrandFromConversation } from "@/lib/ai";
import { PromptBox } from "@/components/ui/chatgpt-prompt-input";
import BrandElementsTab from "./BrandElementsTab";

// --- Board View Component ---
const BoardView = ({ data, lang }: { data: BrandData; lang: 'en' | 'jp' }) => {
    const boardRef = useRef<HTMLDivElement>(null);

    const download = async () => {
        if (!boardRef.current) return;
        const canvas = await html2canvas(boardRef.current, { scale: 2 });
        const link = document.createElement('a');
        link.download = `STRATEGIC_BOARD_${lang.toUpperCase()}_${data.name.en || 'UNNAMED'}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                ref={boardRef}
                className="w-[1200px] aspect-[16/9] bg-white border-2 border-black p-8 flex flex-col font-sans relative overflow-hidden"
                style={{ backgroundImage: 'radial-gradient(#ddd 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
            >
                <div className="flex justify-between border-b-2 border-black pb-2 mb-4">
                    <div className="font-black text-xl tracking-tighter uppercase">{data.name.en || "Identity Pending"}</div>
                    <div className="font-black text-[10px] tracking-[0.3em] text-zinc-400">STRATEGIC IDENTITY SYSTEM / {lang.toUpperCase()}</div>
                </div>

                <div className="flex-1 grid grid-cols-[180px_1fr] border-l-2 border-black">
                    <div className="flex flex-col border-r-2 border-black bg-zinc-50/50">
                        {["BRAND NAME", "ESSENCE", "CORE IDENTITY", "KEY VALUES", "PHILOSOPHY", "PRINCIPLES", "MANIFESTO"].map((label, i) => (
                            <div key={i} className="flex-1 border-b border-zinc-200 p-2 text-[10px] font-black tracking-widest opacity-40">{label}</div>
                        ))}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex-1 border-b-2 border-black flex flex-col items-center justify-center bg-white">
                            <h1 className="text-6xl font-black tracking-tighter uppercase">{lang === 'en' ? data.name.en : data.name.jp}</h1>
                        </div>
                        <div className="flex-1 border-b border-zinc-200 flex flex-col items-center justify-center p-4 text-center">
                            <div className="text-xl font-bold italic tracking-tight">{lang === 'en' ? data.taglineLong.en : data.taglineLong.jp}</div>
                        </div>
                        <div className="flex-1 border-b border-zinc-200 p-6 flex items-center">
                            <p className="text-lg leading-relaxed font-medium">{lang === 'en' ? data.definition.en : data.definition.jp}</p>
                        </div>
                        <div className="flex-[1.5] border-b border-zinc-200 grid grid-cols-3">
                            {(data.coreValues.length > 0 ? data.coreValues : Array(3).fill({ title: "-", en: "-", jp: "-" })).map((v, i) => (
                                <div key={i} className="border-r border-zinc-200 p-4 last:border-r-0">
                                    <div className="text-[10px] font-black mb-2 opacity-50">0{i + 1} / {v.title}</div>
                                    <div className="font-bold text-sm leading-tight">{lang === 'en' ? v.en : v.jp}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 border-b border-zinc-200 p-4 flex items-center bg-zinc-50/30">
                            <div className="text-xl font-black tracking-tight">{lang === 'en' ? data.bxPhilosophy.en : data.bxPhilosophy.jp}</div>
                        </div>
                        <div className="flex-1 border-b border-zinc-200 grid grid-cols-3">
                            {(data.bxPrinciples.length > 0 ? data.bxPrinciples : Array(3).fill({ title: "-", en: "-", jp: "-" })).map((p, i) => (
                                <div key={i} className="border-r border-zinc-200 p-4 last:border-r-0">
                                    <div className="text-[10px] font-black mb-1 opacity-50">{p.title}</div>
                                    <div className="font-bold text-xs">{lang === 'en' ? p.en : p.jp}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 p-4 grid grid-cols-3 gap-4">
                            {(data.manifesto[lang].length > 0 ? data.manifesto[lang] : ["-", "-", "-"]).map((l, i) => (
                                <div key={i} className="text-[11px] font-bold leading-tight uppercase border-l border-black pl-2">{l}</div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-between text-[8px] font-bold uppercase tracking-widest opacity-50">
                    <div>Strategic Board Generator / {data.name.en || 'Universal'}</div>
                    <div>© {new Date().getFullYear()} POWERED BY FUMI</div>
                    <div>CONFIDENTIAL DOCUMENT</div>
                </div>
            </div>
            <Button onClick={download} variant="outline" className="gap-2">
                <Download size={16} /> DOWNLOAD {lang.toUpperCase()} VERSION
            </Button>
        </div>
    );
};

// --- Project View (Chat + Board split) ---

interface ProjectViewProps {
    project: Project;
    onProjectUpdate: (project: Project) => void;
    onBack: () => void;
}

export default function ProjectView({ project, onProjectUpdate, onBack }: ProjectViewProps) {
    const [chatValue, setChatValue] = useState("");
    const [messages, setMessages] = useState<Message[]>(project.messages);
    const [currentBrand, setCurrentBrand] = useState<BrandData>(project.brandData);
    const [isTyping, setIsTyping] = useState(false);
    const [activeTab, setActiveTab] = useState<'bis' | 'elements'>('bis');
    const scrollRef = useRef<HTMLDivElement>(null);
    const latestMsgRef = useRef<HTMLDivElement>(null);

    // Persist changes back to parent
    useEffect(() => {
        onProjectUpdate({
            ...project,
            messages,
            brandData: currentBrand,
        });
    }, [messages, currentBrand]);

    useEffect(() => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            container.scrollTop = container.scrollHeight + 10;
        }
    }, [messages, isTyping]);

    const mergeBrandUpdate = (current: BrandData, update: Partial<BrandData>): BrandData => {
        console.log("Applying Brand Update:", update);
        const merged = { ...current };
        for (const key of Object.keys(update) as (keyof BrandData)[]) {
            const val = update[key];
            if (val === undefined || val === null) continue;

            if (Array.isArray(val)) {
                if (val.length > 0) {
                    (merged as any)[key] = val;
                }
            } else if (typeof val === 'object') {
                const obj = val as { en?: string; jp?: string };
                const updatedObj = { ...(current as any)[key] };
                if (obj.en && !['...', '"..."', ''].includes(obj.en)) updatedObj.en = obj.en;
                if (obj.jp && !['...', '"..."', ''].includes(obj.jp)) updatedObj.jp = obj.jp;
                (merged as any)[key] = updatedObj;
            } else if (val && val !== '...') {
                (merged as any)[key] = val;
            }
        }
        return merged;
    };

    const handleSend = async () => {
        if (!chatValue.trim() || isTyping) return;

        const userPrompt = chatValue;
        setChatValue("");
        const newMessages: Message[] = [...messages, { role: 'user' as const, content: userPrompt }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const history = buildConversationHistory(newMessages);
            const rawResponse = await callAI(history);
            const { message, brandUpdate } = parseAiResponse(rawResponse);

            const updatedMessages: Message[] = [...newMessages, { role: 'ai' as const, content: message }];
            setMessages(updatedMessages);

            if (brandUpdate) {
                console.log("Using inline brand update");
                setCurrentBrand(prev => mergeBrandUpdate(prev, brandUpdate));
            } else {
                console.log("Using fallback brand extraction...");
                const fullHistory = buildConversationHistory(updatedMessages);
                const extracted = await extractBrandFromConversation(fullHistory);
                if (extracted) {
                    console.log("✅ Fallback brand update applied");
                    setCurrentBrand(prev => mergeBrandUpdate(prev, extracted));
                }
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: `⚠️ エラーが発生しました: ${error.message}\n\n.envファイルにAPIキーが正しく設定されているか確認してください。`
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#f8f9fa] text-black font-sans overflow-hidden">
            {/* Left side: Chat */}
            <div className="w-[320px] xl:w-[440px] flex-shrink-0 flex flex-col border-r border-zinc-200 bg-white relative">
                <header className="px-4 py-3 flex items-center gap-3 border-b border-black/5 bg-white z-10">
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                        <ArrowLeft size={16} className="text-zinc-500" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-black tracking-tighter text-sm uppercase truncate">{project.name}</h1>
                        {currentBrand.name.en && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                                <CheckCircle2 size={10} className="text-green-500 flex-shrink-0" />
                                <span className="truncate">{currentBrand.name.en}</span>
                            </div>
                        )}
                    </div>
                </header>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar pb-48"
                >
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            ref={i === messages.length - 1 ? latestMsgRef : null}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[90%] p-3 rounded-2xl text-[13px] ${m.role === 'user'
                                ? 'bg-black text-white rounded-tr-none shadow-md'
                                : 'bg-white border border-zinc-200 text-black rounded-tl-none shadow-sm'
                                }`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div ref={latestMsgRef} className="flex justify-start">
                            <div className="bg-white border border-zinc-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                <Loader2 className="animate-spin text-zinc-300" size={16} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-10">
                    <PromptBox
                        value={chatValue}
                        onChange={(e) => setChatValue(e.target.value)}
                        onSubmit={handleSend}
                        loading={isTyping}
                        placeholder="あなたの考えていることを教えてください..."
                        className="shadow-2xl shadow-black/5"
                    />
                </div>
            </div>

            {/* Right side: Board / Elements tabs */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tab bar */}
                <div className="bg-white border-b border-zinc-200 px-6 py-0 flex items-end gap-0">
                    <button
                        onClick={() => setActiveTab('bis')}
                        className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'bis'
                            ? 'border-black text-black'
                            : 'border-transparent text-zinc-400 hover:text-zinc-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles size={12} />
                            Identity Board
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('elements')}
                        className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'elements'
                            ? 'border-black text-black'
                            : 'border-transparent text-zinc-400 hover:text-zinc-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Layers size={12} />
                            Brand Elements
                            <span className="text-[8px] bg-gradient-to-r from-blue-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full font-black">NEW</span>
                        </div>
                    </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto bg-[#f2f2f4] p-8 xl:p-12 custom-scrollbar">
                    {activeTab === 'bis' ? (
                        <div className="flex flex-col items-center gap-32">
                            <div className="flex flex-col items-center gap-6">
                                <div className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">English Version</div>
                                <div className="scale-[0.6] xl:scale-[0.8] origin-top border-4 border-black shadow-2xl rounded-lg overflow-hidden">
                                    <BoardView data={currentBrand} lang="en" />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6">
                                <div className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">日本語版</div>
                                <div className="scale-[0.6] xl:scale-[0.8] origin-top border-4 border-black shadow-2xl rounded-lg overflow-hidden">
                                    <BoardView data={currentBrand} lang="jp" />
                                </div>
                            </div>
                            <div className="h-32" />
                        </div>
                    ) : (
                        <BrandElementsTab brand={currentBrand} />
                    )}
                </div>
            </div>
        </div>
    );
}
