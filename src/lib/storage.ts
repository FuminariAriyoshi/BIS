import { Project, initialEmptyData, INITIAL_AI_MESSAGE } from "../types";
import { supabase } from "./supabase";

const STORAGE_KEY = "bis-gen-projects";

// --- Local Storage Fallback ---
export function loadProjectsLocal(): Project[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function saveProjectsLocal(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// --- Supabase Operations ---
export async function fetchProjectsSupabase() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return null;
    }

    return data.map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        brandData: p.brand_data,
        messages: p.messages,
        phase: p.phase
    })) as Project[];
}

export async function saveProjectSupabase(project: Project) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('projects')
        .upsert({
            id: project.id,
            user_id: user.id,
            name: project.name,
            brand_data: project.brandData,
            messages: project.messages,
            phase: project.phase,
            updated_at: new Date().toISOString()
        });

    if (error) console.error('Error saving project:', error);
}

export async function deleteProjectSupabase(id: string) {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) console.error('Error deleting project:', error);
}

// --- Combined Logic ---
export function createProject(name: string): Project {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        name,
        createdAt: now,
        updatedAt: now,
        brandData: { ...initialEmptyData },
        messages: [{ ...INITIAL_AI_MESSAGE }],
        phase: 'bis',
    };
}
