import { AuthShell } from "@/features/users/components/auth-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthShell>
      {children}
    </AuthShell>
  );
}

