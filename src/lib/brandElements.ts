import { BrandData } from "../types";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const GOOGLE_AI_KEY = import.meta.env.VITE_GOOGLE_AI_KEY as string;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FontProposal {
    primary: { name: string; category: string; usage: string; googleFont: string };
    secondary: { name: string; category: string; usage: string; googleFont: string };
    accent: { name: string; category: string; usage: string; googleFont: string };
    rationale: string;
    pairingSample: {
        heading: string;
        body: string;
        caption: string;
    };
}

export interface ColorPalette {
    primary: { name: string; hex: string; rgb: string; usage: string };
    secondary: { name: string; hex: string; rgb: string; usage: string };
    accent: { name: string; hex: string; rgb: string; usage: string };
    neutral: { name: string; hex: string; rgb: string; usage: string };
    background: { name: string; hex: string; rgb: string; usage: string };
    rationale: string;
    mood: string;
}

export interface GeneratedImage {
    url: string; // base64 data URL
    prompt: string;
    type: "illustration" | "keyvisu" | "iconography" | "logo" | "motion_frame";
}

export interface MotionConcept {
    style: string;
    easing: string;
    duration: string;
    keyframes: string[];
    colorTransitions: string;
    typography: string;
    overallFeel: string;
    recommendedTools: string[];
    lottieDescription: string;
}

export interface BrandElements {
    font?: FontProposal;
    color?: ColorPalette;
    illustration?: GeneratedImage;
    keyVisual?: GeneratedImage;
    iconography?: GeneratedImage;
    logo?: GeneratedImage;
    motion?: MotionConcept;
    generatedAt?: number;
}

// ─── ChatGPT: Font Proposal ───────────────────────────────────────────────────

export async function generateFontProposal(brand: BrandData): Promise<FontProposal> {
    const prompt = `あなたはプロのブランドデザイナーです。
以下のBrand Identity System (BIS) データに基づいて、このブランドに最適なフォントシステムを提案してください。

BISデータ:
- ブランド名(EN): ${brand.name.en}
- ブランド名(JP): ${brand.name.jp}
- タグライン: ${brand.taglineLong.en}
- 定義: ${brand.definition.en}
- コアバリュー: ${brand.coreValues.map(v => v.title + ": " + v.en).join(", ")}
- 哲学: ${brand.bxPhilosophy.en}
- エッセンス: ${brand.essence.en}

以下のJSON形式のみで回答してください。マークダウンや説明文は一切含めないでください:

{
  "primary": {
    "name": "フォント名",
    "category": "Serif | Sans-Serif | Display | Mono",
    "usage": "使用シーン（見出しなど）",
    "googleFont": "Google Fontsの正確なフォント名"
  },
  "secondary": {
    "name": "フォント名",
    "category": "カテゴリ",
    "usage": "使用シーン",
    "googleFont": "Google Fontsの正確なフォント名"
  },
  "accent": {
    "name": "フォント名",
    "category": "カテゴリ",
    "usage": "使用シーン（アクセント、キャプションなど）",
    "googleFont": "Google Fontsの正確なフォント名"
  },
  "rationale": "このフォントシステムを選んだ理由（200字以内）",
  "pairingSample": {
    "heading": "このブランドのヘッディングサンプルテキスト",
    "body": "このブランドのボディテキストサンプル（日本語可）",
    "caption": "CAPTION SAMPLE"
  }
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
        }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const content = data.choices[0]?.message?.content || "{}";

    try {
        return JSON.parse(content.trim());
    } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error("Failed to parse font proposal");
    }
}

// ─── ChatGPT: Color Palette ──────────────────────────────────────────────────

export async function generateColorPalette(brand: BrandData): Promise<ColorPalette> {
    const prompt = `あなたはプロのブランドデザイナーです。
以下のBrand Identity System (BIS) データに基づいて、このブランドに最適なカラーパレットを提案してください。

BISデータ:
- ブランド名(EN): ${brand.name.en}
- ブランド名(JP): ${brand.name.jp}
- タグライン: ${brand.taglineLong.en}
- 定義: ${brand.definition.en}
- コアバリュー: ${brand.coreValues.map(v => v.title + ": " + v.en).join(", ")}
- 哲学: ${brand.bxPhilosophy.en}
- マニフェスト: ${brand.manifesto.en.join(" / ")}

重要: カラーパレットはこのブランドの本質と哲学を体現すること。
ありきたりな色（純粋な赤・青・緑）は避け、独自のトーンとニュアンスを持つ色を選んでください。

以下のJSON形式のみで回答してください:

{
  "primary": {
    "name": "カラー名（例: Midnight Slate）",
    "hex": "#000000",
    "rgb": "rgb(0,0,0)",
    "usage": "主要使用シーン"
  },
  "secondary": {
    "name": "カラー名",
    "hex": "#000000",
    "rgb": "rgb(0,0,0)",
    "usage": "使用シーン"
  },
  "accent": {
    "name": "カラー名",
    "hex": "#000000",
    "rgb": "rgb(0,0,0)",
    "usage": "アクセント使用シーン"
  },
  "neutral": {
    "name": "カラー名",
    "hex": "#000000",
    "rgb": "rgb(0,0,0)",
    "usage": "ニュートラル使用シーン"
  },
  "background": {
    "name": "カラー名",
    "hex": "#000000",
    "rgb": "rgb(0,0,0)",
    "usage": "背景使用シーン"
  },
  "rationale": "このカラーシステムを選んだ理由（200字以内）",
  "mood": "このパレットが表現するムード・感情（例: 静謐な知性、温かみのある革新）"
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 800,
        }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const content = data.choices[0]?.message?.content || "{}";

    try {
        return JSON.parse(content.trim());
    } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error("Failed to parse color palette");
    }
}

// ─── Google Imagen 3: Image Generation ───────────────────────────────────────

// AI Studio (generativelanguage.googleapis.com) で使えるモデル一覧
// Vertex AI専用の -002 は使えないため -001 または Imagen 4 を使う
const IMAGEN_MODELS = [
    "imagen-4.0-generate-001",       // Imagen 4 (最新・GA)
    "imagen-3.0-generate-001",       // Imagen 3 (AI Studio対応)
    "imagen-3.0-fast-generate-001",  // Imagen 3 Fast (フォールバック)
];

async function callImagenModel(model: string, prompt: string): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${GOOGLE_AI_KEY}`;

    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
                sampleCount: 1,
                aspectRatio: "4:3",
                safetyFilterLevel: "block_only_high",
                personGeneration: "allow_adult",
            },
        }),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`Imagen API error (${model}): ${res.status} - ${errData?.error?.message || "Unknown error"}`);
    }

    const data = await res.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error(`No image returned from model: ${model}`);
    return `data:image/png;base64,${b64}`;
}

async function generateWithImagen(prompt: string): Promise<string> {
    if (!GOOGLE_AI_KEY) {
        throw new Error(
            "Google AI APIキーが未設定です\n" +
            ".env ファイルに VITE_GOOGLE_AI_KEY を追加してください\n" +
            "キーの取得: https://aistudio.google.com/apikey"
        );
    }

    // 利用可能なモデルを順番に試す
    let lastError: Error | null = null;
    for (const model of IMAGEN_MODELS) {
        try {
            console.log(`Trying Imagen model: ${model}`);
            const url = await callImagenModel(model, prompt);
            console.log(`✅ Success with model: ${model}`);
            return url;
        } catch (e: any) {
            console.warn(`⚠️ ${model} failed:`, e.message);
            lastError = e;
            // 404 (モデル未対応) の場合は次を試す、それ以外はすぐ throw
            if (!e.message.includes("404") && !e.message.includes("not found") && !e.message.includes("not supported")) {
                throw e;
            }
        }
    }
    throw lastError ?? new Error("すべてのImagen モデルが利用できませんでした");
}

// Build Imagen prompt from BIS data
function buildImagePrompt(brand: BrandData, type: "illustration" | "keyvisu" | "iconography" | "logo"): string {
    const name = brand.name.en || "Brand";
    const essence = brand.essence.en || brand.bxPhilosophy.en || "";
    const values = brand.coreValues.slice(0, 3).map(v => v.title).join(", ");
    const tagline = brand.taglineLong.en || "";
    const manifesto = brand.manifesto.en[0] || "";

    const styleKeywords = [
        essence.toLowerCase().includes("minimal") ? "minimalist" : "",
        essence.toLowerCase().includes("bold") ? "bold graphic" : "",
        essence.toLowerCase().includes("natural") ? "organic textures" : "",
        values.toLowerCase().includes("innovation") ? "futuristic" : "",
        values.toLowerCase().includes("tradition") ? "classic refined" : "",
    ].filter(Boolean).join(", ") || "modern sophisticated";

    switch (type) {
        case "illustration":
            return `Brand illustration for "${name}", a brand about: ${essence}. Core values: ${values}. Style: editorial vector illustration, ${styleKeywords}, clean composition, professional brand design system, white background, no text, no words, abstract conceptual art representing "${manifesto}". High quality, print-ready.`;

        case "keyvisu":
            return `Key visual hero image for brand "${name}". Brand essence: ${essence}. Tagline: "${tagline}". Style: ${styleKeywords}, dramatic lighting, premium brand photography aesthetic, cinematic composition, aspirational mood, high-impact visual, no text overlay, professional commercial photography style. Aspect ratio 4:3, ultra high definition.`;

        case "iconography":
            return `Icon set concept for brand "${name}". Brand values: ${values}. Style: consistent icon system, ${styleKeywords}, line icons or filled icons in unified style, brand-appropriate visual language, showing 6-8 related icons on neutral background, clean grid layout, vector graphic, monochromatic or dual-tone color scheme.`;

        case "logo":
            return `Minimalist logo concept for brand "${name}". Brand essence: ${essence}. Style: ${styleKeywords}, contemporary logo mark, geometric or typographic, premium brand identity design, isolated on white background, professional graphic design, scalable vector style, symbolic abstract mark or lettermark, no photorealistic elements.`;
    }
}

export async function generateIllustration(brand: BrandData): Promise<GeneratedImage> {
    const prompt = buildImagePrompt(brand, "illustration");
    const url = await generateWithImagen(prompt);
    return { url, prompt, type: "illustration" };
}

export async function generateKeyVisual(brand: BrandData): Promise<GeneratedImage> {
    const prompt = buildImagePrompt(brand, "keyvisu");
    const url = await generateWithImagen(prompt);
    return { url, prompt, type: "keyvisu" };
}

export async function generateIconography(brand: BrandData): Promise<GeneratedImage> {
    const prompt = buildImagePrompt(brand, "iconography");
    const url = await generateWithImagen(prompt);
    return { url, prompt, type: "iconography" };
}

export async function generateLogo(brand: BrandData): Promise<GeneratedImage> {
    const prompt = buildImagePrompt(brand, "logo");
    const url = await generateWithImagen(prompt);
    return { url, prompt, type: "logo" };
}

// ─── ChatGPT: Motion Concept ──────────────────────────────────────────────────

export async function generateMotionConcept(brand: BrandData): Promise<MotionConcept> {
    const prompt = `あなたはブランドモーションデザイナーです。
以下のBISデータに基づいて、このブランドのモーション・アニメーション言語を定義してください。

BISデータ:
- ブランド名: ${brand.name.en}
- タグライン: ${brand.taglineLong.en}
- 定義: ${brand.definition.en}
- コアバリュー: ${brand.coreValues.map(v => v.title + ": " + v.en).join(", ")}
- 哲学: ${brand.bxPhilosophy.en}
- エッセンス: ${brand.essence.en}

以下のJSON形式のみで回答してください:

{
  "style": "モーションスタイル（例: Fluid Organic、Sharp Decisive、Gentle Breathingなど）",
  "easing": "推奨イージング（例: cubic-bezier(0.25, 0.1, 0.25, 1)）",
  "duration": "標準トランジション時間（例: 400ms）",
  "keyframes": [
    "キーフレーム原則1（例: Elements fade in from below with subtle blur）",
    "キーフレーム原則2",
    "キーフレーム原則3"
  ],
  "colorTransitions": "カラートランジションの特徴",
  "typography": "テキストアニメーションの特徴",
  "overallFeel": "全体的なモーションの感覚（200字以内）",
  "recommendedTools": ["推奨ツール1", "推奨ツール2", "推奨ツール3"],
  "lottieDescription": "このブランドのLottieアニメーションのコンセプト説明"
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 800,
        }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const content = data.choices[0]?.message?.content || "{}";

    try {
        return JSON.parse(content.trim());
    } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error("Failed to parse motion concept");
    }
}
