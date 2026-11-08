import { useParams } from "react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InviteAccept } from "@/components/auth/InviteAccept";

export function JoinPage() {
  return (
    <AuthLayout>
      <InviteAccept token={useParams().token ?? ""} />
    </AuthLayout>
  );
}
