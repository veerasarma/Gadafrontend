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
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ReelsCreatePage from "@/pages/ReelsCreatePage";
import ReelsFeedPage from "@/pages/ReelsFeedPage";
import NotificationsPage from "@/pages/NotificationsPage";
import PostPermalinkPage from "@/pages/PostPermalinkPage";
import { ReelProvider } from "@/contexts/ReelContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import SettingsPage from "@/pages/SettingsPage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import RepresentativePage from "@/pages/RepresentativePage";
import PointsPage from "@/pages/PointsPage";
import HashtagPage from '@/pages/HashtagPage';
import Messenger from '@/pages/Messenger';
import PagesIndex from '@/pages/PagesIndex';
import PageView from '@/pages/PageView';
import PageCreate from '@/pages/PageCreate';
import PagesInvites from '@/pages/PagesInvites';
import GroupsIndex from '@/pages/GroupsIndex';
import GroupView from '@/pages/GroupView';
import GroupsInvites from '@/pages/GroupsInvites';
import GroupCreate from '@/pages/GroupCreate';
import EventsIndex from '@/pages/EventsIndex';
import EventCreate from '@/pages/EventCreate';
import EventsInvites from '@/pages/EventsInvites';
import EventView from '@/pages/EventView';
import WatchPage from '@/pages/Watch';
import AffiliatesPage from '@/pages/AffiliatesPage';
import AdsManager from '@/pages/AdsManager';
import { ChatDockProvider } from "@/contexts/ChatDockContext";






import { RequireAuth } from "@/components/routing/RequireAuth";
import { RequireRole } from "@/components/routing/RequireRole";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";
import AdminPosts from "@/pages/admin/AdminPosts";
import AdminPages from "@/pages/admin/AdminPages";
import AdminPageCategories from "@/pages/admin/AdminPageCategories";
import AdminPageCategoryForm from "@/pages/admin/AdminPageCategoryForm";
import AdminGroups from "@/pages/admin/AdminGroups";
import AdminGroupCategories from "@/pages/admin/AdminGroupCategories";
import AdminGroupCategoryForm from "@/pages/admin/AdminGroupCategoryForm";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminEventForm from "@/pages/admin/AdminEventForm";
import AdminEventCategoryForm from "@/pages/admin/AdminEventCategoryForm";
import AdminEventCategoriesList from "@/pages/admin/AdminEventCategoriesList";
import Paymentrequest from "@/pages/admin/Paymentrequest";
import PaymentSettings from "@/pages/admin/PaymentSettings";
import WalletSettingsPage from "@/pages/admin/WalletSettings";
import EarningsPackages from "@/pages/admin/EarningsPackages";
import PackagesList from "@/pages/admin/packages/PackagesList";
import PackageForm from "@/pages/admin/packages/PackageForm";
import AdminSubscribers from "@/pages/admin/subscribers/AdminSubscribers";
import PointsSettingsPage from "@/pages/admin/settings/PointsSettings";
import AdminReports from "@/pages/admin/AdminReports";
import AdminAdsSettings from "@/pages/admin/AdminAdsSettings";

import NotFound from "./pages/NotFound";
import Packages from "./pages/Packages";
import AdminRepresentatives from "./pages/admin/AdminRepresentatives";
import AdminBankTransfers from "./pages/admin/AdminBankTransfers";
import AdminEarningPayments from "./pages/admin/AdminEarningPayments";
import AdminReportCategories from "./pages/admin/AdminReportCategories";
import AdminAds from "./pages/admin/AdminAds";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <ChatDockProvider>
      <PostProvider>
       
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
                  <Route path="/" element={ <StoryProvider><Feed /></StoryProvider>} />
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
                  <Route path="/messages" element={<Messenger />} />
                  <Route path="/pages" element={<PagesIndex />} />
                  <Route path="/pages/create" element={<PageCreate />} />
                  <Route path="/pages/:handle" element={<PageView />} />
                  <Route path="/pages/invites" element={<PagesInvites />} />
                  <Route path="/groups" element={<GroupsIndex />} />
                  <Route path="/groups/invites" element={<GroupsInvites />} />
                  <Route path="/groups/create" element={<GroupCreate />} />
                  <Route path="/groups/:handle" element={<GroupView />} />
                  <Route path="/events" element={<EventsIndex />} />
                  <Route path="/events/create" element={<EventCreate />} />
                  <Route path="/events/invites" element={<EventsInvites />} />
                  <Route path="/events/:id" element={<EventView />} />
                  <Route path="/watch" element={<WatchPage />} />
                  <Route path="/affiliates" element={<AffiliatesPage />} />
                  <Route path="/ads" element={<AdsManager />} />
                 
                  

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
                  <Route
                    path="representative"
                    element={<RepresentativePage />}
                  />
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="profile" element={<AdminProfilePage />} />
                  <Route path="posts" element={<AdminPosts />} />
                  <Route
                    path="representatives"
                    element={<AdminRepresentatives />}
                  />

                  <Route
                    path="banktransfers"
                    element={<AdminBankTransfers />}
                  />
                  <Route
                    path="earningspayments"
                    element={<AdminEarningPayments />}
                  />
                  <Route
                    path="/admin/page-categories"
                    element={<AdminPageCategories />}
                  />
                  <Route
                    path="/admin/page-categories/new"
                    element={<AdminPageCategoryForm />}
                  />
                  <Route
                    path="/admin/page-categories/:id"
                    element={<AdminPageCategoryForm />}
                  />
                  <Route path="/admin/groups" element={<AdminGroups />} />
                  <Route
                    path="/admin/group-categories"
                    element={<AdminGroupCategories />}
                  />
                  <Route
                    path="/admin/group-categories/new"
                    element={<AdminGroupCategoryForm />}
                  />
                  <Route
                    path="/admin/group-categories/:id"
                    element={<AdminGroupCategoryForm />}
                  />
                  <Route path="/admin/events" element={<AdminEvents />} />
                  <Route
                    path="/admin/events/new"
                    element={<AdminEventForm />}
                  />
                  <Route
                    path="/admin/events/:id"
                    element={<AdminEventForm />}
                  />
                  <Route
                    path="/admin/events-categories"
                    element={<AdminEventCategoriesList />}
                  />
                  <Route
                    path="/admin/events-categories/new"
                    element={<AdminEventCategoryForm />}
                  />
                  <Route
                    path="/admin/events-categories/:id"
                    element={<AdminEventCategoryForm />}
                  />
                  <Route
                    path="/admin/payment-requests"
                    element={<Paymentrequest />}
                  />
                  <Route
                    path="/admin/settings/payments"
                    element={<PaymentSettings />}
                  />
                  <Route
                    path="/admin/wallet-settings"
                    element={<WalletSettingsPage />}
                  />
                  <Route
                    path="/admin/earnings/packages"
                    element={<EarningsPackages />}
                  />
                  <Route path="/admin/packages" element={<PackagesList />} />
                  <Route path="/admin/packages/new" element={<PackageForm />} />
                  <Route
                    path="/admin/packages/:id/edit"
                    element={<PackageForm />}
                  />
                  <Route
                    path="/admin/subscribers"
                    element={<AdminSubscribers />}
                  />
                  <Route
                    path="/admin/settings/points"
                    element={<PointsSettingsPage />}
                  />
                  <Route
                    path="/admin/reports"
                    element={<AdminReports />}
                  />
                  <Route
                    path="/admin/reports/categories"
                    element={<AdminReportCategories />}
                  />
                  <Route
                    path="/admin/ads"
                    element={<AdminAds />}
                  />
                  <Route
                    path="/admin/adssettings"
                    element={<AdminAdsSettings />}
                  />
                </Route>
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </TooltipProvider>
      </PostProvider>
      </ChatDockProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
