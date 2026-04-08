"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Upload,
  BarChart3,
  Zap,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const itensNavegacao = [
  { href: "/dashboard", label: "Dashboard", icone: LayoutDashboard },
  { href: "/contatos", label: "Contatos", icone: Users },
  { href: "/eventos", label: "Eventos", icone: Calendar },
  { href: "/empresas", label: "Empresas Parceiras", icone: Building2 },
  { href: "/importar", label: "Importar", icone: Upload },
  { href: "/relatorios", label: "Relatórios", icone: BarChart3 },
  { href: "/automacoes", label: "Automações", icone: Zap },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white font-bold text-base">S</span>
        </div>
        <div>
          <p className="font-bold text-gray-900 leading-tight">StepAds CRM</p>
          <p className="text-xs text-muted-foreground">Gestão de eventos</p>
        </div>
      </div>

      <Separator />

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {itensNavegacao.map(({ href, label, icone: Icone }) => {
          const ativo = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                ativo
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icone className={cn("w-4 h-4 flex-shrink-0", ativo ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
              <span className="flex-1">{label}</span>
              {ativo && <ChevronRight className="w-3 h-3 text-white/70" />}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600 hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
};
