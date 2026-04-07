import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/shared/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
