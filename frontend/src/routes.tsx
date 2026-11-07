/** Every page and who may open it. Pages load on demand, so the first screen downloads only what
 * it needs; while the next page loads, the current one stays put and a thin bar shows progress. */
import { createBrowserRouter } from "react-router";
import { AppShell } from "@/layouts/AppShell";
import { RequireRole, RequireSignIn, RoleHome } from "@/layouts/Guards";
import { ErrorPage } from "@/pages/NotFound/ErrorPage";
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage";
import { LoadingRows, ScreenMessage } from "@/components/ui/States";

const staff = ["branch_staff"] as const;
const reviewers = ["regional_manager", "head_office"] as const;
const headOffice = ["head_office"] as const;

const firstLoad = (
  <ScreenMessage>
    <LoadingRows rows={3} />
  </ScreenMessage>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    lazy: () => import("@/pages/Login/LoginPage").then((m) => ({ Component: m.LoginPage })),
    errorElement: <ErrorPage />,
    hydrateFallbackElement: firstLoad,
  },
  {
    path: "/",
    element: (
      <RequireSignIn>
        <AppShell />
      </RequireSignIn>
    ),
    errorElement: <ErrorPage />,
    hydrateFallbackElement: firstLoad,
    children: [
      { index: true, element: <RoleHome /> },
      {
        element: <RequireRole roles={staff} />,
        children: [
          { path: "branch", lazy: () => import("@/pages/Branch/MyPostersPage").then((m) => ({ Component: m.MyPostersPage })) },
          { path: "branch/new", lazy: () => import("@/pages/Upload/UploadPage").then((m) => ({ Component: m.UploadPage })) },
        ],
      },
      { path: "posters/:id", lazy: () => import("@/pages/PosterDetail/PosterDetailPage").then((m) => ({ Component: m.PosterDetailPage })) },
      {
        element: <RequireRole roles={reviewers} />,
        children: [{ path: "review", lazy: () => import("@/pages/Review/ReviewQueuePage").then((m) => ({ Component: m.ReviewQueuePage })) }],
      },
      {
        element: <RequireRole roles={headOffice} />,
        children: [
          { path: "approvals", lazy: () => import("@/pages/Approvals/ApprovalsPage").then((m) => ({ Component: m.ApprovalsPage })) },
          { path: "insights", lazy: () => import("@/pages/Insights/InsightsPage").then((m) => ({ Component: m.InsightsPage })) },
          { path: "audit", lazy: () => import("@/pages/Audit/AuditPage").then((m) => ({ Component: m.AuditPage })) },
        ],
      },
      { path: "rulebook/brand", lazy: () => import("@/pages/Rulebook/BrandKitPage").then((m) => ({ Component: m.BrandKitPage })) },
      { path: "rulebook/courses", lazy: () => import("@/pages/Rulebook/CoursesPage").then((m) => ({ Component: m.CoursesPage })) },
      { path: "rulebook/results", lazy: () => import("@/pages/Rulebook/ResultsPage").then((m) => ({ Component: m.ResultsPage })) },
      { path: "rulebook/toppers", lazy: () => import("@/pages/Rulebook/ToppersPage").then((m) => ({ Component: m.ToppersPage })) },
      { path: "rulebook/rules", lazy: () => import("@/pages/Rulebook/RulesPage").then((m) => ({ Component: m.RulesPage })) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
