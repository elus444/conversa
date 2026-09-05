import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"
import {
    Zap,
    Bot,
    ImageIcon,
    ShieldCheck,
    Github,
    Sun,
    Moon,
    Loader2,
} from "lucide-react"

const GUEST_EMAIL = "guest@conversa.demo"
const GUEST_PASSWORD = "GuestDemo123!"

const FEATURES = [
    {
        icon: Zap,
        title: "Real-time messaging",
        description: "Instant delivery over WebSockets, with live typing indicators and online presence.",
    },
    {
        icon: Bot,
        title: "Built-in AI chatbot",
        description: "Every account gets a personal AI assistant, powered by Google Gemini.",
    },
    {
        icon: ImageIcon,
        title: "Media sharing",
        description: "Send photos in chat and set a profile picture, stored on Cloudflare R2.",
    },
    {
        icon: ShieldCheck,
        title: "Secure by default",
        description: "JWT auth, bcrypt-hashed passwords, rate-limited endpoints, and email verification.",
    },
]

const STACK = [
    "React", "TypeScript", "Vite", "Tailwind CSS",
    "Node.js", "Express", "Socket.io", "MongoDB",
    "Cloudflare R2", "Resend", "Gemini AI",
]

const Home = () => {
    const { user, login } = useAuth()
    const { theme, setTheme } = useTheme()
    const [guestLoading, setGuestLoading] = useState(false)

    if (user) return <Navigate to="/user/conversations" replace />

    const handleGuestLogin = async () => {
        setGuestLoading(true)
        try {
            await login(GUEST_EMAIL, GUEST_PASSWORD)
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't start the guest session")
        } finally {
            setGuestLoading(false)
        }
    }

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    return (
        <div className="h-full w-full overflow-y-auto">
            {/* nav */}
            <nav className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 lg:px-8 bg-background/80 backdrop-blur border-b">
                <span className="font-bold text-lg lg:text-xl">Conversa</span>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </Button>
                    <Link to="/login">
                        <Button variant="secondary" size="sm">Login</Button>
                    </Link>
                    <Link to="/signup">
                        <Button size="sm" className="bg-primary/90 hover:bg-primary">Signup</Button>
                    </Link>
                </div>
            </nav>

            {/* hero */}
            <section className="px-4 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div className="space-y-6 text-center lg:text-left">
                        <Badge variant="secondary" className="h-6 px-3">Real-time · AI-powered · Open source</Badge>
                        <h1 className="font-bold text-5xl lg:text-7xl leading-[1.05] tracking-tight">
                            Chat, instantly.
                        </h1>
                        <p className="text-lg lg:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0">
                            A full-stack real-time chat app with a built-in AI assistant, media sharing, and everything a modern messenger needs.
                        </p>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                            <Link to="/signup">
                                <Button size="lg" className="text-base px-6 bg-primary/90 hover:bg-primary">
                                    Get started
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant="outline"
                                className="text-base px-6"
                                onClick={handleGuestLogin}
                                disabled={guestLoading}
                            >
                                {guestLoading && <Loader2 className="size-4 animate-spin" />}
                                Try as guest
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            No signup needed — jumps straight into a live demo account.
                        </p>
                    </div>

                    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-90" aria-hidden />
                        <Card className="relative p-0 ring-1 ring-foreground/10 shadow-2xl overflow-hidden rotate-1 hover:rotate-0 transition-transform duration-300">
                            <img
                                src="/screenshots/hero.png"
                                alt="Conversa chat interface showing a live conversation"
                                className="w-full h-auto block"
                                loading="eager"
                            />
                        </Card>
                    </div>
                </div>
            </section>

            {/* features */}
            <section className="px-4 lg:px-8 py-16 border-t bg-muted/30">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10">Everything a modern chat app needs</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map(({ icon: Icon, title, description }) => (
                            <Card key={title} className="p-6 gap-3">
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Icon className="size-5 text-primary" />
                                </div>
                                <h3 className="font-semibold">{title}</h3>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* stack */}
            <section className="px-4 lg:px-8 py-16">
                <div className="max-w-6xl mx-auto text-center space-y-6">
                    <h2 className="text-2xl lg:text-3xl font-bold">Built with a modern full-stack toolkit</h2>
                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                        {STACK.map((tech) => (
                            <Badge key={tech} variant="outline" className="h-7 px-3 text-sm">{tech}</Badge>
                        ))}
                    </div>
                </div>
            </section>

            {/* footer */}
            <footer className="px-4 lg:px-8 py-8 border-t">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© 2026 Conversa. All rights reserved. <a href="https://pankil-soni.github.io/" target="_blank" rel="noreferrer" className="underline text-primary">Pankil Soni</a></p>
                    <a
                        href="https://github.com/elus444/conversa"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                        <Github className="size-4" /> View source
                    </a>
                </div>
            </footer>
        </div>
    )
}

export default Home
