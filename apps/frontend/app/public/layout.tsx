
import "@/styles/globals.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-10">
        {children}
      </main>
    </div>
  );
}
