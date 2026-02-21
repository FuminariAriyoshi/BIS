import React, { useState, useCallback } from 'react';
import { BrandData } from '../types';
import {
    BrandElements, FontProposal, ColorPalette, GeneratedImage, MotionConcept,
    generateFontProposal, generateColorPalette,
    generateIllustration, generateKeyVisual, generateIconography, generateLogo,
    generateMotionConcept
} from '../lib/brandElements';
import {
    Sparkles, RefreshCw, Download, ImageIcon, Palette,
    Type, Layers, Play, Star, AlertCircle, Zap
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GOOGLE_AI_KEY = import.meta.env.VITE_GOOGLE_AI_KEY as string;
const hasGoogleKey = () => !!GOOGLE_AI_KEY && GOOGLE_AI_KEY.trim().length > 10;

function downloadImage(dataUrl: string, name: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    a.click();
}

// ─── Loading pulse ─────────────────────────────────────────────────────────────

const LoadingPulse = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
        <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-zinc-200" />
            <div className="absolute inset-0 rounded-full border-2 border-t-black animate-spin" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
    </div>
);

// ─── Error message ─────────────────────────────────────────────────────────────

const ErrorBox = ({ msg }: { msg: string }) => (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl overflow-hidden">
        <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-red-600 leading-relaxed break-words min-w-0">{msg}</p>
    </div>
);

// ─── Google Key warning banner ─────────────────────────────────────────────────

const NoKeyWarning = () => (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
            <p className="font-black text-amber-800 text-xs mb-1">Google AI APIキーが必要です（画像生成用）</p>
            <p className="text-amber-700 text-[11px] leading-relaxed">
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                    className="underline font-bold">aistudio.google.com/apikey</a> でキーを取得し、
                <code className="bg-amber-100 px-1 rounded text-[10px]">.env</code> に{" "}
                <code className="bg-amber-100 px-1 rounded text-[10px]">VITE_GOOGLE_AI_KEY=...</code> を追加してください。
            </p>
        </div>
    </div>
);

// ─── Color swatch ──────────────────────────────────────────────────────────────

const ColorSwatch = ({ color }: {
    color: { name: string; hex: string; rgb: string; usage: string }
}) => (
    <div className="flex flex-col gap-1.5 min-w-0">
        <div
            className="w-full h-12 rounded-lg shadow-sm border border-black/5 flex-shrink-0"
            style={{ backgroundColor: color.hex }}
        />
        <div className="min-w-0">
            <div className="font-black text-[11px] truncate">{color.name}</div>
            <div className="font-mono text-[9px] text-zinc-400">{color.hex}</div>
            <div className="text-[9px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">{color.usage}</div>
        </div>
    </div>
);

// ─── Font preview ──────────────────────────────────────────────────────────────

const FontPreview = ({ font, role }: {
    font: { name: string; category: string; usage: string; googleFont: string }; role: string
}) => (
    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
        <div className="flex-1 min-w-0">
            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{role}</div>
            <div className="font-black text-sm truncate">{font.name}</div>
            <div className="text-[9px] text-zinc-500 truncate">{font.category} · {font.usage}</div>
        </div>
        <a
            href={`https://fonts.google.com/specimen/${encodeURIComponent(font.googleFont)}`}
            target="_blank" rel="noreferrer"
            className="text-[9px] font-black text-blue-500 hover:text-blue-700 transition-colors flex-shrink-0 whitespace-nowrap"
        >
            GF ↗
        </a>
    </div>
);

// ─── Image card ────────────────────────────────────────────────────────────────

const ImageCard = ({
    image, onRegenerate, isLoading, label, onDownload
}: {
    image?: GeneratedImage;
    onRegenerate: () => void;
    isLoading?: boolean;
    label: string;
    onDownload?: () => void;
}) => {
    if (isLoading) return <LoadingPulse label={`${label} を生成中...`} />;

    if (image) {
        return (
            <div className="relative">
                {/* Fixed aspect-ratio container — image never overflows */}
                <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: '4/3' }}>
                    <img
                        src={image.url}
                        alt={label}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        <button
                            onClick={onRegenerate}
                            title="再生成"
                            className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-zinc-200 hover:bg-white transition-colors"
                        >
                            <RefreshCw size={11} />
                        </button>
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                title="ダウンロード"
                                className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-zinc-200 hover:bg-white transition-colors"
                            >
                                <Download size={11} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
            <ImageIcon size={22} className="text-zinc-300" />
            <span className="text-[10px] text-zinc-400 font-bold">{label}</span>
            <button
                onClick={onRegenerate}
                className="px-3 py-1.5 bg-black text-white text-[10px] font-black rounded-full flex items-center gap-1.5 hover:bg-zinc-800 transition-colors"
            >
                <Sparkles size={10} /> Generate
            </button>
        </div>
    );
};

// ─── Motion concept card ───────────────────────────────────────────────────────

const MotionCard = ({ motion }: { motion: MotionConcept }) => (
    <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-black text-white rounded-xl p-4">
                <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Style</div>
                <div className="font-black text-sm leading-tight">{motion.style}</div>
            </div>
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Duration</div>
                <div className="font-black text-sm">{motion.duration}</div>
                <div className="text-[9px] text-zinc-400 font-mono mt-1 break-all leading-tight">{motion.easing}</div>
            </div>
        </div>
        <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2">Keyframe Principles</div>
            <div className="flex flex-col gap-2">
                {motion.keyframes.map((kf, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <span className="text-[9px] font-black text-zinc-400 flex-shrink-0 mt-0.5">0{i + 1}</span>
                        <span className="text-[11px] text-zinc-700 leading-snug">{kf}</span>
                    </div>
                ))}
            </div>
        </div>
        <p className="text-[11px] text-zinc-600 leading-relaxed px-1">{motion.overallFeel}</p>
        <div className="flex flex-wrap gap-1.5">
            {motion.recommendedTools.map((tool, i) => (
                <span key={i} className="px-2 py-1 bg-black text-white text-[9px] font-black rounded-full">{tool}</span>
            ))}
        </div>
    </div>
);

// ─── Section card wrapper ──────────────────────────────────────────────────────

const Card = ({
    icon, title, badge, onGenerate, isLoading, hasData, children
}: {
    icon: React.ReactNode;
    title: string;
    badge: string;
    onGenerate: () => void;
    isLoading?: boolean;
    hasData?: boolean;
    children: React.ReactNode;
}) => (
    <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
                {icon}
                <div className="min-w-0">
                    <div className="font-black text-sm truncate">{title}</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{badge}</div>
                </div>
            </div>
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
                {isLoading
                    ? <RefreshCw size={10} className="animate-spin" />
                    : <Sparkles size={10} />}
                {hasData ? 'Regen' : 'Generate'}
            </button>
        </div>
        <div className="min-w-0">{children}</div>
    </div>
);

// ─── Image card wrapper (with download in header) ──────────────────────────────

const ImageSectionCard = ({
    icon, title, onGenerate, isLoading, image, error, onDownload
}: {
    icon: React.ReactNode;
    title: string;
    onGenerate: () => void;
    isLoading?: boolean;
    image?: GeneratedImage;
    error?: string;
    onDownload?: () => void;
}) => (
    <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                {icon}
                <div>
                    <div className="font-black text-sm">{title}</div>
                    <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                        {/* Google logo inline */}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Imagen 3 / 4
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {image && onDownload && (
                    <button onClick={onDownload} title="ダウンロード"
                        className="p-1.5 rounded-lg hover:bg-zinc-50 transition-colors">
                        <Download size={12} className="text-zinc-400" />
                    </button>
                )}
                <button
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={9} className={isLoading ? 'animate-spin' : ''} />
                    {image ? 'Regen' : 'Gen'}
                </button>
            </div>
        </div>
        {error && <ErrorBox msg={error} />}
        <ImageCard
            image={image}
            isLoading={isLoading}
            onRegenerate={onGenerate}
            onDownload={onDownload}
            label={title}
        />
    </div>
);

// ─── Icon badge ────────────────────────────────────────────────────────────────

const IconBadge = ({ gradient, children }: { gradient: string; children: React.ReactNode }) => (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient}`}>
        {children}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

type LoadingKey = 'font' | 'color' | 'illustration' | 'keyvisu' | 'iconography' | 'logo' | 'motion';

export default function BrandElementsTab({ brand }: { brand: BrandData }) {
    const [elements, setElements] = useState<BrandElements>({});
    const [loading, setLoading] = useState<Partial<Record<LoadingKey, boolean>>>({});
    const [errors, setErrors] = useState<Partial<Record<LoadingKey, string>>>({});

    const setLoader = (k: LoadingKey, v: boolean) => setLoading(p => ({ ...p, [k]: v }));
    const setErr = (k: LoadingKey, msg: string) => setErrors(p => ({ ...p, [k]: msg }));
    const clearErr = (k: LoadingKey) => setErrors(p => ({ ...p, [k]: undefined }));

    const hasBrand = !!(brand.name.en || brand.name.jp);

    const run = useCallback(async <T,>(
        key: LoadingKey,
        fn: () => Promise<T>,
        setter: (v: T) => void
    ) => {
        clearErr(key);
        setLoader(key, true);
        try {
            setter(await fn());
        } catch (e: any) {
            setErr(key, e.message);
        } finally {
            setLoader(key, false);
        }
    }, []);

    const genFont = () => run('font', () => generateFontProposal(brand),
        v => setElements(p => ({ ...p, font: v })));
    const genColor = () => run('color', () => generateColorPalette(brand),
        v => setElements(p => ({ ...p, color: v })));
    const genIllust = () => run('illustration', () => generateIllustration(brand),
        v => setElements(p => ({ ...p, illustration: v })));
    const genKV = () => run('keyvisu', () => generateKeyVisual(brand),
        v => setElements(p => ({ ...p, keyVisual: v })));
    const genIcon = () => run('iconography', () => generateIconography(brand),
        v => setElements(p => ({ ...p, iconography: v })));
    const genLogo = () => run('logo', () => generateLogo(brand),
        v => setElements(p => ({ ...p, logo: v })));
    const genMotion = () => run('motion', () => generateMotionConcept(brand),
        v => setElements(p => ({ ...p, motion: v })));

    const genAll = () => {
        void genFont(); void genColor(); void genMotion();
        if (hasGoogleKey()) { void genIllust(); void genKV(); void genIcon(); void genLogo(); }
    };

    if (!hasBrand) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
                <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center border border-zinc-200 shadow-sm">
                    <Layers size={32} className="text-zinc-300" />
                </div>
                <div className="text-center">
                    <h3 className="font-black text-base mb-1.5">Brand Elements</h3>
                    <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                        まずチャットでBISを構築してください。<br />ブランド名が確定したらElements生成が解放されます。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 xl:p-7 space-y-5 overflow-x-hidden">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="font-black text-xl tracking-tight truncate">{brand.name.en || brand.name.jp}</h2>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Brand Elements System</p>
                </div>
                <button
                    onClick={genAll}
                    disabled={Object.values(loading).some(Boolean)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-lg shadow-black/10"
                >
                    <Zap size={11} /> Generate All
                </button>
            </div>

            {/* Google key warning */}
            {!hasGoogleKey() && <NoKeyWarning />}

            {/* ── ROW 1: Color (wider) + Typography ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">

                {/* Color Palette */}
                <Card
                    icon={<IconBadge gradient="bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400"><Palette size={14} className="text-white" /></IconBadge>}
                    title="Color Palette"
                    badge="ChatGPT + BIS"
                    onGenerate={genColor}
                    isLoading={loading.color}
                    hasData={!!elements.color}
                >
                    {loading.color ? <LoadingPulse label="カラーパレットを生成中..." /> :
                        errors.color ? <ErrorBox msg={errors.color} /> :
                            elements.color ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-5 gap-2">
                                        {[elements.color.primary, elements.color.secondary, elements.color.accent,
                                        elements.color.neutral, elements.color.background].map((c, i) => (
                                            <ColorSwatch key={i} color={c} />
                                        ))}
                                    </div>
                                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Mood</div>
                                        <div className="font-black text-sm">{elements.color.mood}</div>
                                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{elements.color.rationale}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <Palette size={20} className="text-zinc-300" />
                                    <span className="text-[10px] text-zinc-400 font-bold">BISに基づいたカラーパレットを生成</span>
                                </div>
                            )
                    }
                </Card>

                {/* Typography */}
                <Card
                    icon={<IconBadge gradient="bg-gradient-to-br from-slate-700 to-black"><Type size={14} className="text-white" /></IconBadge>}
                    title="Typography"
                    badge="ChatGPT + BIS"
                    onGenerate={genFont}
                    isLoading={loading.font}
                    hasData={!!elements.font}
                >
                    {loading.font ? <LoadingPulse label="フォントシステムを生成中..." /> :
                        errors.font ? <ErrorBox msg={errors.font} /> :
                            elements.font ? (
                                <div className="space-y-2">
                                    <FontPreview font={elements.font.primary} role="Primary" />
                                    <FontPreview font={elements.font.secondary} role="Secondary" />
                                    <FontPreview font={elements.font.accent} role="Accent" />
                                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 mt-2">
                                        <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Sample</div>
                                        <div className="font-black text-base leading-tight truncate">{elements.font.pairingSample.heading}</div>
                                        <div className="text-[11px] text-zinc-600 mt-1 leading-relaxed line-clamp-2">{elements.font.pairingSample.body}</div>
                                        <div className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{elements.font.pairingSample.caption}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <Type size={20} className="text-zinc-300" />
                                    <span className="text-[10px] text-zinc-400 font-bold">BISに基づいたフォントシステムを生成</span>
                                </div>
                            )
                    }
                </Card>
            </div>

            {/* ── ROW 2: Illustration / Key Visual / Iconography ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ImageSectionCard
                    icon={<IconBadge gradient="bg-gradient-to-br from-emerald-400 to-teal-500"><Star size={14} className="text-white" /></IconBadge>}
                    title="Illustration"
                    onGenerate={genIllust}
                    isLoading={loading.illustration}
                    image={elements.illustration}
                    error={errors.illustration}
                    onDownload={elements.illustration ? () => downloadImage(elements.illustration!.url, `${brand.name.en}_illustration.png`) : undefined}
                />
                <ImageSectionCard
                    icon={<IconBadge gradient="bg-gradient-to-br from-orange-400 to-rose-500"><ImageIcon size={14} className="text-white" /></IconBadge>}
                    title="Key Visual"
                    onGenerate={genKV}
                    isLoading={loading.keyvisu}
                    image={elements.keyVisual}
                    error={errors.keyvisu}
                    onDownload={elements.keyVisual ? () => downloadImage(elements.keyVisual!.url, `${brand.name.en}_key_visual.png`) : undefined}
                />
                <ImageSectionCard
                    icon={<IconBadge gradient="bg-gradient-to-br from-violet-400 to-purple-600"><Layers size={14} className="text-white" /></IconBadge>}
                    title="Iconography"
                    onGenerate={genIcon}
                    isLoading={loading.iconography}
                    image={elements.iconography}
                    error={errors.iconography}
                    onDownload={elements.iconography ? () => downloadImage(elements.iconography!.url, `${brand.name.en}_iconography.png`) : undefined}
                />
            </div>

            {/* ── ROW 3: Logo + Motion ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">

                {/* Logo */}
                <ImageSectionCard
                    icon={<div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white font-black text-[11px] flex-shrink-0">L</div>}
                    title="Logo Concept"
                    onGenerate={genLogo}
                    isLoading={loading.logo}
                    image={elements.logo}
                    error={errors.logo}
                    onDownload={elements.logo ? () => downloadImage(elements.logo!.url, `${brand.name.en}_logo.png`) : undefined}
                />

                {/* Motion */}
                <Card
                    icon={<IconBadge gradient="bg-gradient-to-br from-blue-500 to-indigo-600"><Play size={14} className="text-white" /></IconBadge>}
                    title="Motion Language"
                    badge="ChatGPT + BIS"
                    onGenerate={genMotion}
                    isLoading={loading.motion}
                    hasData={!!elements.motion}
                >
                    {loading.motion ? <LoadingPulse label="モーション言語を生成中..." /> :
                        errors.motion ? <ErrorBox msg={errors.motion} /> :
                            elements.motion ? <MotionCard motion={elements.motion} /> : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <Play size={20} className="text-zinc-300" />
                                    <span className="text-[10px] text-zinc-400 font-bold">BISに基づいたモーション言語を定義</span>
                                </div>
                            )
                    }
                </Card>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-[9px] text-zinc-300 pb-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Google Imagen 3 / 4</span>
                <span>·</span>
                <span>ChatGPT-4o-mini</span>
                <span>·</span>
                <span>BIS Gen by Fumi</span>
            </div>
        </div>
    );
}
