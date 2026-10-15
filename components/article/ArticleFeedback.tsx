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
    <section className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5">
      {submitted ? (
        <p className="text-center font-medium text-gray-700">Thank you for your feedback!</p>
      ) : commentPrompt ? (
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">Anything we could improve?</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional feedback..."
            rows={3}
            className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary"
            disabled={pending}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => send(commentPrompt, comment)}
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
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
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl transition-transform hover:scale-110 hover:border-gray-300 disabled:opacity-50 disabled:hover:scale-100"
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
