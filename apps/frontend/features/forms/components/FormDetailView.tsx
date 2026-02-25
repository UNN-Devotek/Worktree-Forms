'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Table2, ExternalLink, FileText, TrendingUp, Clock, RefreshCw } from 'lucide-react'
import { FormSubmitView } from '@/components/groups/forms/FormSubmitView'
import { SubmissionsTable } from '@/components/groups/forms/SubmissionsTable'
import { PublicShareModal } from '@/features/share/PublicShareModal'
import { FormSubmissionsChart } from './FormSubmissionsChart'
import { FormStatusChart } from './FormStatusChart'
import { Share } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GroupForm } from '@/types/group-forms'
import { apiClient } from '@/lib/api'
import { SheetEmbed } from '@/features/sheets/components/SheetEmbed'

interface FormDetailViewProps {
  form: {
    id: number
    slug: string
    title: string
    is_published: boolean
    group_id: number
    form_schema: GroupForm['form_schema']
    targetSheetId: string | null
  }
  projectSlug: string
  projectId: string
  sheetToken: string | null
  user: { name: string; color: string }
}

interface FormAnalytics {
  total: number
  submissionsPerDay: { date: string; count: number }[]
  statusBreakdown: Record<string, number>
}

export function FormDetailView({ form, projectSlug, projectId, sheetToken, user }: FormDetailViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null)
  const [syncingColumns, setSyncingColumns] = useState(false)

  useEffect(() => {
    // Pre-warm the backend access token from the NextAuth session before making API calls.
    // After a fresh NextAuth login, no `access_token` cookie exists yet — this ensures it's set.
    const init = async (retries = 2) => {
      try { await fetch('/api/auth/backend-token', { credentials: 'include' }) } catch {}
      try {
        const res = await apiClient<{ success: boolean; data: FormAnalytics }>(`/api/projects/${projectId}/forms/${form.id}/analytics`)
        if (res.success && res.data) setAnalytics(res.data)
      } catch {
        // Retry once after a short delay — dev server rewrites can be briefly
        // unavailable during Turbopack hot-reload windows.
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 500))
          return init(retries - 1)
        }
      }
    }
    init()
  }, [form.id, projectId])

  const handleSyncColumns = async () => {
    if (!form.targetSheetId) return
    setSyncingColumns(true)
    try {
      const res = await apiClient<{ success: boolean; message: string; data: { columnCount: number } }>(
        `/api/projects/${projectId}/forms/${form.id}/sync-columns`,
        { method: 'POST' }
      )
      if (res.success) {
        // toast handled by surrounding UI
        console.log(res.message)
      }
    } catch (err) {
      console.error('Failed to sync columns', err)
    } finally {
      setSyncingColumns(false)
    }
  }

  const handleTabChange = (value: string) => {
    if (value === 'edit') {
      router.push(`/project/${projectSlug}/forms/builder/${form.id}`)
      return
    }
    setActiveTab(value)
  }

  // Recent submissions count (last 7 days)
  const last7days = analytics?.submissionsPerDay?.slice(-7).reduce((sum, d) => sum + d.count, 0) ?? null
  const totalSubmissions = analytics?.total ?? null

  return (
    <div className="flex flex-col bg-background text-foreground overflow-y-auto h-full">
      <div className="px-8 pt-8 pb-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/project/${projectSlug}/forms`)}
                aria-label="Back to forms"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">{form.title}</h1>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                form.is_published
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              )}>
                {form.is_published ? 'Published' : 'Draft'}
              </span>
              {form.targetSheetId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => router.push(`/project/${projectSlug}/sheets/${form.targetSheetId}`)}
                >
                  <Table2 className="h-4 w-4" />
                  Output Table
                </Button>
              )}
            </div>
            <p className="text-muted-foreground pl-10">Manage your form settings, submissions and specific configurations.</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-muted p-1.5 rounded-full w-fit border border-border h-auto">
              {['Overview', 'Submit', 'Edit', 'Review', 'Integrations', 'Settings'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase()}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-all shadow-none text-muted-foreground hover:text-foreground',
                    activeTab === tab.toLowerCase() && 'bg-background text-foreground shadow-sm'
                  )}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <PublicShareModal
              resourceType="FORM"
              resourceId={String(form.id)}
              trigger={
                <Button variant="outline" size="sm">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              }
            />
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalSubmissions === null ? (
                      <span className="inline-block h-7 w-10 bg-muted animate-pulse rounded" />
                    ) : (
                      totalSubmissions.toLocaleString()
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {last7days === null ? (
                      <span className="inline-block h-7 w-10 bg-muted animate-pulse rounded" />
                    ) : (
                      last7days.toLocaleString()
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Submissions this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics === null ? (
                      <span className="inline-block h-7 w-10 bg-muted animate-pulse rounded" />
                    ) : (
                      (analytics.statusBreakdown?.pending ?? 0).toLocaleString()
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting action</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    'text-2xl font-bold',
                    form.is_published ? 'text-green-500' : 'text-amber-500'
                  )}>
                    {form.is_published ? 'Live' : 'Draft'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {form.is_published ? 'Accepting responses' : 'Not published yet'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FormSubmissionsChart data={analytics?.submissionsPerDay ?? null} />
              </div>
              <div>
                <FormStatusChart
                  total={totalSubmissions ?? 0}
                  statusBreakdown={analytics?.statusBreakdown ?? null}
                />
              </div>
            </div>
          </TabsContent>

          {/* Submit Tab */}
          <TabsContent value="submit" className="max-w-3xl mx-auto mt-0 w-full">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Submit Form: {form.title}</CardTitle>
                <CardDescription>Fill out the form below to submit a response.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <FormSubmitView form={form as any} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit tab — clicking navigates away */}
          <TabsContent value="edit" />

          {/* Review Tab */}
          <TabsContent value="review" className="mt-0 space-y-4">
            {activeTab === 'review' && (
              <>
                {form.targetSheetId && sheetToken ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <Table2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground flex-1">
                        Live output table — submissions are written here in real time.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 shrink-0"
                        onClick={() => router.push(`/project/${projectSlug}/sheets/${form.targetSheetId}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Full Table
                      </Button>
                    </div>
                    <div className="h-[600px] rounded-lg border overflow-hidden">
                      <SheetEmbed
                        sheetId={form.targetSheetId}
                        token={sheetToken}
                        user={user}
                      />
                    </div>
                  </>
                ) : (
                  <SubmissionsTable
                    formId={form.id}
                    formSchema={form.form_schema as any}
                    submissionsApiPath={`/api/projects/${projectId}/forms/${form.id}/submissions`}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 flex items-center justify-center h-64 text-muted-foreground">
            Integrations coming soon...
          </TabsContent>

          <TabsContent value="settings" className="mt-0 space-y-4">
            {form.targetSheetId && (
              <div className="flex items-start justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Sync Output Table Columns</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rebuild the linked live table columns to match the current form fields. This replaces all existing columns.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                  onClick={handleSyncColumns}
                  disabled={syncingColumns}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', syncingColumns && 'animate-spin')} />
                  {syncingColumns ? 'Syncing…' : 'Sync Columns'}
                </Button>
              </div>
            )}
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Advanced settings coming soon…
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
