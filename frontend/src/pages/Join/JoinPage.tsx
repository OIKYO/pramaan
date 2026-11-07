import { useParams } from "react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InviteAccept } from "@/components/auth/InviteAccept";

/** Where an invite link lands: /join/<token>. */
export function JoinPage() {
  return (
    <AuthLayout>
      <InviteAccept token={useParams().token ?? ""} />
    </AuthLayout>
  );
}
