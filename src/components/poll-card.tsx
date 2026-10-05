'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { castPollVotesAction } from '@/lib/actions';
import type { PollData } from '@/lib/data';

/** Konu içinde anket kartı: oy ver + canlı sonuçlar */
export default function PollCard({ poll, topicId }: { poll: PollData; topicId: string }) {
  const [sel, setSel] = useState<string[]>(poll.myVotes);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    setSel((s) =>
      poll.multiple ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]
    );
  }

  function vote() {
    setErr(null);
    const fd = new FormData();
    fd.set('poll_id', poll.id);
    fd.set('topic_id', topicId);
    sel.forEach((o) => fd.append('option_id', o));
    start(async () => {
      const res = await castPollVotesAction(fd);
      if (res.ok) router.refresh();
      else setErr(res.error ?? 'Oy verilemedi.');
    });
  }

  return (
    <div className="poll-card">
      <div className="poll-q">📊 {poll.question}</div>
      {poll.options.map((o) => {
        const pct = poll.totalVoters ? Math.round((o.votes / poll.totalVoters) * 100) : 0;
        const mine = poll.myVotes.includes(o.id);
        return (
          <div key={o.id} className="poll-row">
            <button
              type="button"
              className={`poll-opt${sel.includes(o.id) ? ' sel' : ''}${mine ? ' mine' : ''}`}
              onClick={() => toggle(o.id)}
            >
              <span className="poll-radio">{poll.multiple ? '▢' : '○'}</span>
              <span className="poll-label">{o.label}</span>
              <span className="poll-pct">%{pct}</span>
            </button>
            <div className="poll-bar">
              <i style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </div>
        );
      })}
      <div className="poll-foot">
        <span>{poll.totalVoters} üye oy kullandı</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={vote}
          disabled={pending || sel.length === 0}
        >
          {pending ? 'Kaydediliyor…' : poll.myVotes.length ? 'Oyu Güncelle' : 'Oyla'}
        </button>
        {err && <span className="re-status err">{err}</span>}
      </div>
    </div>
  );
}
