"use client";

import Btn from "@/components/portal/kit/Btn";
import Card from "@/components/portal/kit/Card";
import Empty from "@/components/portal/kit/Empty";

export default function SettingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card>
      <Empty icon="⚠" title="This settings page failed to load.">
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
