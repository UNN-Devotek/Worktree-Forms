'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { GroupForm } from '@/types/group-forms'
import { ApiResponse } from '@/types/api'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OverviewChart } from '@/components/admin/OverviewChart'
import { SessionChart } from '@/components/admin/SessionChart'
import { UserDistributionChart } from '@/components/admin/UserDistributionChart'
import { FormSubmitView } from '@/components/groups/forms/FormSubmitView'
import { SubmissionsTable } from '@/components/groups/forms/SubmissionsTable'
import { useToast } from '@/hooks/use-toast'
import { PublicShareModal } from '@/features/share/PublicShareModal'
import { Share } from 'lucide-react'

// Hardcoded for now
const DEFAULT_GROUP_ID = 1

export default function FormLandingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<GroupForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const formSlug = params.formSlug as string

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await apiClient<ApiResponse<{ forms: GroupForm[] }>>(
          `/api/groups/${DEFAULT_GROUP_ID}/forms`
        )
        if (response.success && response.data) {
          const foundForm = response.data.forms.find(f => f.slug === formSlug)
          if (foundForm) {
            setForm(foundForm)
          } else {
             // Handle 404
             toast({ title: "Form not found", variant: "destructive" })
             router.push('/forms')
          }
        }
      } catch (error) {
        console.error('Error fetching form:', error)
      } finally {
        setLoading(false)
      }
    }
    if (formSlug) fetchForm()
  }, [formSlug, router, toast])

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  
  if (!form) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Form Not Found</h1>
        <p className="text-muted-foreground">The requested form could not be loaded.</p>
        <Button onClick={() => router.push('/forms')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms
        </Button>
      </div>
    )
  }

  /* handle tab change to route to edit page directly */
  const handleTabChange = (value: string) => {
      if (value === 'edit') {
          router.push(`/forms/${formSlug}/edit`)
          return
      }
      setActiveTab(value)
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header and Tabs Area - Matching Admin Console Style */}
      <div className="px-8 pt-8 pb-4 space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold tracking-tight">{form.title}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        form.is_published 
                            ? "bg-green-500/10 text-green-500 border-green-500/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }`}>
                        {form.is_published ? 'Published' : 'Draft'}
                    </span>
                </div>
                <p className="text-muted-foreground">Manage your form settings, submissions and specific configurations.</p>
            </div>
        </div>

        {/* Tabs Layout */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/forms')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="flex items-center gap-2">
                    {/* Share Button */}
                     <PublicShareModal 
                          resourceType="FORM" 
                          resourceId={String(form.id)} // ID shouldn't be revealed but for now using ID as identifier in DB for simplicity. ideally UUID.
                          trigger={<Button variant="outline" size="sm"><Share className="mr-2 h-4 w-4" /> Share</Button>}
                     />
                </div>
            </div>
            <div className="border-b-0">
                <TabsList className="bg-muted p-1.5 rounded-full w-fit border border-border h-auto">
                    {['Overview', 'Submit', 'Edit', 'Review', 'Integrations', 'Settings'].map(tab => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab.toLowerCase()}
                            className="rounded-full px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground shadow-none data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto mt-6">
                <TabsContent value="overview" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Views</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">1,234</div><p className="text-xs text-muted-foreground">+20.1% from last month</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Submissions</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">42</div><p className="text-xs text-muted-foreground">+12 since yesterday</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completion Rate</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">68%</div><p className="text-xs text-muted-foreground">-2% trend</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg. Time</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">2m 30s</div><p className="text-xs text-muted-foreground">Steady</p></CardContent>
                        </Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <OverviewChart />
                         <div className="grid gap-6">
                             <UserDistributionChart />
                             <SessionChart />
                         </div>
                    </div>
                </TabsContent>

                <TabsContent value="submit" className="max-w-3xl mx-auto mt-0 h-full w-full">
                     <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Submit Form: {form.title}</CardTitle>
                            <CardDescription>Fill out the form below to submit a response.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                           <FormSubmitView form={form} />
                        </CardContent>
                     </Card>
                </TabsContent>



                <TabsContent value="review" className="mt-0">
                    <SubmissionsTable formId={form.id} formSchema={form.form_schema} />
                </TabsContent>
                
                 <TabsContent value="integrations" className="mt-0 flex items-center justify-center h-64 text-muted-foreground">
                    Integrations coming soon...
                </TabsContent>
                
                 <TabsContent value="settings" className="mt-0 flex items-center justify-center h-64 text-muted-foreground">
                    Advanced settings coming soon...
                </TabsContent>
            </div>
        </Tabs>
      </div>
    </div>
  )
}
