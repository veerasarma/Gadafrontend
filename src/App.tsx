import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PostProvider } from "./contexts/PostContext";
import { StoryProvider } from "@/contexts/StoryContext";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import ActivationPage from "./pages/Activation";
import FriendsPage from "./pages/Friends";
import SavedPostsPage from "./pages/SavedPostsPage";
import MemoriesPage from "./pages/MemoriesPage";
import GroupsPage   from '@/pages/GroupsPage';
// import GroupDetailPage from '@/pages/GroupDetailPage';
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ReelsCreatePage from "@/pages/ReelsCreatePage";
import ReelsFeedPage from "@/pages/ReelsFeedPage";
import NotificationsPage from "@/pages/NotificationsPage";
import PostPermalinkPage from "@/pages/PostPermalinkPage";
// import { GroupProvider } from '@/contexts/GroupContext';
import { ReelProvider } from "@/contexts/ReelContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import SettingsPage from "@/pages/SettingsPage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import RepresentativePage from "@/pages/RepresentativePage";
import PointsPage from "@/pages/PointsPage";
import HashtagPage from '@/pages/HashtagPage';


import { RequireAuth } from "@/components/routing/RequireAuth";
import { RequireRole } from "@/components/routing/RequireRole";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";
import AdminPosts from "@/pages/admin/AdminPosts";

import NotFound from "./pages/NotFound";
import Packages from "./pages/Packages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PostProvider>
        <StoryProvider>
          <TooltipProvider>
            <NotificationProvider>
              <Toaster
                position="top-right"
                richColors
                closeButton
                theme="system"
              />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Feed />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="*" element={<ComingSoonPage />} />
                  <Route
                    path="activation/:token"
                    element={<ActivationPage />}
                  />
                  <Route path="friends" element={<FriendsPage />} />
                  <Route path="saved" element={<SavedPostsPage />} />
                  <Route path="/memories" element={<MemoriesPage />} />
                   <Route path="/groups" element={<GroupsPage />} />
              {/* <Route path="/groups/:groupId" element={<GroupProvider><GroupDetailPage /></GroupProvider>} />  */}
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/wallet" element={<PaymentsPage />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/points" element={<PointsPage />} />
                  <Route path="/reels/create" element={<ReelsCreatePage />} />
                  <Route
                    path="/reels"
                    element={
                      <ReelProvider>
                        <ReelsFeedPage />
                      </ReelProvider>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route
                    path="/posts/:postId"
                    element={<PostPermalinkPage />}
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/representative" element={<RepresentativePage />} />
                  <Route path="/hashtag/:tag" element={<HashtagPage />} />

                  <Route
                    path="/admin"
                    element={
                      <RequireAuth>
                        <RequireRole roles={["admin"]}>
                          <AdminLayout />
                        </RequireRole>
                      </RequireAuth>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="profile" element={<AdminProfilePage />} />
                    <Route path="posts" element={<AdminPosts />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </TooltipProvider>
        </StoryProvider>
      </PostProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
