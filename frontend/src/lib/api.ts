/**
 * Centralized API client.
 *
 * Every HTTP call in the app goes through this file.  If the base URL, auth
 * header, or error-handling logic ever needs to change, there is exactly one
 * place to update.
 */

const API_BASE: string =
    import.meta.env.VITE_API_URL ?? "http://localhost:5500";

/* ─── payload / response types ─────────────────────────────────────────── */

export interface LoginPayload {
    email: string;
    password?: string;
    otp?: string;
}

export interface AuthTokenResponse {
    authtoken: string;
    refreshToken?: string;
    user?: {
        _id: string;
        name: string;
        email: string;
        profilePic: string;
        isEmailVerified: boolean;
    };
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface UpdateProfilePayload {
    name?: string;
    about?: string;
    profilePic?: string;
    oldpassword?: string;
    newpassword?: string;
    emailNotificationsEnabled?: boolean;
}

export type NonFriendsSort = "name_asc" | "name_desc" | "last_seen_recent" | "last_seen_oldest";

export interface NonFriendsParams {
    search?: string;
    sort?: NonFriendsSort;
    page?: number;
    limit?: number;
}

/* ─── helpers ──────────────────────────────────────────────────────────── */

const getToken = (): string => localStorage.getItem("auth-token") ?? "";
const getRefreshToken = (): string => localStorage.getItem("refresh-token") ?? "";

const storeTokens = (authtoken: string, refreshToken?: string) => {
    localStorage.setItem("auth-token", authtoken);
    if (refreshToken) localStorage.setItem("refresh-token", refreshToken);
};

const headers = (extra: Record<string, string> = {}): Record<string, string> => ({
    "Content-Type": "application/json",
    "auth-token": getToken(),
    ...extra,
});

// Access tokens are short-lived (15m) by design — this is what makes that
// workable without constantly bouncing the user back to /login. Every call
// in this file goes through apiFetch instead of the raw fetch(), so a 401
// (expired access token) triggers exactly one silent refresh-and-retry
// before the caller ever sees a failure. Concurrent 401s share a single
// in-flight refresh call rather than each racing to refresh separately.
let refreshInFlight: Promise<boolean> | null = null;

const tryRefresh = (): Promise<boolean> => {
    if (refreshInFlight) return refreshInFlight;

    const refreshToken = getRefreshToken();
    if (!refreshToken) return Promise.resolve(false);

    refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
    })
        .then(async (res) => {
            if (!res.ok) return false;
            const data = await res.json() as AuthTokenResponse;
            storeTokens(data.authtoken, data.refreshToken);
            return true;
        })
        .catch(() => false)
        .finally(() => {
            refreshInFlight = null;
        });

    return refreshInFlight;
};

const apiFetch = async (
    url: string,
    options: RequestInit = {},
    isRetry = false
): Promise<Response> => {
    const res = await fetch(url, options);

    if (res.status === 401 && !isRetry && getRefreshToken()) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            const retryOptions: RequestInit = {
                ...options,
                headers: { ...(options.headers as Record<string, string>), "auth-token": getToken() },
            };
            return apiFetch(url, retryOptions, true);
        }
    }

    return res;
};

const handleResponse = async <T = unknown>(res: Response): Promise<T> => {
    const data = await res.json() as T & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
};

/* ─── auth ─────────────────────────────────────────────────────────────── */

export const authApi = {
    login: (payload: LoginPayload) =>
        fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(payload),
        }).then((res) => handleResponse<AuthTokenResponse>(res)),

    register: (payload: RegisterPayload) =>
        fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(payload),
        }).then((res) => handleResponse<AuthTokenResponse>(res)),

    getMe: <T = unknown>() =>
        apiFetch(`${API_BASE}/auth/me`, {
            headers: headers(),
        }).then((res) => handleResponse<T>(res)),

    sendOtp: (email: string) =>
        fetch(`${API_BASE}/auth/getotp`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ email }),
        }).then(handleResponse),

    sendVerificationOtp: () =>
        apiFetch(`${API_BASE}/auth/send-verification-otp`, {
            method: "POST",
            headers: headers(),
        }).then(handleResponse),

    verifyEmail: (otp: string) =>
        apiFetch(`${API_BASE}/auth/verify-email`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ otp }),
        }).then(handleResponse),

    logout: () =>
        apiFetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: headers(),
        }).then(handleResponse)
            .catch(() => {
                // Best-effort — the client clears its own tokens regardless,
                // so a failed revocation call shouldn't block logging out.
            }),

    storeTokens,
};

/* ─── conversations ────────────────────────────────────────────────────── */

export const conversationApi = {
    list: <T = unknown>() =>
        apiFetch(`${API_BASE}/conversation/`, {
            headers: headers(),
        }).then((res) => handleResponse<T>(res)),

    get: <T = unknown>(id: string) =>
        apiFetch(`${API_BASE}/conversation/${id}`, {
            headers: headers(),
        }).then((res) => handleResponse<T>(res)),

    create: (memberIds: string[]) =>
        apiFetch(`${API_BASE}/conversation/`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ members: memberIds }),
        }).then(handleResponse),

    togglePin: (id: string) =>
        apiFetch(`${API_BASE}/conversation/${id}/pin`, {
            method: "POST",
            headers: headers(),
        }).then((res) => handleResponse<{ isPinned: boolean }>(res)),
};

/* ─── messages ─────────────────────────────────────────────────────────── */

export const messageApi = {
    list: (conversationId: string, page: number = 1, limit: number = 50) =>
        apiFetch(`${API_BASE}/message/${conversationId}?page=${page}&limit=${limit}`, {
            headers: headers(),
        }).then(handleResponse),

    delete: (messageId: string, scope: "me" | "everyone") =>
        apiFetch(`${API_BASE}/message/${messageId}`, {
            method: "DELETE",
            headers: headers(),
            body: JSON.stringify({ scope }),
        }).then(handleResponse),

    bulkDelete: (messageIds: string[]) =>
        apiFetch(`${API_BASE}/message/bulk/hide`, {
            method: "DELETE",
            headers: headers(),
            body: JSON.stringify({ messageIds }),
        }).then(handleResponse),

    clearChat: (conversationId: string) =>
        apiFetch(`${API_BASE}/message/clear/${conversationId}`, {
            method: "POST",
            headers: headers(),
        }).then(handleResponse),

    toggleStar: (messageId: string) =>
        apiFetch(`${API_BASE}/message/${messageId}/star`, {
            method: "POST",
            headers: headers(),
        }).then((res) => handleResponse<{ isStarred: boolean; starredBy: string[] }>(res)),

    getStarred: <T = unknown>() =>
        apiFetch(`${API_BASE}/message/starred`, {
            headers: headers(),
        }).then((res) => handleResponse<T>(res)),

    search: <T = unknown>(q: string, conversationId?: string) => {
        const qs = new URLSearchParams({ q });
        if (conversationId) qs.set("conversationId", conversationId);
        return apiFetch(`${API_BASE}/message/search?${qs.toString()}`, {
            headers: headers(),
        }).then((res) => handleResponse<T>(res));
    },
};

/* ─── users ────────────────────────────────────────────────────────────── */

export const userApi = {
    getOnlineStatus: (userId: string) =>
        apiFetch(`${API_BASE}/user/online-status/${userId}`, {
            headers: headers(),
        }).then(handleResponse),

    getNonFriends: (params: NonFriendsParams = {}) => {
        const qs = new URLSearchParams()
        if (params.search) qs.set("search", params.search)
        if (params.sort)   qs.set("sort",   params.sort)
        if (params.page)   qs.set("page",   String(params.page))
        if (params.limit)  qs.set("limit",  String(params.limit))
        return apiFetch(`${API_BASE}/user/non-friends?${qs.toString()}`, {
            headers: headers(),
        }).then(handleResponse)
    },

    updateProfile: (payload: UpdateProfilePayload) =>
        apiFetch(`${API_BASE}/user/update`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(payload),
        }).then(handleResponse),

    getPresignedUrl: (filename: string, filetype: string, filesize: number) =>
        apiFetch(
            `${API_BASE}/user/presigned-url?filename=${encodeURIComponent(filename)}&filetype=${encodeURIComponent(filetype)}&filesize=${filesize}`,
            { headers: headers() }
        ).then(handleResponse),

    blockUser: (userId: string) =>
        apiFetch(`${API_BASE}/user/block/${userId}`, {
            method: "POST",
            headers: headers(),
        }).then(handleResponse),

    unblockUser: (userId: string) =>
        apiFetch(`${API_BASE}/user/block/${userId}`, {
            method: "DELETE",
            headers: headers(),
        }).then(handleResponse),

    getBlockStatus: (userId: string) =>
        apiFetch(`${API_BASE}/user/block-status/${userId}`, {
            headers: headers(),
        }).then((res) => handleResponse<{ iBlockedThem: boolean; theyBlockedMe: boolean }>(res)),

    deleteAccount: () =>
        apiFetch(`${API_BASE}/user/delete`, {
            method: "DELETE",
            headers: headers(),
        }).then(handleResponse),
};

export { API_BASE };
