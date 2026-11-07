import React, { useState } from 'react';

type FeedbackRating = 'positive' | 'neutral' | 'negative';

const OPTIONS: { rating: FeedbackRating; emoji: string; label: string }[] = [
  { rating: 'positive', emoji: '😊', label: 'Yes, helpful' },
  { rating: 'neutral', emoji: '😐', label: 'Neutral' },
  { rating: 'negative', emoji: '😞', label: 'No, not helpful' },
];

export function ArticleFeedback({ articleId }: { articleId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [commentPrompt, setCommentPrompt] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState('');

  const send = async (rating: FeedbackRating, text?: string) => {
    setPending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, rating, comment: text || undefined }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200/70 bg-gradient-to-br from-gray-50 to-white px-6 py-5 shadow-card">
      {submitted ? (
        <p className="flex animate-fade-up items-center justify-center gap-3 font-medium text-gray-700" role="status">
          <span
            aria-hidden
            className="flex h-8 w-8 animate-pop items-center justify-center rounded-full bg-green-100 text-green-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Thank you for your feedback!
        </p>
      ) : commentPrompt ? (
        <div className="animate-fade-up space-y-3">
          <p className="font-semibold text-gray-900">Anything we could improve?</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional feedback..."
            rows={3}
            className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 shadow-sm transition-shadow focus:border-transparent focus:ring-2 focus:ring-primary"
            disabled={pending}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => send(commentPrompt, comment)}
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-px hover:bg-primary-hover hover:shadow-glow-lg active:translate-y-0 disabled:opacity-50"
            >
              {pending ? 'Sending...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCommentPrompt(null);
                setComment('');
              }}
              disabled={pending}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="font-semibold text-gray-900">Was this article helpful?</p>
          <div className="flex gap-2">
            {OPTIONS.map(({ rating, emoji, label }) => (
              <button
                key={rating}
                type="button"
                onClick={() => (rating === 'positive' ? send(rating) : setCommentPrompt(rating))}
                disabled={pending}
                aria-label={label}
                title={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl shadow-sm transition-all duration-300 ease-spring hover:-translate-y-1 hover:scale-110 hover:border-primary-ring hover:shadow-card-hover active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
