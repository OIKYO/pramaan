/** Words shown for statuses, severities and roles, in one place. Sentence case throughout. */
import type { Tone } from "@/components/ui/ToneBadge";
import type { Channel, PosterStatus, ReviewStage, Role, Severity } from "@/api/types";

export const ROLE_LABEL: Record<Role, string> = {
  branch_staff: "Branch staff",
  regional_manager: "Regional manager",
  head_office: "Head office",
};

export const CHANNEL_LABEL: Record<Channel, string> = { print: "Print", instagram: "Instagram", whatsapp: "WhatsApp" };

export function statusLabel(status: PosterStatus, stage: ReviewStage | null): { label: string; tone: Tone } {
  if (status === "in_review") {
    return stage === "head_office"
      ? { label: "With head office", tone: "info" }
      : { label: "With regional manager", tone: "info" };
  }
  return {
    draft: { label: "Being checked", tone: "neutral" as Tone },
    checked: { label: "Checked, not submitted", tone: "neutral" as Tone },
    changes_requested: { label: "Sent back", tone: "warning" as Tone },
    approved: { label: "Approved", tone: "passed" as Tone },
  }[status];
}

export const SEVERITY: Record<Severity, { label: string; tone: Tone }> = {
  block: { label: "Blocks approval", tone: "blocked" },
  needs_human: { label: "Needs a person", tone: "info" },
  warn: { label: "Warning", tone: "warning" },
  pass: { label: "Passed", tone: "passed" },
};

export const KIND_LABEL = { code: "Code check", ai: "AI flag", reader: "Reader check" } as const;

export const REVIEW_ACTION_LABEL: Record<string, string> = {
  created: "created the poster",
  new_version: "uploaded a new version",
  checked: "checks finished",
  submitted: "submitted it for review",
  approved: "approved it (regional)",
  final_approved: "gave final approval",
  sent_back: "sent it back",
  finding_resolved: "confirmed a reading",
  finding_overridden: "overrode a finding",
};

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export const formatInr = (amount: number) => `₹${new Intl.NumberFormat("en-IN").format(amount)}`;
