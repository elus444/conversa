import { Suspense, lazy } from "react";
import { useAuth } from "./hooks/use-auth";
import { Loader } from "lucide-react"
import { Routes, Route } from "react-router-dom";
import MainLayout from "./MainLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ConversationLayout from "./components/layout/ConversationLayout";

// Route-level code splitting: each page ships as its own chunk instead of
// one monolithic bundle, so the browser only downloads what a given visit
// actually needs (e.g. a first-time visitor never pays for the dashboard's
// JS just to see the landing page).
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const User = lazy(() => import("./pages/User"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const StarredMessages = lazy(() => import("./pages/StarredMessages"));
const Conversations = lazy(() => import("./pages/Conversations"));
const ConversationDetail = lazy(() => import("./pages/ConversationDetail"));

const PageFallback = () => (
  <div className="flex gap-2 min-h-dvh items-center justify-center p-6">
    <Loader className="animate-spin" />
  </div>
)

export function App() {

  const { isUserLoading } = useAuth();

  if (isUserLoading) {
    return (
      <div className="flex gap-2 min-h-dvh items-center justify-center p-6">
        <p className="text-lg">Please wait while we authenticate you</p>
        <Loader className="animate-spin" />
      </div>
    )
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route element={<DashboardLayout />}>
            <Route path="/user" element={<User />} />
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/starred" element={<StarredMessages />} />
            <Route element={<ConversationLayout />}>
              <Route path="/user/conversations" element={<Conversations />} />
              <Route path="/user/conversations/:id" element={<ConversationDetail />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
