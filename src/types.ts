export interface BrandData {
    name: { en: string; jp: string };
    taglineLong: { en: string; jp: string };
    definition: { en: string; jp: string };
    coreValues: { title: string; en: string; jp: string }[];
    mission: { en: string; jp: string };
    vision: { en: string; jp: string };
    essence: { en: string; jp: string };
    bxPhilosophy: { en: string; jp: string };
    bxPrinciples: { title: string; en: string; jp: string }[];
    manifesto: { en: string[]; jp: string[] };
}

export interface Message {
    role: 'ai' | 'user';
    content: string;
    dataDraft?: Partial<BrandData>;
}

export interface Project {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    brandData: BrandData;
    messages: Message[];
    /** Future: Brand Elements tab state */
    phase: 'bis' | 'elements';
}

export const initialEmptyData: BrandData = {
    name: { en: "", jp: "" },
    taglineLong: { en: "", jp: "" },
    definition: { en: "", jp: "" },
    coreValues: [],
    mission: { en: "", jp: "" },
    vision: { en: "", jp: "" },
    essence: { en: "", jp: "" },
    bxPhilosophy: { en: "", jp: "" },
    bxPrinciples: [],
    manifesto: { en: [], jp: [] }
};

export const INITIAL_AI_MESSAGE: Message = {
    role: 'ai',
    content: "こんにちは。\n私はあなたのブランドアイデンティティシステム - BIS - を構築するパートナーです。\n今の考えてるビジネス、パーソナルブランド、商品、もしくはやろうとしてることについて教えてください。\n話しながら整理していきましょう。"
};
