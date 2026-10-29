import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware wrappers: <Link href="/jobs"> becomes /en/jobs or /hi/jobs.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
