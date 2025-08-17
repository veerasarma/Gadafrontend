// src/components/post/ShareModal.tsx
import React, { useState } from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (comment?: string) => Promise<void> | void;
}

export function ShareModal({ isOpen, onClose, onShare }: ShareModalProps) {
  const [comment, setComment] = useState('');

  const handleShare = async () => {
    await onShare(comment.trim() || '');
    setComment('');
    onClose();
  };

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-medium mb-4">Share Post</h2>
      <Textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Say something about this..."
        rows={4}
        className="w-full"
      />
      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleShare} disabled={comment.trim() === ''}>
          Share
        </Button>
      </div>
    </SimpleModal>
  );
}
