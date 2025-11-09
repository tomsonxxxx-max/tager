
import React from 'react';

export const PlayIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z"></path>
  </svg>
);

export const PauseIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v10a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5Zm7 0A1.5 1.5 0 0 1 14 5v10a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5Z"></path>
  </svg>
);

export const LoadingSpinner = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const WandIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69a.75.75 0 0 1 .981.981l-1.564 1.563a.75.75 0 0 1-1.06.001l-3.93-3.93a.75.75 0 0 1 0-1.06l3.93-3.93a.75.75 0 0 1 1.06 0l1.563 1.564a.75.75 0 0 1 .819.162 10.499 10.499 0 0 1-2.28 14.12a10.5 10.5 0 0 1-14.12 2.28.75.75 0 0 1 .162-.819A8.97 8.97 0 0 0 9 18a9 9 0 0 0-9-9 8.97 8.97 0 0 0-3.463.69a.75.75 0 0 1-.981-.981l1.564-1.563a.75.75 0 0 1 1.06-.001l3.93 3.93a.75.75 0 0 1 0 1.06l-3.93 3.93a.75.75 0 0 1-1.06 0L1.718 9.528a.75.75 0 0 1-.819-.162 10.499 10.499 0 0 1 2.28-14.12A10.5 10.5 0 0 1 9.528 1.718Z" clipRule="evenodd" />
    </svg>
);