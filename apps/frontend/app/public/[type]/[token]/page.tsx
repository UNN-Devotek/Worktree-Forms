
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { FormRender } from "@/features/forms/components/FormRender";
// If FormRender doesn't exist, I'll need to mock/build a simple viewer or use the JSON.
// Checking file later.

async function getPublicResource(token: string) {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.BACKEND_PORT || 5100}`;
    // Direct server-to-server call or public endpoint
    // Public endpoint is unauthenticated, so fetch directly
    try {
        const res = await fetch(`${backendUrl}/api/public/access/${token}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export default async function PublicAccessPage({
  params,
}: {
  params: Promise<{ type: string; token: string }>;
}) {
  const { token } = await params;
  const resource = await getPublicResource(token);

  if (!resource) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Worktree Public Access</h1>
            <p className="text-muted-foreground">Shared securely via valid token</p>
        </div>
        <Badge variant={resource.type === 'FORM' ? 'default' : 'secondary'}>
            {resource.type}
        </Badge>
      </header>
    
      {resource.type === 'FORM' && (
          <Card>
              <CardHeader>
                  <CardTitle>{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                  {/* Ideally fetch the real Form Renderer. For MVP showing Schema/Info */}
                  <div className="p-4 bg-muted rounded-md mb-4">
                      <p className="text-sm font-medium">Form Schema Preview (Public)</p>
                  </div>
                  <pre className="text-xs bg-slate-950 text-slate-50 p-4 rounded overflow-auto max-h-[500px]">
                      {JSON.stringify(resource.schema, null, 2)}
                  </pre>
                  {/* <FormRender schema={resource.schema} readOnly /> */}
              </CardContent>
          </Card>
      )}

      {(resource.type === 'SPEC' || resource.type === 'BLUEPRINT') && (
          <div className="aspect-[3/4] w-full bg-slate-100 rounded-lg overflow-hidden border">
              <iframe src={resource.signedUrl} className="w-full h-full" title="Document Viewer" />
          </div>
      )}
    </div>
  );
}
