import InstallPrompt from "@/features/pwa/InstallPrompt";

/**
 * Layout for the authenticated app group. The install nudge lives here (not the
 * root layout) so only logged-in users — the ones with a reason to keep the app
 * on their home screen — ever see it. Public pages (landing, auth) stay clean.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <InstallPrompt />
    </>
  );
}
