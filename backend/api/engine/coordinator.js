const { LocalBridge } = require('./studio/local_bridge');

class Coordinator {
    /**
     * Decides the Strategy based on User Query.
     * Strategies:
     * 1. DEEP_RESEARCH (Web recursive)
     * 2. MEDIA_COMPILATION (Video processing)
     * 3. OFFLINE_ANALYSIS (Local Llama/Patents)
     * 4. HYBRID (Research + Compile)
     */
    static async plan(query, context = {}) {
        const intent = await this.classifyIntent(query);

        console.log(`[COORDINATOR] Intent Detected: ${intent.type}`);
        console.log(`[COORDINATOR] Specialist Assigned: ${intent.specialist}`);

        return {
            id: `plan-${Date.now()}`,
            intent: intent,
            steps: this.generateSteps(intent, query)
        };
    }

    static async classifyIntent(query) {
        const q = query.toLowerCase();

        // Heuristic Classification (Phase 1)
        // In Phase 2, this will use a router LLM (like Mixtral)

        if (q.includes('compile') || q.includes('scene') || q.includes('video') || q.includes('movie')) {
            return {
                type: 'MEDIA_COMPILATION',
                specialist: 'StudioDirector',
                confidence: 0.9
            };
        }

        if (q.includes('patent') || q.includes('offline') || q.includes('local') || q.includes('private')) {
            return {
                type: 'OFFLINE_ANALYSIS',
                specialist: 'LocalAnalyst', // Uses Llama/Mixtral
                confidence: 0.95
            };
        }

        if (q.includes('compare') || q.includes('research') || q.includes('find') || q.includes('why')) {
            return {
                type: 'DEEP_RESEARCH',
                specialist: 'RecursiveAgent',
                confidence: 0.85,
                breadth: 'massive' // Massive search breadth
            };
        }

        // Explicit / Adult Content handling - No filters
        if (q.includes('porn') || q.includes('xxx') || q.includes('adult') || q.includes('nsfw') || q.includes('sex')) {
            return {
                type: 'ADULT_CONTENT',
                specialist: 'RecursiveAgent', // Uses the same powerful engine, just unfiltered
                confidence: 0.99,
                privacy_mode: 'maximum', // Force privacy shield
                breadth: 'massive' // Ensure deep curation for adult content too
            };
        }

        return { type: 'GENERAL_QUERY', specialist: 'QuickSearch', confidence: 0.5 };
    }

    static generateSteps(intent, query) {
        switch (intent.type) {
            case 'MEDIA_COMPILATION':
                return [
                    { tool: 'scout_videos', params: { query } },
                    { tool: 'analyze_scenes', params: { filters: ['action', 'dialogue'] } },
                    { tool: 'compile_video', params: { format: 'mp4', resolution: '1080p' } }
                ];
            case 'OFFLINE_ANALYSIS':
                return [
                    { tool: 'local_inference', params: { model: 'llama-3', system_prompt: 'expert_patent_attorney' } }
                ];
            case 'ADULT_CONTENT':
                return [
                    { tool: 'web_search', params: { depth: 'deep', safe_search: 'off' } }, // Explicitly OFF
                    { tool: 'media_processor', params: { filter: 'none' } } // No censorship on media
                ];
            default:
                return [
                    { tool: 'web_search', params: { depth: 'recursive' } }
                ];
        }
    }
}

module.exports = { Coordinator };
