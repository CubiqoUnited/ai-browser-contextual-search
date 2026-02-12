import React, { useState } from 'react';

const MOCK_RESULTS = [
  {
    type: 'top_pick',
    title: 'Dyson Supersonic',
    price: '$429',
    description: 'Fast, powerful, very quiet. Best for all hair types, minimizes heat damage.',
    tag: 'Top pick based on performance and versatility',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80'
  },
  {
    type: 'alternative',
    title: 'Revlon One-Step Volumizer',
    price: '$39',
    tag: 'Budget-Friendly',
    description: 'Affordable, volumizing, but noisy and bulky for some users.',
    performance: 7,
    price_rating: 10,
    image: 'https://images.unsplash.com/photo-1595475824550-70f90e0b3967?w=200&q=80'
  },
  {
    type: 'alternative',
    title: 'Shark HyperAIR',
    price: '$179',
    tag: 'Fast Drying',
    description: 'Powerful, quick drying, moderate noise.',
    performance: 9,
    price_rating: 8,
    noise: 6,
    image: 'https://images.unsplash.com/photo-1563291074-2bf0ca21d3f9?w=200&q=80'
  }
];

function App() {
  const [view, setView] = useState('landing');
  const [query, setQuery] = useState('');
  const [isFusing, setIsFusing] = useState(false);
  const [fusionStep, setFusionStep] = useState('');
  const [synthesis, setSynthesis] = useState(null);

  const handleSearch = async (overrideQuery) => {
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim()) return;

    setQuery(activeQuery);
    setIsFusing(true);
    setFusionStep('Initializing Stream...');

    try {
      const response = await fetch('http://localhost:3000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery })
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete chunk

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            if (chunk.type === 'progress') {
              setFusionStep(chunk.step);
            } else if (chunk.type === 'complete') {
              setSynthesis(chunk.data);
              setIsFusing(false);
              setView('synthesis');
            } else if (chunk.type === 'error') {
              throw new Error(chunk.message);
            }
          } catch (e) {
            console.warn('Stream parse error', e);
          }
        }
      }

    } catch (err) {
      console.error('Search error:', err);
      setSynthesis({
        intent: { type: 'ERROR', vector: [1, 0, 0] },
        synthesis: {
          curated_answer: "Engine unreachable. Ensure backend is running.",
          confidence: 0
        },
        structure: { entities: [], claims: [], evidence: [] }
      });
      setView('synthesis');
      setIsFusing(false);
    }
  };

  if (isFusing) {
    return (
      <div className='fusion-core-overlay'>
        <div className='plasma-cube-spinner'></div>
        <h3 className='fusion-title'>RECURSIVE THINKING...</h3>
        <div className='model-status-tracker'>
          <p className='current-step'>{fusionStep}</p>
          <div className='step-history'>
            <span>Plan</span> → <span>Search</span> → <span>Read</span> → <span>Synthesize</span>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'synthesis') {
    return (
      <div className='synthesis-view'>
        <div className='syn-header'>
          <div className='syn-search-bar'>
            <button className='back-btn' onClick={() => setView('landing')}>‹</button>
            <span className='query-text'>{query}</span>
            <div className='intent-vector-tag'>
              {synthesis?.metadata?.engine || 'Omniscience v1'}
            </div>
          </div>
          <div className='fusion-consensus-banner'>
            <div className='confidence-score'>
              {Math.floor((synthesis?.confidence || 0.9) * 100)}% CONFIDENCE
              <span className='privacy-badge'>🛡️ Privacy Shield Active</span>
            </div>

            <div className='answer-box'>
              <p>{synthesis?.answer || synthesis?.synthesis?.curated_answer}</p>
            </div>

            {synthesis?.scenes && (
              <div className='studio-widget'>
                <h4>Studio Compilation Ready</h4>
                <div className='video-preview-mock'>[ ▶ Play Compiled Scene ]</div>
                <div className='scene-timeline'>
                  {synthesis.scenes.map((s, i) => (
                    <div key={i} className='scene-marker' style={{ left: s.start }} title={s.tag}></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='syn-content grid-system'>
          <section className='worker-claims'>
            <h3>Specialist Analysis</h3>
            <div className='claims-list'>
              {synthesis?.structure?.claims.map((claim, i) => (
                <div key={i} className='claim-item'>
                  <span className='dot'></span> {claim}
                </div>
              ))}
            </div>
          </section>

          {/* NEW: Confused Alternatives / Perspectives */}
          <section className='perspectives-track'>
            <h3>Divergent Perspectives <span>(At Your Discretion)</span></h3>
            <div className='perspectives-grid'>
              {(synthesis?.alternatives || []).map((alt, i) => (
                <div key={i} className='perspective-card'>
                  <div className='persp-header'>
                    <span className='persp-label'>{alt.label}</span>
                    <a href={alt.source} target="_blank" className='persp-link'>Source ↗</a>
                  </div>
                  <p>{alt.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className='uncertainty-flags'>
            <h3>Uncertainty & Nuance</h3>
            <div className='flags-container'>
              {/* Placeholder for flags */}
            </div>
          </section>
          {/* Evidence & Sources */}
          <section className='evidence-track'>
            <h3>Sources & Evidence</h3>
            <div className='sources-list'>
              {(synthesis?.sources || synthesis?.lanes?.[0]?.items || []).map((src, i) => (
                <div key={i} className='source-card'>
                  <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title || src.url}</a>
                  <span className='source-snippet'>{src.snippet?.substring(0, 60)}...</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className='plasma-container'>
      <h1>AI Browser.</h1>
      <p className='tagline'>Recursive. Private. Unrestricted.</p>

      <div className='plasma-cube-container'>
        <div className='plasma-cube'></div>
      </div>

      <div className='input-container'>
        <div className='search-wrapper'>
          <input
            type='text'
            placeholder='Ask anything (Deep Research, Video, Patents)...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={() => handleSearch()}>→</button>
        </div>
        <BubbleNav query={query} onBubbleClick={(b) => handleSearch(`${query} ${b.label}`)} />
      </div>
    </div>
  );
}

export default App;
