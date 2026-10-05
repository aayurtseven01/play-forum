'use client';

import { useState, useTransition } from 'react';
import { toggleReactionAction } from '@/lib/actions';

export default function LikeButton({
  targetType,
  targetId,
  initialCount,
  initialLiked,
  disabled
}: {
  targetType: 'topic' | 'post';
  targetId: string;
  initialCount: number;
  initialLiked: boolean;
  disabled?: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const res = await toggleReactionAction(targetType, targetId);
      if (res.ok) {
        setLiked(res.liked);
        setCount(res.count);
      }
    });
  }

  return (
    <button
      type="button"
      className={`like-btn ${liked ? 'on' : ''}`}
      onClick={onClick}
      disabled={pending || disabled}
      title={disabled ? 'Beğenmek için giriş yapmalısın' : undefined}
    >
      {liked ? '❤️' : '🤍'} {count}
    </button>
  );
}
