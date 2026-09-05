/**
 * Centralized socket.io client.
 *
 * Creates a single socket instance with autoConnect: false.  Components never
 * call `io()` themselves — they import this module and use the helpers below.
 */
import { io } from "socket.io-client";

const SOCKET_URL: string =
    import.meta.env.VITE_API_URL ?? "http://localhost:5500";

const socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: { token: localStorage.getItem("auth-token") ?? "" },
});

/* ─── payload types ─────────────────────────────────────────────────────── */

export interface SendMessagePayload {
    conversationId: string;
    text?: string;
    imageUrl?: string;
    replyTo?: string | null;
    // Round-tripped by the server unchanged, purely so the sender's own
    // client can match the real saved message back to its optimistic
    // placeholder — see ConversationDetail.tsx's "receive-message" handler.
    clientTempId?: string;
}

export interface DeleteMessagePayload {
    messageId: string;
    conversationId: string;
    scope: "me" | "everyone";
}

export interface TypingPayload {
    conversationId: string;
    typer: string;
    receiverId: string;
}

export interface EditMessagePayload {
    messageId: string;
    conversationId: string;
    text: string;
}

export interface ReactMessagePayload {
    messageId: string;
    conversationId: string;
    emoji: string;
}

/* ─── connection helpers ───────────────────────────────────────────────── */

/** Attach (or replace) the JWT and open the connection if not already open. */
export const connectSocket = (token: string): void => {
    (socket as unknown as { auth: Record<string, string> }).auth = { token };
    if (!socket.connected) socket.connect();
};

/** Close the connection gracefully (e.g. on logout). */
export const disconnectSocket = (): void => {
    socket.disconnect();
};

/* ─── emitters (every outbound event lives here) ───────────────────────── */

export const emitSetup = (): void => { socket.emit("setup"); };

export const emitJoinChat = (roomId: string): void => {
    socket.emit("join-chat", { roomId });
};

export const emitLeaveChat = (roomId: string): void => {
    socket.emit("leave-chat", roomId);
};

export const emitSendMessage = ({ conversationId, text, imageUrl, replyTo, clientTempId }: SendMessagePayload): void => {
    socket.emit("send-message", { conversationId, text, imageUrl, replyTo, clientTempId });
};

export const emitDeleteMessage = ({ messageId, conversationId, scope }: DeleteMessagePayload): void => {
    socket.emit("delete-message", { messageId, conversationId, scope });
};

export const emitEditMessage = ({ messageId, conversationId, text }: EditMessagePayload): void => {
    socket.emit("edit-message", { messageId, conversationId, text });
};

export const emitReactMessage = ({ messageId, conversationId, emoji }: ReactMessagePayload): void => {
    socket.emit("react-message", { messageId, conversationId, emoji });
};

export const emitTyping = ({ conversationId, typer, receiverId }: TypingPayload): void => {
    socket.emit("typing", { conversationId, typer, receiverId });
};

export const emitStopTyping = ({ conversationId, typer, receiverId }: TypingPayload): void => {
    socket.emit("stop-typing", { conversationId, typer, receiverId });
};

/* ─── raw socket (needed by useEffect listeners in components) ─────────── */
export default socket;
