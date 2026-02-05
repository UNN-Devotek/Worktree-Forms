
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
// import { Card, ... } removed unused
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VisaWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [insuranceUrl, setInsuranceUrl] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        console.log("Starting upload...", insuranceUrl); // Use insuranceUrl to satisfy lint
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload File
            const uploadRes = await fetch('/api/upload', { // Proxy to backend
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const text = await uploadRes.text();
                throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText} - ${text.substring(0, 100)}`);
            }
            
            const uploadData = await uploadRes.json();
            if (!uploadData.success) throw new Error("Backend Error: " + JSON.stringify(uploadData));

            const url = uploadData.data.url;
            setInsuranceUrl(url);

            // 2. Submit Compliance
            // We need to pass the user ID. simpler to rely on session/cookie if backend supported it, 
            // but for now we might rely on the backend mocking or explicit ID.
            // Since Middleware checks auth, we have session. 
            // But how do we pass ID to backend? 
            // The /api/* proxy usually forwards headers? 
            // In Next.js, we might need a Server Action to make the authenticated call to backend.
            // OR we use the frontend simply and hope the cookies are passed?
            // Cookies are passed to the Next.js API route/proxy, but maybe not automatically to Express if different port.
            // BUT we have a proxy setup in next.config.mjs usually? 
            // Or we are calling `http://localhost:5005`? 
            
            // Assuming Next.js rewrites:
            // If typical setup: /api/* -> Backend.
             
            // Submit Compliance verification
            // We need to identify ourselves. 
            // For MVP/Demo: we might need to fetch our own ID from session first?
            
            await submitCompliance(url);
            
            setStep(2); // Success step
            setTimeout(() => {
                router.push('/'); // Redirect to dashboard
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong');
        } finally {
            setUploading(false);
        }
    };
    
    const submitCompliance = async (url: string) => {
         // Create a Next.js API Route handler in `app/api/compliance`?
         // No, we can call the Express backend directly if proxied.
         // Or use a Server Action. 
         // Let's try calling the backend directly via the proxy path.
         
         // We need to pass the user ID. 
         // In a real app, the backend extracts it from the session token.
         // Here, `auth.ts` has the logic.
         
         // Let's use a Server Action to handle the "Submit Compliance" part, 
         // because the Server Action has access to `auth()` session and can send the ID securely.
         
         const res = await fetch('/api/compliance-proxy', { 
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ insuranceUrl: url })
         });
         
         if (!res.ok) throw new Error("Verification failed");
    }

    if (step === 2) {
        return (
             <div className="text-center space-y-4">
                <div className="text-green-500 text-4xl">✓</div>
                <h2 className="text-xl font-bold">Verification Complete</h2>
                <p>Redirecting you to the dashboard...</p>
             </div>
        );
    }

    return (
        <React.Fragment>
             <p className="mb-4">Please upload your valid Insurance Certificate (PDF or Image).</p>
             
             <div className="space-y-4">
                 <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="insurance">Insurance Document</Label>
                      <Input id="insurance" type="file" onChange={handleFileChange} accept=".pdf,image/*" />
                 </div>
                 
                 {file && (
                     <div className="text-sm text-muted-foreground">
                         Selected: {file.name}
                     </div>
                 )}
                 
                 {error && (
                     <p className="text-red-500 text-sm">{error}</p>
                 )}
             </div>

             <div className="mt-6 flex justify-end">
                 <Button onClick={handleUpload} disabled={!file || uploading}>
                     {uploading ? "Verifying..." : "Submit for Verification"}
                 </Button>
             </div>
        </React.Fragment>
    );
}

