"use client"

import { ActivityCommandBar } from "@/components/features/transactions/activity-command-bar"
import { ImportWorkspace } from "@/components/features/import/import-workspace"

export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <ActivityCommandBar />
      <div id="import-workspace">
        <ImportWorkspace hideIntro />
      </div>
    </div>
  )
}
