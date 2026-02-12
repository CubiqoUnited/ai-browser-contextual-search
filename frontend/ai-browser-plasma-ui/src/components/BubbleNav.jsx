import React, { useState, useEffect } from 'react';

export function BubbleNav({ query, onBubbleClick }) {
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        if (!query || query.length < 3) {
            setBubbles([]);
            return;
        }

        const timer = setTimeout(() => {
            fetch('http://localhost:3000/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partial_query: query })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.bubbles) setBubbles(data.bubbles);
                })
                .catch(err => console.error('Bubble fetch error:', err));
        }, 300); // Debounce

        return () => clearTimeout(timer);
    }, [query]);

    if (bubbles.length === 0) return null;

    return (
        <div className='bubble-nav-container'>
            {bubbles.map((b, i) => (
                <button key={i} className='nav-bubble' onClick={() => onBubbleClick(b)}>
                    <span className='bubble-label'>{b.label}</span>
                    {b.intent && <span className='bubble-intent-dot'>•</span>}
                </button>
            ))}
        </div>
    );
}
