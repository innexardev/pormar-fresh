'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Modal({ open, onClose, title, subtitle, size = 'lg', children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`
          relative z-10 flex w-full flex-col
          rounded-t-3xl bg-white shadow-2xl
          sm:rounded-2xl
          ${SIZES[size]}
          max-h-[95dvh] sm:max-h-[90dvh]
          animate-modal-up sm:animate-modal-in
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-stone-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500 transition hover:bg-stone-200 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-stone-100 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
