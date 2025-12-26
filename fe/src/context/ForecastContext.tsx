import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    // 1. Initialize from LocalStorage
    const [data, setDataSource] = useState<ForecastData>(() => {
        const saved = localStorage.getItem('forecastData');
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

    // 2. Sync to LocalStorage whenever data changes
    React.useEffect(() => {
        localStorage.setItem('forecastData', JSON.stringify(data));
    }, [data]);

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
        localStorage.removeItem('forecastData');
    };

    return (
        <ForecastContext.Provider value={{ data, setData, resetData }}>
            {children}
        </ForecastContext.Provider>
    );
};
