import { createBrowserRouter } from "react-router";
import { AppShell } from "@/layouts/AppShell";
import { RequireRole, RequireSignIn, RoleHome } from "@/layouts/Guards";
import { ApprovalsPage } from "@/pages/Approvals/ApprovalsPage";
import { AuditPage } from "@/pages/Audit/AuditPage";
import { MyPostersPage } from "@/pages/Branch/MyPostersPage";
import { NewPosterPage } from "@/pages/Branch/NewPosterPage";
import { InsightsPage } from "@/pages/Insights/InsightsPage";
import { LoginPage } from "@/pages/Login/LoginPage";
import { ErrorPage, NotFoundPage } from "@/pages/NotFound/NotFoundPage";
import { PosterDetailPage } from "@/pages/PosterDetail/PosterDetailPage";
import { ReviewQueuePage } from "@/pages/Review/ReviewQueuePage";
import { BrandKitPage } from "@/pages/Rulebook/BrandKitPage";
import { CoursesPage } from "@/pages/Rulebook/CoursesPage";
import { ResultsPage } from "@/pages/Rulebook/ResultsPage";
import { RulesPage } from "@/pages/Rulebook/RulesPage";
import { ToppersPage } from "@/pages/Rulebook/ToppersPage";

const staff = ["branch_staff"] as const;
const reviewers = ["regional_manager", "head_office"] as const;
const headOffice = ["head_office"] as const;

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage />, errorElement: <ErrorPage /> },
  {
    path: "/",
    element: (
      <RequireSignIn>
        <AppShell />
      </RequireSignIn>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <RoleHome /> },
      { path: "branch", element: <RequireRole roles={[...staff]}><MyPostersPage /></RequireRole> },
      { path: "branch/new", element: <RequireRole roles={[...staff]}><NewPosterPage /></RequireRole> },
      { path: "posters/:id", element: <PosterDetailPage /> },
      { path: "review", element: <RequireRole roles={[...reviewers]}><ReviewQueuePage /></RequireRole> },
      { path: "approvals", element: <RequireRole roles={[...headOffice]}><ApprovalsPage /></RequireRole> },
      { path: "rulebook/brand", element: <BrandKitPage /> },
      { path: "rulebook/courses", element: <CoursesPage /> },
      { path: "rulebook/results", element: <ResultsPage /> },
      { path: "rulebook/toppers", element: <ToppersPage /> },
      { path: "rulebook/rules", element: <RulesPage /> },
      { path: "insights", element: <RequireRole roles={[...headOffice]}><InsightsPage /></RequireRole> },
      { path: "audit", element: <RequireRole roles={[...headOffice]}><AuditPage /></RequireRole> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
