'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deletePostAction, deleteTopicAction } from '@/lib/actions';

export default function DeleteButtons({
  topicId,
  postId
}: {
  topicId?: string;
  postId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function removeTopic() {
    if (!topicId) return;
    if (!confirm('Bu konu ve tüm cevapları silinsin mi?')) return;
    start(async () => {
      await deleteTopicAction(topicId);
      router.push('/');
      router.refresh();
    });
  }

  function removePost() {
    if (!postId || !topicId) return;
    if (!confirm('Bu cevap silinsin mi?')) return;
    start(async () => {
      await deletePostAction(postId, topicId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="btn btn-sm btn-danger"
      disabled={pending}
      onClick={postId ? removePost : removeTopic}
    >
      Sil
    </button>
  );
}
