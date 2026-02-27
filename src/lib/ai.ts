import { BrandData } from "../types";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const MODEL = "gpt-4o-mini";

interface ConversationMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

const SYSTEM_PROMPT = `あなたはユーザーの「ブランドや活動のアイデンティティ」を一緒に言語化していく、気さくな話し相手です。
専門用語を使わず、自然な会話のトーンで進めてください。

必要以上に同意するのではなく、私の率直でハイレベルなアドバイザーとして振る舞ってください。
行動する意欲を奪わないことも意識しつつ、甘さや曖昧さがあれば、はっきり指摘してください。
私をむやみに肯定する必要はありませんが、真実をできるだけストレートに伝えてください。ただし、人格ではなく「思考・行動・戦略」にフォーカスしてフィードバックしてください。
私の思考に挑戦し、私の前提に疑問を投げかけ、私が避けている盲点を明らかにしてください。
直接的で合理的なフィードバックを、フィルターを最小限にして提示してください。
もし私の論理が弱いなら、そのどこが・なぜ弱いのかを分解して示してください。
もし私が自分自身をごまかしたり、現実から目をそらしていたりするなら、それを具体的に指摘してください。
もし私が不快なことや時間の無駄になることを避けているなら、その事実と、そこで失っている機会・成長のチャンス（機会費用）を説明してください。
私の状況を、できる限り客観的かつ戦略的な視点で捉え、私がどこで言い訳をしているか、小さくまとまろうとしているか、リスクや労力を過小評価しているかを示してください。
そのうえで、次のレベルに到達するために、思考・行動・心構えのうち何をどの順番で変えるべきか、優先順位付きの具体的なプランを提示してください。
伝えるべきことからは逃げず、必要な場面では手加減せずにフィードバックしてください。同時に、私が前進しやすくなるような形で表現することも意識してください。
私を、慰めによってではなく、現実と向き合うことで成長しようとしている人間として扱ってください。
可能な限り、私の言葉の行間から読み取れる個人的な本音や背景も踏まえたうえで、応答してください。

あなたが引き出したい情報は以下の7つですが、ユーザーにはその構造を見せないでください。
あくまで「自然な会話の流れ」で、状況に応じて自然な流れになるものから聞いていってください。

1. name（プロジェクト・ブランドの名前）
2. essence（ブランド・エッセンス：ブランドの魂や究極の約束。全ての活動の根源となる一言）
3. coreIdentity（コア・アイデンティティ：ブランドが持つべき絶対的な性質。エッセンスを支える3本の柱）
4. keyValue（キー・バリュー：顧客に提供する具体的な価値やベネフィット。何を得られるか）
5. bxCoreValue（BXコア・バリュー：ブランド体験における核心的価値。体験の質を「＋」「－」「×」などのコンセプトで定義）
6. bxPhilosophy（BXデザイン・フィロソフィー：デザイン全体の根本的な考え方・哲学）
7. bxPrinciples（BXデザイン・プリンシパル：具体的な制作における判断基準・原則）

## 大事なルール：
- 専門用語（タグライン、コアバリュー、マニフェスト、デザイン哲学など）は絶対に使わない。
- 強調や案を提示する際、Markdownの太字（**text**）は使用せず、必ず「」で囲んで表現してください。
- 「ターゲットは誰ですか？」「目的は何ですか？」といった、背景情報を聞き出すだけの質問は禁止です。背景が気になったら、それすらも「あなたのターゲットは「これ」か「これ」じゃない？」と具体的な案でぶつけてください。
- 「〜によって、考え方が変わってきます」といった、手順や理由の説明も不要です。余計な前置きを省き、すぐに本質的な指摘や提案に入ってください。
- ユーザーのメッセージ内に「--- START OF FILE: ファイル名 ---」で囲まれたテキストがある場合、それはシステムがファイルから直接抽出した内容です。「ファイルは見られない」といった返答は**絶対に禁止**です。必ずその内容を詳細に読み解き、ブランド案や戦略の材料として活用してください。複数のファイルがある場合もすべて読み取ってください。

## 質問のスタイル（最重要）：
メッセージの最後は、必ず2〜3個の具体的な「案」や「推測」を含んだ問いかけで終わらせてください。
「あなたが考えた仮説」をぶつけることで、ユーザーが「はい/いいえ/これ」で答えられる状態を常にキープしてください。
`;

const BOARD_EXTRACTION_PROMPT = `以下の会話履歴を読んで、ユーザーのブランドアイデンティティ情報をJSON形式で出力してください。
会話からわかる情報を基に、全てのフィールドをあなたのBest Guessで埋めてください。
プレースホルダーは絶対に使わないでください。必ず具体的な文章を入れてください。
まだ会話に出ていない項目も、文脈から推測して埋めてください。

## 各フィールドの定義と制約
- name: ブランド名。enでもjpでも記入されたままの名前。
- essence: ブランド・エッセンス。ブランドの魂や究極の約束。全ての活動の根源となる一言。enは最大3語の英単語、jpは短いフレーズ。
- coreValues[].title: コア・アイデンティティ。ブランドが持つべき絶対的な性質（エッセンスを支える柱）。最大3語の英単語。
- coreValues[].en/jp: キー・バリュー。顧客に提供する具体的な価値（ユーザーが何を得られるか）。2語程度のフレーズ。
- bxCoreValues: BXコア・バリュー。サービスを通じてユーザーが感じる体験の質を定義。titleは最大3語、en/jpは20文字以内の説明。
- taglineLong: BXデザイン・フィロソフィー。デザイン全体の根本的な考え方・哲学。
- bxPrinciples: BXデザイン・プリンシパル。具体的な制作における判断基準。デザイナーが迷った時に立ち返るルール。titleは最大3語、en/jpは20文字以内の説明。

## フォーマット制約（厳守）
- essence.en: 日本語・句読点不可。例: "Quiet Bold Clarity"。
- coreValues[].title: 例: "Radical Honesty"。
- bxCoreValues[].title: 例: "Quiet Honest Craft"。
- bxPrinciples[].title: 例: "Form Follows Feeling"。

以上のルールに従い、英語名とそれに対応する日本語名を必ずセットで生成してください。
以下のJSON形式のみを出力してください。JSONの前後に説明文やマークダウンは一切含めないでください。純粋なJSONのみです。

{"name":{"en":"Brand Name","jp":"ブランド名"},"taglineLong":{"en":"Full tagline sentence","jp":"日本語キャッチコピー"},"definition":{"en":"Definition sentence","jp":"日本語定義"},"coreValues":[{"title":"Two Words","en":"Two Words","jp":"二語"},{"title":"Two Words","en":"Two Words","jp":"二語"},{"title":"Two Words","en":"Two Words","jp":"二語"}],"bxPhilosophy":{"en":"Philosophy sentence","jp":"哲学"},"bxCoreValues":[{"title":"Three Word Phrase","en":"Short desc under 20 chars.","jp":"20字以内の説明"},{"title":"Three Word Phrase","en":"Short desc under 20 chars.","jp":"20字以内の説明"},{"title":"Three Word Phrase","en":"Short desc under 20 chars.","jp":"20字以内の説明"}],"bxPrinciples":[{"title":"Three Word Phrase","en":"Short desc under 20 chars.","jp":"20字以内の説明"},{"title":"Three Word Phrase","en":"Short desc under 20 chars.","jp":"20字以内の説明"},{"title":"Three Word Phrase","en":"Short desc under 20 chars.","jp":"20字以内の説明"}],"manifesto":{"en":["s1","s2","s3"],"jp":["文1","文2","文3"]},"mission":{"en":"Mission statement","jp":"ミッション"},"vision":{"en":"Vision statement","jp":"ビジョン"},"essence":{"en":"Three Words Max","jp":"日本語三語相当"}}`;


export function parseAiResponse(text: string): { message: string; brandUpdate: Partial<BrandData> | null } {
    console.log("=== Raw AI Response ===");
    console.log(text);

    let message = text;
    let brandUpdate: Partial<BrandData> | null = null;

    // Try to find embedded JSON block (in case AI does include it)
    const patterns = [
        /```bid_update\s*([\s\S]*?)```/,
        /```\s*bid_update\s*([\s\S]*?)```/,
        /```json\s*([\s\S]*?)```/,
        /```\s*\n?\s*(\{[\s\S]*?"name"[\s\S]*?\})\s*\n?```/,
    ];

    let jsonMatch: RegExpMatchArray | null = null;
    for (const pattern of patterns) {
        jsonMatch = text.match(pattern);
        if (jsonMatch) break;
    }

    if (jsonMatch) {
        message = text.replace(jsonMatch[0], "").trim();
        try {
            brandUpdate = JSON.parse(jsonMatch[1].trim());
            console.log("✅ Parsed brand update from inline JSON");
        } catch (e) {
            console.warn("❌ Failed to parse inline JSON");
        }
    } else {
        console.log("ℹ️ No inline JSON found, will use separate extraction call");
    }

    return { message, brandUpdate };
}

// Separate API call to extract brand data from conversation
export async function extractBrandFromConversation(
    conversationHistory: ConversationMessage[]
): Promise<Partial<BrandData> | null> {
    if (!OPENAI_API_KEY) return null;

    console.log("🔄 Extracting brand data from conversation...");

    try {
        const conversationSummary = conversationHistory
            .map(m => `${m.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${m.content}`)
            .join('\n\n');

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: BOARD_EXTRACTION_PROMPT },
                    { role: "user", content: conversationSummary },
                ],
                temperature: 0.3,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            console.warn("❌ Board extraction API error:", response.status);
            return null;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";

        console.log("=== Board extraction response ===");
        console.log(content);

        // Try direct parse first
        try {
            const result = JSON.parse(content.trim());
            console.log("✅ Board extraction succeeded");
            return result;
        } catch (e) {
            // Try to find JSON in the response
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    const result = JSON.parse(match[0]);
                    console.log("✅ Board extraction succeeded (extracted from text)");
                    return result;
                } catch (e2) {
                    console.warn("❌ Board extraction JSON parse failed");
                }
            }
        }
    } catch (e) {
        console.warn("❌ Board extraction error:", e);
    }

    return null;
}

export async function callAI(
    conversationHistory: ConversationMessage[]
): Promise<string> {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "sk-ここにあなたのAPIキーを入力") {
        throw new Error("OpenAI APIキーが設定されていません。.envファイルにVITE_OPENAI_API_KEYを設定してください。");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...conversationHistory,
            ],
            temperature: 0.7,
            max_tokens: 3000,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${response.status} - ${err.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "応答を取得できませんでした。";
}

export function buildConversationHistory(
    messages: { role: "ai" | "user"; content: string }[]
): ConversationMessage[] {
    return messages.map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: m.content,
    }));
}
