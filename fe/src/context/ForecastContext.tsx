import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { clearSensitiveSessionData, getSessionData, removeSessionData, setSessionData } from '@/lib/sessionData';

// Define the shape of the forecast data
interface ForecastData {
    forecastChart: any[];
    bestSellers: any[];
    stockAlerts: any[];
    hasData: boolean;
    lastUpdated: Date | null;
}

interface ForecastContextType {
    data: ForecastData;
    setData: (data: Partial<ForecastData>) => void;
    resetData: () => void;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

export const useForecast = () => {
    const context = useContext(ForecastContext);
    if (!context) {
        throw new Error("useForecast must be used within a ForecastProvider");
    }
    return context;
};

export const ForecastProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();

    // 1. Initialize from LocalStorage
    const [data, setDataSource] = useState<ForecastData>(() => {
        const saved = getSessionData('forecastData');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse forecast history", e);
            }
        }
        return {
            forecastChart: [],
            bestSellers: [],
            stockAlerts: [],
            hasData: false,
            lastUpdated: null,
        };
    });

    // 2. Sync to SessionStorage whenever data changes
    React.useEffect(() => {
        setSessionData('forecastData', JSON.stringify(data));
    }, [data]);

    React.useEffect(() => {
        // Ensure fresh state when account changes.
        setDataSource({
            forecastChart: [],
            bestSellers: [],
            stockAlerts: [],
            hasData: false,
            lastUpdated: null,
        });
        if (!user) {
            clearSensitiveSessionData();
        }
    }, [user?.id]);

    const setData = (newData: Partial<ForecastData>) => {
        setDataSource(prev => ({
            ...prev,
            ...newData,
            lastUpdated: new Date()
        }));
    };

    const resetData = () => {
        setDataSource({
            forecastChart: [],
            bestSellers: [],
            stockAlerts: [],
            hasData: false,
            lastUpdated: null,
        });
        removeSessionData('forecastData');
    };

    return (
        <ForecastContext.Provider value={{ data, setData, resetData }}>
            {children}
        </ForecastContext.Provider>
    );
};
