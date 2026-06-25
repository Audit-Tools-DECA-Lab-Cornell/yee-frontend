import type { Metadata } from "next";

import { Settings2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Admin Settings" };

export default function AdminSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Settings2}
          title="System settings coming soon"
          description="This section will provide platform-wide configuration: exports, database settings, permission controls, and admin tooling. It is kept separate from manager-level settings by design."
        />
      </CardContent>
    </Card>
  );
}
