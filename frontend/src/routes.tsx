/** Every page and who may open it. Pages load on demand, so the first screen downloads only what it
 * needs; while the next page loads, the current one stays put and a thin bar shows progress. */
import { Navigate, createBrowserRouter, type RouteObject } from "react-router";
import { LoadingRows, ScreenMessage } from "@/components/ui/States";
import { AppShell } from "@/layouts/AppShell";
import { PublicOnly, RequireRole, RequireSignIn } from "@/layouts/Guards";
import { ErrorPage } from "@/pages/NotFound/ErrorPage";
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage";

const staff = ["branch_staff"] as const;
const reviewers = ["regional_manager", "head_office"] as const;
const headOffice = ["head_office"] as const;

const firstLoad = (
  <ScreenMessage>
    <LoadingRows rows={3} />
  </ScreenMessage>
);

const page = (path: string, load: () => Promise<{ Component: React.ComponentType }>): RouteObject => ({ path, lazy: load });

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: firstLoad,
    children: [
      page("/", () => import("@/pages/Landing/LandingPage").then((m) => ({ Component: m.LandingPage }))),
      page("/login", () => import("@/pages/Login/LoginPage").then((m) => ({ Component: m.LoginPage }))),
      page("/signup", () => import("@/pages/Signup/SignupPage").then((m) => ({ Component: m.SignupPage }))),
    ],
  },
  // Open to everyone, signed in or not.
  { path: "/legal/:doc", errorElement: <ErrorPage />, hydrateFallbackElement: firstLoad,
    lazy: () => import("@/pages/Legal/LegalPage").then((m) => ({ Component: m.LegalPage })) },
  {
    element: (
      <RequireSignIn>
        <AppShell />
      </RequireSignIn>
    ),
    errorElement: <ErrorPage />,
    hydrateFallbackElement: firstLoad,
    children: [
      {
        element: <RequireRole roles={staff} />,
        children: [
          page("/branch", () => import("@/pages/Branch/MyPostersPage").then((m) => ({ Component: m.MyPostersPage }))),
          page("/branch/new", () => import("@/pages/Upload/UploadPage").then((m) => ({ Component: m.UploadPage }))),
        ],
      },
      page("/posters/:id", () => import("@/pages/PosterDetail/PosterDetailPage").then((m) => ({ Component: m.PosterDetailPage }))),
      {
        element: <RequireRole roles={reviewers} />,
        children: [
          page("/review", () => import("@/pages/Review/ReviewQueuePage").then((m) => ({ Component: m.ReviewQueuePage }))),
          page("/posters", () => import("@/pages/Posters/AllPostersPage").then((m) => ({ Component: m.AllPostersPage }))),
        ],
      },
      {
        element: <RequireRole roles={headOffice} />,
        children: [
          page("/overview", () => import("@/pages/Overview/OverviewPage").then((m) => ({ Component: m.OverviewPage }))),
          page("/approvals", () => import("@/pages/Approvals/ApprovalsPage").then((m) => ({ Component: m.ApprovalsPage }))),
          page("/insights", () => import("@/pages/Insights/InsightsPage").then((m) => ({ Component: m.InsightsPage }))),
          page("/audit", () => import("@/pages/Audit/AuditPage").then((m) => ({ Component: m.AuditPage }))),
          page("/organisation/rulebooks", () => import("@/pages/Organisation/RulebooksPage").then((m) => ({ Component: m.RulebooksPage }))),
          page("/organisation/team", () => import("@/pages/Organisation/TeamPage").then((m) => ({ Component: m.TeamPage }))),
          page("/organisation/branches", () => import("@/pages/Organisation/BranchesPage").then((m) => ({ Component: m.BranchesPage }))),
          page("/organisation/import", () => import("@/pages/Organisation/ImportPage").then((m) => ({ Component: m.ImportPage }))),
        ],
      },
      page("/rulebook/brand", () => import("@/pages/Rulebook/BrandKitPage").then((m) => ({ Component: m.BrandKitPage }))),
      page("/rulebook/offerings", () => import("@/pages/Rulebook/OfferingsPage").then((m) => ({ Component: m.OfferingsPage }))),
      page("/rulebook/figures", () => import("@/pages/Rulebook/FiguresPage").then((m) => ({ Component: m.FiguresPage }))),
      page("/rulebook/people", () => import("@/pages/Rulebook/PeoplePage").then((m) => ({ Component: m.PeoplePage }))),
      // The names these pages had before rulebooks followed the industry.
      { path: "/rulebook/courses", element: <Navigate to="/rulebook/offerings" replace /> },
      { path: "/rulebook/results", element: <Navigate to="/rulebook/figures" replace /> },
      { path: "/rulebook/toppers", element: <Navigate to="/rulebook/people" replace /> },
      page("/rulebook/rules", () => import("@/pages/Rulebook/RulesPage").then((m) => ({ Component: m.RulesPage }))),
      page("/settings", () => import("@/pages/Settings/SettingsPage").then((m) => ({ Component: m.SettingsPage }))),
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
