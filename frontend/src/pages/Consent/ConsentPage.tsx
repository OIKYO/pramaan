import { useParams } from "react-router";
import { useAnswerConsent, useConsentPage } from "@/api/hooks/useConsent";
import { ConsentDecision } from "@/components/consent/ConsentDecision";
import { ConsentFrame } from "@/components/consent/ConsentFrame";
import { ConsentOutcome } from "@/components/consent/ConsentOutcome";
import { ConsentShown } from "@/components/consent/ConsentShown";
import { QueryState } from "@/components/ui/QueryState";

export function ConsentPage() {
  const { token = "" } = useParams();
  const page = useConsentPage(token);
  const answer = useAnswerConsent(token);
  return (
    <ConsentFrame organisation={page.data?.organisation}>
      <QueryState query={page}>
        {(data) => (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <ConsentShown page={data} />
            {data.status === "pending" ? <ConsentDecision page={data} answer={answer} /> : <ConsentOutcome page={data} answer={answer} />}
          </div>
        )}
      </QueryState>
    </ConsentFrame>
  );
}
