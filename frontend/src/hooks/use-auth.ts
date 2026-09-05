import { useState, useEffect } from "react";
import { authApi } from "../lib/api";
import { connectSocket, emitSetup, disconnectSocket } from "../lib/socket";
import { useContext } from "react";
import { createContext } from "react";

export type User = {
    _id: string;
    name: string;
    about: string;
    email: string;
    profilePic: string;
    isOnline: boolean;
    lastSeen: Date;
    isBot: boolean;
    blockedUsers: string[];
    isEmailVerified: boolean;
    emailNotificationsEnabled: boolean;
};

export const useAuthProvider = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isUserLoading, setIsUserLoading] = useState(true);

    const _postLogin = async (token: string, refreshToken?: string, userData?: User | null) => {
        authApi.storeTokens(token, refreshToken);
        if (userData) {
            setUser(userData as User);
        } else {
            const me = await authApi.getMe<User>();
            setUser(me);
        }
        connectSocket(token);
        emitSetup();
    };

    const login = async (email: string, password: string) => {
        const data = await authApi.login({ email, password });
        await _postLogin(data.authtoken, data.refreshToken, data.user as User | undefined);
    };

    const loginWithOtp = async (email: string, otp: string) => {
        const data = await authApi.login({ email, otp });
        await _postLogin(data.authtoken, data.refreshToken, data.user as User | undefined);
    };

    const register = async (name: string, email: string, password: string) => {
        const data = await authApi.register({ name, email, password });
        await _postLogin(data.authtoken, data.refreshToken);
    };

    const logout = () => {
        // Best-effort server-side revocation of the refresh token — fires
        // and forgets, the client clears its own state regardless.
        authApi.logout();
        localStorage.removeItem("auth-token");
        localStorage.removeItem("refresh-token");
        disconnectSocket();
        setUser(null);
    };

    useEffect(() => {
        const bootstrap = async () => {
            const token = localStorage.getItem("auth-token");

            if (!token) {
                setIsUserLoading(false);
                return;
            }

            try {
                // Goes through apiFetch under the hood, so if this access token
                // has already expired by the time the page loads, it transparently
                // refreshes before this call resolves — no separate check needed.
                const user = await authApi.getMe<User>();
                setUser(user);

                connectSocket(localStorage.getItem("auth-token") ?? token);
                emitSetup();
            } catch {
                localStorage.removeItem("auth-token");
                localStorage.removeItem("refresh-token");
            } finally {
                setIsUserLoading(false);
            }
        };

        bootstrap();
    }, []);

    return {
        user,
        setUser,
        isUserLoading,
        login,
        loginWithOtp,
        register,
        logout,
    };
};

type AuthContextType = ReturnType<typeof useAuthProvider>;

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
};
