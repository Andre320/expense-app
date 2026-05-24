import { redirect } from "next/navigation"

export default function StoreMappingsLegacyPage() {
  redirect("/settings?tab=stores")
}
