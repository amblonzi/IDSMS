import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import settingsService from '../services/settingsService';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const data = await settingsService.getSettings();
            setSettings(data);

            // Update document title
            if (data.school_name) {
                document.title = `${data.school_name} - ${data.school_tagline}`;
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const refreshSettings = () => {
        return fetchSettings();
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
