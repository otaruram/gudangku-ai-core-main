import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { clearSensitiveSessionData } from '@/lib/sessionData';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUserId, setLastUserId] = useState<string | null>(null);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const currentUserId = user?.id ?? null;
        if (lastUserId !== null && lastUserId !== currentUserId) {
            clearSensitiveSessionData();
        }
        setLastUserId(currentUserId);
    }, [user?.id]);

    const value = {
        session,
        user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
