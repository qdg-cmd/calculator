'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to handle closing modals with:
 * 1. Mobile hardware/browser Back button / swipe back (popstate)
 * 2. Escape key
 * 3. Backspace key (when not focused on an input/textarea)
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    let isPoppedByBrowser = false;

    // Push dummy state to browser history so mobile back button closes modal
    try {
      window.history.pushState({ modalOpen: true }, '');
    } catch (e) {
      // Ignore if pushState fails in restricted sandbox
    }

    const handlePopState = () => {
      isPoppedByBrowser = true;
      onCloseRef.current();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Backspace') {
        const target = e.target as HTMLElement | null;
        const isEditing = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        );
        if (!isEditing) {
          e.preventDefault();
          onCloseRef.current();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);

      // If modal was closed by user clicking X / Backdrop / Save, pop the dummy history entry
      if (!isPoppedByBrowser) {
        try {
          if (window.history.state && window.history.state.modalOpen) {
            window.history.back();
          }
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [isOpen]);
}
