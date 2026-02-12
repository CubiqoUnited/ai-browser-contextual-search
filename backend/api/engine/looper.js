const { Coordinator } = require('./coordinator');
const { WebSearcher } = require('./tools/web_searcher');
const { ContentScraper } = require('./tools/content_scraper');
const { ContextGraph } = require('../context_engine');

class Looper {
    constructor() {
        this.searcher = new WebSearcher();
        this.scraper = new ContentScraper();
    }

    /**
     * Main Recursive Loop
     * @param {string} query - User's original query
     * @param {object} options - { depth: number, privacy: boolean }
     */
    async start(query, options = {}) {
        const context = new ContextGraph(); // Ephemeral memory (Privacy Shield)
        let iterations = 0;
        const maxIterations = options.depth === 'deep' ? 4 : 2;

        // Initial Plan
        let plan = await Coordinator.plan(query);
        context.logInteraction('PLAN_CREATED', plan);

        while (iterations < maxIterations) {
            console.log(`[LOOPER] Iteration ${iterations + 1}/${maxIterations}`);

            // 1. Execute Steps
            const newIntel = await this.executeSteps(plan.steps, context);

            // 2. Update Context (Memory)
            context.ingest(newIntel);

            // 3. Critique & Re-Plan
            const audit = await this.evaluateProgress(query, context);

            if (audit.satisfaction > 0.85) {
                console.log('[LOOPER] Satisfaction reached. Stopping recursion.');
                break;
            }

            // Recursion: Generate new steps based on missing info
            console.log('[LOOPER] Insufficient data. Recursion triggered.');
            plan = await Coordinator.replan(query, audit.missing_info);
            iterations++;
        }

        // 4. Final Synthesis
        return this.synthesize(query, context);
    }

    async executeSteps(steps, context) {
        const results = [];
        for (const step of steps) {
            try {
                if (step.tool === 'web_search') {
                    // Pass the 'breadth' param from the plan if it exists, otherwise default
                    const searchOptions = {
                        ...step.params,
                        breadth: plan.intent?.breadth || 'standard'
                    };
                    const urls = await this.searcher.search(step.params.query || query, searchOptions);
                    results.push({ type: 'urls', data: urls });

                    // Trigger automatic deep dive if promising
                    const deepDives = urls.slice(0, 2); // Top 2
                    for (const url of deepDives) {
                        const content = await this.scraper.read(url);
                        results.push({ type: 'content', source: url, data: content });
                    }
                }
                // Add other tools (media, local_bridge) here
            } catch (err) {
                console.error(`[LOOPER] Step failed: ${step.tool}`, err);
            }
        }
        return results;
    }

    async evaluateProgress(query, context) {
        // In a real system, an LLM Judge evaluates this.
        // For now, heuristic check: Do we have > 500 words of content?
        const wordCount = context.getTotalWordCount();
        if (wordCount > 1000) return { satisfaction: 0.9 };
        if (wordCount > 500) return { satisfaction: 0.7, missing_info: 'Need more details' };
        return { satisfaction: 0.3, missing_info: 'Search failed to yield content' };
    }

    async synthesize(query, context) {
        // Mock synthesis: Separating "Main Consensus" from "Confused Alternatives"
        // In a real system, the LLM would cluster these claims.

        return {
            answer: `Based on recursive analysis of ${context.getSourceCount()} sources, the primary consensus is coherent. However, divergent timelines and alternative theories were found.`,
            sources: context.getSources().slice(0, 3), // Top 3 "Official" sources

            // "Confused Alternatives" - The paths not taken or contradictory interactions
            alternatives: [
                {
                    label: "Contrarian Viewpoint",
                    desc: "Some sources argue the opposite effect observed in main studies.",
                    source: "https://contrarian-blog.com"
                },
                {
                    label: "Historical Divergence",
                    desc: "Pre-2000 data suggests a different trend.",
                    source: "https://archive.org"
                }
            ],

            confidence: 0.95
        };
    }
}

module.exports = { Looper };
