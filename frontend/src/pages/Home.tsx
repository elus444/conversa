import { useState } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"
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

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    }),
}

const Home = () => {
    const { user, login } = useAuth()
    const { theme, setTheme } = useTheme()
    const [guestLoading, setGuestLoading] = useState(false)
    const prefersReducedMotion = useReducedMotion()

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

    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

    return (
        <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-background">
            {/* Ambient animated gradient orbs */}
            {!prefersReducedMotion && (
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <motion.div
                        className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/25 blur-[100px]"
                        animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
                        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-1/3 -right-40 size-[28rem] rounded-full bg-violet-500/20 blur-[120px]"
                        animate={{ x: [0, -50, 30, 0], y: [0, -30, 50, 0] }}
                        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-0 left-1/4 size-80 rounded-full bg-blue-500/15 blur-[100px]"
                        animate={{ x: [0, 40, -40, 0], y: [0, -20, 20, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            )}

            {/* nav */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 lg:px-8 bg-background/70 backdrop-blur-lg border-b border-border/50"
            >
                <span className="font-bold text-lg lg:text-xl">Conversa</span>
                <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                            <motion.span
                                key={theme}
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="flex"
                            >
                                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                            </motion.span>
                        </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/login">
                            <Button variant="secondary" size="sm">Login</Button>
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/signup">
                            <Button size="sm" className="bg-primary/90 hover:bg-primary">Signup</Button>
                        </Link>
                    </motion.div>
                </div>
            </motion.nav>

            {/* hero */}
            <section className="relative px-4 lg:px-8 pt-12 pb-16 lg:pt-24 lg:pb-28">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div className="space-y-6 text-center lg:text-left">
                        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
                            <Badge variant="secondary" className="h-6 px-3">Real-time · AI-powered · Open source</Badge>
                        </motion.div>
                        <motion.h1
                            variants={fadeUp} initial="hidden" animate="show" custom={1}
                            className="font-bold text-5xl lg:text-7xl leading-[1.05] tracking-tight"
                        >
                            Chat,{" "}
                            <span className="bg-gradient-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent">
                                instantly.
                            </span>
                        </motion.h1>
                        <motion.p
                            variants={fadeUp} initial="hidden" animate="show" custom={2}
                            className="text-lg lg:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0"
                        >
                            A full-stack real-time chat app with a built-in AI assistant, media sharing, and everything a modern messenger needs.
                        </motion.p>
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="show" custom={3}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2"
                        >
                            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                                <Link to="/signup">
                                    <Button size="lg" className="text-base px-6 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/25">
                                        Get started
                                    </Button>
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
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
                            </motion.div>
                        </motion.div>
                        <motion.p
                            variants={fadeUp} initial="hidden" animate="show" custom={4}
                            className="text-xs text-muted-foreground"
                        >
                            No signup needed — jumps straight into a live demo account.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: 4 }}
                        animate={{ opacity: 1, scale: 1, rotate: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ rotate: 0, scale: 1.02 }}
                        className="relative mx-auto w-full max-w-md lg:max-w-none"
                    >
                        <motion.div
                            className="absolute inset-0 bg-primary/25 blur-3xl rounded-full scale-90"
                            animate={prefersReducedMotion ? undefined : { opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            aria-hidden
                        />
                        <motion.div
                            animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Card className="relative p-0 ring-1 ring-foreground/10 shadow-2xl overflow-hidden">
                                <img
                                    src="/screenshots/hero.png"
                                    alt="Conversa chat interface showing a live conversation"
                                    className="w-full h-auto block"
                                    loading="eager"
                                />
                            </Card>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* features */}
            <section className="relative px-4 lg:px-8 py-16 lg:py-20 border-t bg-muted/30">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl lg:text-3xl font-bold text-center mb-10"
                    >
                        Everything a modern chat app needs
                    </motion.h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map(({ icon: Icon, title, description }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -6 }}
                            >
                                <Card className="p-6 gap-3 h-full transition-shadow hover:shadow-xl hover:shadow-primary/5">
                                    <motion.div
                                        className="size-10 rounded-lg bg-primary/10 flex items-center justify-center"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                    >
                                        <Icon className="size-5 text-primary" />
                                    </motion.div>
                                    <h3 className="font-semibold">{title}</h3>
                                    <p className="text-sm text-muted-foreground">{description}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* stack */}
            <section className="px-4 lg:px-8 py-16 lg:py-20">
                <div className="max-w-6xl mx-auto text-center space-y-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl lg:text-3xl font-bold"
                    >
                        Built with a modern full-stack toolkit
                    </motion.h2>
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                        className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto"
                    >
                        {STACK.map((tech) => (
                            <motion.div
                                key={tech}
                                variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                                whileHover={{ scale: 1.1, y: -2 }}
                            >
                                <Badge variant="outline" className="h-7 px-3 text-sm cursor-default">{tech}</Badge>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* footer */}
            <footer className="px-4 lg:px-8 py-8 border-t">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© 2026 Conversa. All rights reserved. <a href="https://pankil-soni.github.io/" target="_blank" rel="noreferrer" className="underline text-primary">Pankil Soni</a></p>
                    <motion.a
                        whileHover={{ scale: 1.05, x: 2 }}
                        href="https://github.com/elus444/conversa"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                        <Github className="size-4" /> View source
                    </motion.a>
                </div>
            </footer>
        </div>
    )
}

export default Home
