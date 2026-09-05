import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, MoreVertical, Bot, Trash2, CheckCircle, Ban, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { messageApi } from "@/lib/api"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { Separator } from "@/components/ui/separator"
import type { User } from "@/hooks/use-auth"

interface SearchResult {
    _id: string
    text?: string
    conversationId: string
    senderId?: { _id: string; name: string; profilePic: string }
    createdAt: string
}

interface Props {
    receiver: User | null
    conversationId: string
    onClearChat: () => void
    onSelectMode: () => void
    isBlockedByMe: boolean
    onBlock: () => void
    onUnblock: () => void
}

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function lastSeenText(receiver: User | null): string {
    if (!receiver) return ""
    if (receiver.isBot || receiver.isOnline) return "Online"
    if (!receiver.lastSeen) return "Offline"
    const diff = Date.now() - new Date(receiver.lastSeen).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "Last seen just now"
    if (mins < 60) return `Last seen ${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Last seen ${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days === 1) return "Last seen yesterday"
    return `Last seen ${new Date(receiver.lastSeen).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
}

export default function ConversationDetailHeader({ receiver, conversationId, onClearChat, onSelectMode, isBlockedByMe, onBlock, onUnblock }: Props) {
    const navigate = useNavigate()
    const [profileOpen, setProfileOpen] = useState(false)
    const [clearOpen, setClearOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [searching, setSearching] = useState(false)

    // Debounced search-as-you-type, scoped to this conversation. The clear-
    // on-empty case is debounced too (rather than calling setState directly
    // in the effect body) so it composes with the same cleanup/cancellation.
    useEffect(() => {
        if (!searchOpen) return
        const trimmed = query.trim()

        const handle = setTimeout(() => {
            if (!trimmed) { setResults([]); setSearching(false); return }
            setSearching(true)
            messageApi.search<{ results: SearchResult[] }>(trimmed, conversationId)
                .then(({ results }) => setResults(results))
                .catch(() => setResults([]))
                .finally(() => setSearching(false))
        }, 300)

        return () => clearTimeout(handle)
    }, [query, conversationId, searchOpen])

    const jumpToResult = (messageId: string) => {
        setSearchOpen(false)
        setQuery("")
        navigate(`/user/conversations/${conversationId}?highlight=${messageId}`)
    }

    const name = receiver?.name ?? "..."
    const statusText = lastSeenText(receiver)

    return (
        <>
            <div className="flex items-center gap-3 px-3 h-14 border-b shrink-0 bg-background">
                {/* Back */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="-ml-1 shrink-0"
                    onClick={() => navigate("/user/conversations")}
                >
                    <ArrowLeft className="size-5" />
                </Button>

                {/* Avatar + name — clickable to open profile */}
                <button
                    onClick={() => setProfileOpen(true)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer"
                >
                    <div className="relative shrink-0">
                        <Avatar className="size-9">
                            <AvatarImage src={receiver?.profilePic} alt={name} />
                            <AvatarFallback className="bg-primary/15  text-xs font-semibold">
                                {receiver?.isBot ? <Bot className="size-4" /> : initials(name)}
                            </AvatarFallback>
                        </Avatar>
                        {(receiver?.isBot || receiver?.isOnline) && (
                            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight truncate">{name}</p>
                        <p className="text-xs text-muted-foreground leading-tight truncate">
                            {statusText}
                        </p>
                    </div>
                </button>

                {/* Search */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setSearchOpen(true)}
                    title="Search messages"
                >
                    <Search className="size-5" />
                </Button>

                {/* 3-dot dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="size-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-max" align="end">
                        <DropdownMenuItem onClick={onSelectMode}>
                            <CheckCircle className="size-4" />
                            Select messages
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!receiver?.isBot && (
                            isBlockedByMe ? (
                                <DropdownMenuItem onClick={onUnblock}>
                                    <Ban className="size-4" />
                                    Unblock user
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={onBlock} variant="destructive">
                                    <Ban className="size-4" />
                                    Block user
                                </DropdownMenuItem>
                            )
                        )}
                        <DropdownMenuItem
                            onClick={() => setClearOpen(true)}
                            variant="destructive"
                        >
                            <Trash2 className="size-4" />
                            Clear chat
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Profile dialog */}
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Profile</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 pt-2">
                        <div className="relative">
                            <Avatar className="size-24 text-2xl">
                                <AvatarImage src={receiver?.profilePic} alt={name} />
                                <AvatarFallback className="bg-primary/15  font-semibold">
                                    {receiver?.isBot ? <Bot className="size-8" /> : initials(name)}
                                </AvatarFallback>
                            </Avatar>
                            {(receiver?.isBot || receiver?.isOnline) && (
                                <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-green-500 ring-2 ring-background" />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold">{name}</p>
                            <p className="text-sm text-muted-foreground">{statusText}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3 text-sm">
                        {receiver?.email && !receiver.isBot && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
                                <p>{receiver.email}</p>
                            </div>
                        )}
                        {receiver?.about && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">About</p>
                                <p className="text-foreground/80">{receiver.about}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Search dialog */}
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Search in conversation</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="pl-8"
                        />
                        {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="max-h-80 overflow-y-auto -mx-6 px-6 space-y-1">
                        {query.trim() && !searching && results.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No messages found.</p>
                        )}
                        {results.map((r) => (
                            <button
                                key={r._id}
                                onClick={() => jumpToResult(r._id)}
                                className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium text-primary">{r.senderId?.name ?? "Unknown"}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    </span>
                                </div>
                                <p className="text-sm truncate text-foreground/90">{r.text}</p>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Clear chat confirmation */}
            <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove all messages from your view. The other person will still see their messages.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-primary focus:bg-primary active:bg-primary"
                            onClick={() => { setClearOpen(false); onClearChat() }}
                        >
                            Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
