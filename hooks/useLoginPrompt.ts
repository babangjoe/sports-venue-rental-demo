'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function useLoginPrompt(onLoginRequired: () => void) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const loginRequired = searchParams.get('loginRequired');
    const unauthorized = searchParams.get('unauthorized');

    if (loginRequired === 'true') {
      onLoginRequired();
    } else if (unauthorized === 'true') {
      // Show unauthorized message
      alert('You are not authorized to access this page.');
    }

    // Clean up URL parameters
    if (loginRequired || unauthorized) {
      const url = new URL(window.location.href);
      url.searchParams.delete('loginRequired');
      url.searchParams.delete('unauthorized');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, onLoginRequired]);
}