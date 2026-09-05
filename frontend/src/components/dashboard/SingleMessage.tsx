import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, Trash2, Check, CheckCheck, CheckCircle2, Circle, Star, Reply, Pencil, SmilePlus, X, Clock } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Message } from "@/hooks/use-chat"
import { Button } from "../ui/button"
import { useNavigate } from "react-router-dom"

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

interface Props {
    message: Message
    isMine: boolean
    isBot?: boolean
    receiverId: string
    myId: string
    receiverName: string
    onDelete: (messageId: string, scope: "me" | "everyone") => void
    onStar: (messageId: string) => void
    onReply: (message: Message) => void
    onEdit: (messageId: string, newText: string) => void
    onReact: (messageId: string, emoji: string) => void
    // select-mode props
    selectMode?: boolean
    selected?: boolean
    onToggleSelect?: (id: string) => void
    // highlight / jump-to
    highlighted?: boolean
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// Markdown rendering is shared by bot and regular messages alike — bold,
// italics, links, inline code, and code blocks all work in any message now,
// not just AI replies.
function MessageText({ text, tone }: { text: string; tone: "mine" | "theirs" | "bot" }) {
    return (
        <div className={cn(
            "text-sm leading-relaxed break-all prose prose-sm max-w-none",
            "prose-p:my-1 prose-p:leading-relaxed",
            "prose-headings:font-semibold prose-headings:my-1",
            "prose-h1:text-base prose-h2:text-sm prose-h3:text-sm",
            "prose-ul:my-1 prose-ul:pl-4",
            "prose-ol:my-1 prose-ol:pl-4",
            "prose-li:my-0",
            "prose-pre:bg-black/10 prose-pre:rounded prose-pre:px-2 prose-pre:py-1 prose-pre:text-xs prose-pre:my-1",
            "prose-code:bg-black/10 prose-code:rounded prose-code:px-1 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none",
            "prose-blockquote:border-l-2 prose-blockquote:pl-2 prose-blockquote:my-1 prose-blockquote:text-muted-foreground",
            "prose-strong:font-semibold",
            "prose-a:underline",
            tone === "mine" ? "prose-invert" : "dark:prose-invert"
        )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
    )
}

export default function SingleMessage({ message, isMine, isBot, receiverId, myId, receiverName, onDelete, onStar, onReply, onEdit, onReact, selectMode, selected, onToggleSelect, highlighted }: Props) {
    const [hovered, setHovered] = useState(false)
    const [copied, setCopied] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(message.text ?? "")
    const navigate = useNavigate()

    const isStarred = message.starredBy?.includes(myId)

    // Group reactions by emoji so "3 people reacted 👍" renders as one pill.
    const reactionGroups = (message.reactions ?? []).reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
        acc[r.emoji] ??= { count: 0, mine: false }
        acc[r.emoji].count += 1
        if (r.user === myId) acc[r.emoji].mine = true
        return acc
    }, {})

    const handleCopy = () => {
        if (message.text) {
            navigator.clipboard.writeText(message.text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        }
    }

    const handleRowClick = () => {
        if (selectMode) onToggleSelect?.(message._id)
    }

    const startEdit = () => {
        setEditText(message.text ?? "")
        setIsEditing(true)
    }

    const saveEdit = () => {
        const trimmed = editText.trim()
        if (trimmed && trimmed !== message.text) onEdit(message._id, trimmed)
        setIsEditing(false)
    }

    return (
        <>
            <div
                data-message-id={message._id}
                className={cn(
                    "group flex flex-col gap-1",
                    isMine ? "ml-auto items-end max-w-[75%]" : isBot ? "mr-auto items-start max-w-[85%]" : "mr-auto items-start max-w-[75%]",
                )}
            >
                <div
                    className={cn(
                        "flex items-end gap-2",
                        isMine && "flex-row-reverse",
                        selectMode && "cursor-pointer",
                    )}
                    onMouseEnter={() => { if (!selectMode) setHovered(true) }}
                    onMouseLeave={() => { if (!selectMode) setHovered(false) }}
                    onClick={handleRowClick}
                >
                    {/* Checkbox indicator in select mode */}
                    {selectMode && (
                        <div className="flex items-center shrink-0">
                            {selected
                                ? <CheckCircle2 className="size-5 text-primary" />
                                : <Circle className="size-5 text-muted-foreground" />}
                        </div>
                    )}
                    {/* Bubble */}
                    <div
                        className={cn(
                            "relative px-3.5 py-2 text-sm shadow-sm transition-shadow",
                            isMine
                                ? "bg-primary text-white rounded-2xl rounded-br-sm"
                                : "bg-muted text-foreground rounded-2xl rounded-bl-sm",
                            highlighted && "animate-highlight",
                            message.pending && "opacity-70"
                        )}
                    >
                        {/* Reply preview — shown when this message is a reply to another */}
                        {message.replyTo && !message.softDeleted && (
                            <div
                                onClick={() => { navigate(`/user/conversations/${message.conversationId}?highlight=${message.replyTo?._id}`) }}
                                className={cn(
                                    "my-2 px-2 py-1 rounded border-l-2 text-xs space-y-0.5 max-w-full cursor-pointer",
                                    isMine
                                        ? "border-white/50 bg-white/10"
                                        : "border-primary/50 bg-primary/5 dark:bg-primary/10"

                                )}>
                                <p className={cn("font-semibold truncate", isMine ? "text-white/80" : "text-primary")}>
                                    {message.replyTo.senderId === myId ? "You" : receiverName}
                                </p>
                                <p className={cn("truncate", isMine ? "text-white/60" : "text-muted-foreground")}>
                                    {message.replyTo.softDeleted
                                        ? "This message was deleted"
                                        : message.replyTo.text || "🖼️ Photo"}
                                </p>
                            </div>
                        )}
                        {/* Tombstone for soft-deleted messages */}
                        {message.softDeleted ? (
                            <p className="text-xs italic opacity-60 leading-relaxed select-none">
                                This message was deleted
                            </p>
                        ) : isEditing ? (
                            <div className="flex flex-col gap-1.5 min-w-48">
                                <textarea
                                    autoFocus
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit() }
                                        if (e.key === "Escape") setIsEditing(false)
                                    }}
                                    className={cn(
                                        "resize-none rounded-md bg-black/10 px-2 py-1 text-sm outline-none",
                                        isMine ? "text-white placeholder:text-white/60" : "text-foreground"
                                    )}
                                    rows={2}
                                />
                                <div className="flex items-center justify-end gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="sm" className="h-6 px-2 text-xs" onClick={saveEdit}>Save</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {message.imageUrl && (
                                    <img
                                        src={message.imageUrl}
                                        alt="attachment"
                                        className="max-w-60 max-h-80 rounded-lg mb-1 object-cover"
                                    />
                                )}
                                {message.text && (
                                    <MessageText text={message.text} tone={isMine ? "mine" : isBot ? "bot" : "theirs"} />
                                )}
                            </>
                        )}
                        <span
                            className={cn(
                                "flex items-center justify-end gap-1 text-[10px] mt-0.5 leading-none",
                                isMine ? "text-white/60" : "text-muted-foreground"
                            )}
                        >
                            {message.editedAt && !message.softDeleted && <span className="italic">edited</span>}
                            {formatTime(message.createdAt)}
                            {isMine && (() => {
                                if (message.pending) return <Clock className="size-3 shrink-0" />
                                const seen = message.seenBy?.some((s) => s.user === receiverId)
                                return seen
                                    ? <CheckCheck className="size-3 text-sky-300 shrink-0" />
                                    : <Check className="size-3 shrink-0" />
                            })()}
                        </span>
                    </div>

                    {/* Hover action buttons — hidden in select mode, while editing, for tombstones (no copy; only hide if mine), and while the send is still in flight (no real ID to act on yet) */}
                    {!selectMode && !isEditing && !message.pending && (
                        <div
                            className={cn(
                                "flex items-center gap-1 transition-opacity duration-150",
                                hovered ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                        >
                            {/* React button — always available except for tombstones */}
                            {!message.softDeleted && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            size={"icon"}
                                            variant={"secondary"}
                                            title="React"
                                            className="flex items-center justify-center size-7 rounded-full"
                                        >
                                            <SmilePlus className="size-3.5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-1.5 flex gap-1">
                                        {QUICK_REACTIONS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => onReact(message._id, emoji)}
                                                className="text-lg hover:scale-125 transition-transform p-1 rounded"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            )}
                            {/* Reply button — always available except for tombstones */}
                            {!message.softDeleted && (
                                <Button
                                    size={"icon"}
                                    variant={"secondary"}
                                    onClick={() => onReply(message)}
                                    title="Reply"
                                    className="flex items-center justify-center size-7 rounded-full"
                                >
                                    <Reply className="size-3.5" />
                                </Button>
                            )}
                            {/* Edit button — own text-only messages */}
                            {isMine && message.text && !message.softDeleted && (
                                <Button
                                    size={"icon"}
                                    variant={"secondary"}
                                    onClick={startEdit}
                                    title="Edit"
                                    className="flex items-center justify-center size-7 rounded-full"
                                >
                                    <Pencil className="size-3.5" />
                                </Button>
                            )}
                            {/* Star button — always available */}
                            {!message.softDeleted && (
                                <Button
                                    size={"icon"}
                                    variant={"secondary"}
                                    onClick={() => onStar(message._id)}
                                    title={isStarred ? "Unstar" : "Star"}
                                    className={cn(
                                        "flex items-center justify-center size-7 rounded-full",
                                        isStarred && "text-yellow-400"
                                    )}
                                >
                                    <Star className={cn("size-3.5", isStarred && "fill-yellow-400")} />
                                </Button>
                            )}
                            {message.text && !message.softDeleted && (
                                <Button
                                    size={"icon"}
                                    variant={"secondary"}
                                    onClick={handleCopy}
                                    title="Copy"
                                    className="flex items-center justify-center size-7 rounded-full"
                                >
                                    {copied
                                        ? <Check className="size-3.5 text-green-500" />
                                        : <Copy className="size-3.5" />
                                    }
                                </Button>
                            )}
                            {/* Show delete button for: own messages always; received messages always; tombstones only if isMine */}
                            {(!message.softDeleted || isMine) && (
                                <Button
                                    size={"icon"}
                                    variant={"destructive"}
                                    onClick={() => setDeleteOpen(true)}
                                    title="Delete"
                                    className="flex items-center justify-center size-7 rounded-full"
                                >
                                    <Trash2 className="size-3.5 text-muted-foreground group-hover:text-inherit" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Reaction pills */}
                {Object.keys(reactionGroups).length > 0 && (
                    <div className={cn("flex flex-wrap gap-1", isMine && "justify-end")}>
                        {Object.entries(reactionGroups).map(([emoji, { count, mine }]) => (
                            <button
                                key={emoji}
                                onClick={() => onReact(message._id, emoji)}
                                title={mine ? "Remove your reaction" : "React"}
                                className={cn(
                                    "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
                                    mine ? "bg-primary/10 border-primary/40" : "bg-muted border-transparent hover:border-foreground/20"
                                )}
                            >
                                <span>{emoji}</span>
                                {count > 1 && <span className="text-muted-foreground">{count}</span>}
                                {mine && <X className="size-2.5 opacity-50" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete message</AlertDialogTitle>
                        <AlertDialogDescription>
                            {message.softDeleted
                                ? "This message is already deleted for everyone. Remove it from your view?"
                                : "Choose how you want to delete this message."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-2">
                        {/* Delete for everyone: only own non-tombstone messages */}
                        {isMine && !message.softDeleted && (
                            <AlertDialogAction
                                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => { setDeleteOpen(false); onDelete(message._id, "everyone") }}
                            >
                                Delete for everyone
                            </AlertDialogAction>
                        )}
                        {/* Delete for me: own messages + received messages + own tombstones */}
                        <AlertDialogAction
                            className="w-full"
                            onClick={() => { setDeleteOpen(false); onDelete(message._id, "me") }}
                        >
                            Delete for me
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
