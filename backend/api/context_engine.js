// --- Layer 2 & 3: Context Engine (The Brain Stem) ---

class ContextSnapshotter {
    static createSnapshot(sensorData, metadata) {
        // Compress and anonymize the perception data
        return {
            id: `snapshot-${Date.now()}`,
            visible_intel: sensorData.viewport_text.substring(0, 500), // Compression
            structural_anchors: sensorData.structure.elements,
            interaction_pulse: sensorData.interactions,
            media_state: sensorData.media,
            timestamp: Date.now(),
            ttl: 300000 // 5 minutes ephemeral life
        };
    }
}

class ContextGraph {
    constructor() {
        this.sessionGraph = {
            nodes: [],
            edges: [],
            lastSnapshot: null
        };
    }

    processSnapshot(snapshot) {
        // Semantic state inference (In place of raw keyword extraction)
        const entities = this.extractEntities(snapshot.visible_intel);
        const claims = this.extractClaims(snapshot.visible_intel);

        // Update temporary graph
        entities.forEach(entity => this.addNode(entity, 'entity'));
        claims.forEach(claim => this.addNode(claim, 'claim'));

        this.sessionGraph.lastSnapshot = snapshot;
        return this.sessionGraph;
    }

    extractEntities(text) {
        // Simplified entity extraction (Placeholder for actual NLP layer)
        return text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) || [];
    }

    extractClaims(text) {
        // Identifies "X leads to Y" style claims
        return []; // In a real app, this uses specialized LLM workers
    }

    addNode(label, type) {
        if (!this.sessionGraph.nodes.find(n => n.label === label)) {
            this.sessionGraph.nodes.push({ id: `node-${Date.now()}-${Math.random()}`, label, type });
        }
    }

    getGraph() {
        return this.sessionGraph;
    }
}

module.exports = { ContextSnapshotter, ContextGraph };
