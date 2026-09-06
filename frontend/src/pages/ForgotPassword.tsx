import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { Card } from "@/components/ui/card"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

export default function ForgotPassword() {
    const navigate = useNavigate()

    const [step, setStep] = useState<"email" | "reset">("email")
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) {
            toast.error("Please enter your email address.")
            return
        }
        setLoading(true)
        try {
            await authApi.forgotPassword(email.trim())
            // Always advances to the next step regardless of whether the email
            // actually has an account — the backend responds identically
            // either way so this page can't be used to probe registered emails.
            setStep("reset")
            toast.success("If that email has an account, a reset code is on its way.")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6) {
            toast.error("Please enter the complete 6-digit code.")
            return
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.")
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match.")
            return
        }
        setLoading(true)
        try {
            await authApi.resetPassword({ email: email.trim(), otp, newPassword })
            toast.success("Password reset! You can log in with your new password now.")
            navigate("/login", { replace: true })
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Invalid or expired code.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative h-full overflow-hidden bg-background">
            <div className="relative z-10 h-full overflow-y-auto flex flex-col items-center justify-center px-4 py-10">
                <div className="w-full max-w-100 flex flex-col gap-6">

                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                            <MessageCircle className="h-7 w-7 text-primary" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight leading-none text-foreground">
                                Reset your password
                            </h1>
                        </div>
                    </div>

                    <Card className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 dark:shadow-black/25 p-6">
                        {step === "email" ? (
                            <form onSubmit={handleRequestCode} className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Enter the email address on your account and we'll send you a code to reset your password.
                                </p>
                                <div className="space-y-1.5">
                                    <Label htmlFor="fp-email">Email address</Label>
                                    <Input
                                        id="fp-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-primary/90 hover:bg-primary" disabled={loading}>
                                    {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                                    {loading ? "Sending code…" : "Send reset code"}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <Label>Enter code</Label>
                                        <span className="text-xs text-muted-foreground">
                                            Sent to <span className="font-medium text-foreground">{email}</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-center pt-1">
                                        <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={loading}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="fp-new-password">New password</Label>
                                    <div className="relative">
                                        <Input
                                            id="fp-new-password"
                                            type={showPass ? "text" : "password"}
                                            placeholder="Min. 6 characters"
                                            autoComplete="new-password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={loading}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPass((v) => !v)}
                                            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="fp-confirm-password">Confirm new password</Label>
                                    <Input
                                        id="fp-confirm-password"
                                        type={showPass ? "text" : "password"}
                                        placeholder="Repeat your password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-primary/90 hover:bg-primary"
                                    disabled={loading || otp.length !== 6}
                                >
                                    {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                                    {loading ? "Resetting…" : "Reset password"}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setStep("email"); setOtp(""); setNewPassword(""); setConfirmPassword("") }}
                                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ← Use a different email
                                </button>
                            </form>
                        )}
                    </Card>

                    <div className="flex flex-col items-center gap-3">
                        <Link to="/login">
                            <Button variant="link" size="sm" className="text-muted-foreground text-xs h-8">
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Back to login
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    )
}
