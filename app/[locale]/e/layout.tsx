import { requireBusiness } from "@/lib/auth";

export default async function EmployerLayout({ children }: LayoutProps<"/[locale]/e">) {
  await requireBusiness();
  return children;
}
