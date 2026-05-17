import PullToRefresh from "@/components/pull-to-refresh";

// Layout commun à toutes les pages bibliothèque : ajoute le pull-to-refresh
// (utile sur mobile/PWA pour rafraîchir une liste qui change après une session).
export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <PullToRefresh>{children}</PullToRefresh>;
}
