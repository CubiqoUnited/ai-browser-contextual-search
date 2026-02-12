class Navigator {
    constructor(contextGraph) {
        this.graph = contextGraph;
    }

    /**
     * Generates predictive bubbles based on partial query and history.
     * @param {string} partialQuery - What the user is currently typing
     * @param {object} context - Previous interactions/entities
     */
    async suggest(partialQuery, context = {}) {
        // 1. Analyze the partial query for keywords
        const keywords = this.extractKeywords(partialQuery);

        // 2. Look at previous context (the "Context Graph")
        const lastEntity = context.lastEntity || null;

        // 3. Generate Bubbles
        // (In production, this calls a fast LLM or uses a graph traversal algorithm)
        const suggestions = this.heuristicSuggestions(keywords, lastEntity);

        return {
            bubbles: suggestions,
            context_update: { confidence: 0.7 }
        };
    }

    extractKeywords(text) {
        if (!text) return [];
        return text.toLowerCase().split(' ').filter(w => w.length > 2);
    }

    heuristicSuggestions(keywords, lastEntity) {
        const q = keywords.join(' ');

        // Example heuristics
        if (q.includes('patent') || q.includes('legal')) {
            return [
                { label: 'Draft for US', intent: 'patent_us' },
                { label: 'Draft for EU', intent: 'patent_eu' },
                { label: 'Prior Art Search', intent: 'search_art' }
            ];
        }

        if (q.includes('video') || q.includes('scene')) {
            return [
                { label: 'Action Scenes', intent: 'filter_action' },
                { label: 'Dialogue Only', intent: 'filter_dialogue' },
                { label: '4K Resolution', intent: 'filter_4k' }
            ];
        }

        if (q.includes('best') || q.includes('top')) {
            return [
                { label: 'Under $100', intent: 'filter_price_low' },
                { label: 'Professional Reviews', intent: 'source_expert' },
                { label: 'Reddit Consensus', intent: 'source_social' }
            ];
        }

        // Default "Explorer" bubbles
        return [
            { label: 'Deep Dive', intent: 'mode_deep' },
            { label: 'Quick Summary', intent: 'mode_fast' },
            { label: 'Visuals', intent: 'mode_images' }
        ];
    }
}

module.exports = { Navigator };
