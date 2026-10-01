"use client";

import Btn from "@/components/portal/kit/Btn";
import Card from "@/components/portal/kit/Card";
import Empty from "@/components/portal/kit/Empty";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card>
      <Empty icon="⚠" title="Something went wrong loading this page.">
        {error.digest && <>Reference: {error.digest}</>}
        <div className="mt12">
          <Btn variant="o" onClick={reset}>
            Try again
          </Btn>
        </div>
      </Empty>
    </Card>
  );
}
