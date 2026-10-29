import { requireWorker } from "@/lib/auth";

export default async function WorkerLayout({ children }: LayoutProps<"/[locale]/w">) {
  await requireWorker();
  return children;
}
