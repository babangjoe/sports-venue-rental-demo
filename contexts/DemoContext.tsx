'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    isDemoInitialized,
    seedDemoData,
    resetDemoData,
    DEMO_STORAGE_KEYS,
} from '@/lib/demoStore';

interface DemoContextType {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    resetDemo: () => Promise<void>;
}

const DemoContext = createContext<DemoContextType>({
    isInitialized: false,
    isLoading: true,
    error: null,
    resetDemo: async () => { },
});

export function useDemoContext() {
    return useContext(DemoContext);
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initializeDemo = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if already initialized
            if (isDemoInitialized()) {
                console.log('Demo already initialized, using existing localStorage data.');
                setIsInitialized(true);
                setIsLoading(false);
                return;
            }

            // Fetch seed data from API (which reads from Supabase)
            console.log('Fetching demo seed data from Supabase...');
            const response = await fetch('/api/demo-seed');

            if (!response.ok) {
                throw new Error('Failed to fetch demo seed data');
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Seed localStorage with the fetched data
                seedDemoData(result.data);
                console.log('Demo data seeded successfully!');
                setIsInitialized(true);
            } else {
                throw new Error(result.error || 'Failed to seed demo data');
            }
        } catch (err) {
            console.error('Error initializing demo:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            // Still mark as initialized so the app can work, just with empty data
            setIsInitialized(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetDemo = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Clear all demo data
            resetDemoData();
            setIsInitialized(false);

            // Re-initialize (re-fetch from Supabase)
            await initializeDemo();

            console.log('Demo data reset and re-seeded successfully!');
        } catch (err) {
            console.error('Error resetting demo:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [initializeDemo]);

    useEffect(() => {
        initializeDemo();
    }, [initializeDemo]);

    return (
        <DemoContext.Provider value={{ isInitialized, isLoading, error, resetDemo }}>
            {children}
        </DemoContext.Provider>
    );
}
