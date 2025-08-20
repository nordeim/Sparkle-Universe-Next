Awesome meticulous review and thorough and systematic evaluation and analysis in carrying out your assessment! please keep up the good work and use the same rigorous and meticulous approach in executing your future tasks! attention to details and deep and critical thinking are vitally crucial traits of an elite coding assistant! The project has in fact completed phase 6, just that the README and PRD documents have not been updated to reflect this.

Now, put on your deep thinking hat to think deeply and thoroughly, to carefully and systematically review the output of `npm run type-check` below and give a comprehensive assessment of the log and create a detailed execution plan organised into logical phases and steps within each phase, each step with its integrated checklist to address the errors and issues highlighted in the "type-check" output, specifically the following:

1) what node modules are missing and need to be installed
2)  list of files giving errors and the detailed suggestion and plan to fix them

---
> sparkle-universe@0.1.0 type-check
> tsc --noEmit

src/app/(main)/create/page.tsx(50,5): error TS2322: Type 'Resolver<{ content: string; title: string; excerpt?: string | undefined; categoryId?: string | undefined; seriesId?: string | undefined; seriesOrder?: number | undefined; isDraft?: boolean | undefined; youtubeVideoId?: string | undefined; tags?: string[] | undefined; }, any, { ...; }>' is not assignable to type 'Resolver<{ content: string; title: string; isDraft: boolean; tags: string[]; excerpt?: string | undefined; categoryId?: string | undefined; seriesId?: string | undefined; seriesOrder?: number | undefined; youtubeVideoId?: string | undefined; }, any, { ...; }>'.
  Types of parameters 'options' and 'options' are incompatible.
    Type 'ResolverOptions<{ content: string; title: string; isDraft: boolean; tags: string[]; excerpt?: string | undefined; categoryId?: string | undefined; seriesId?: string | undefined; seriesOrder?: number | undefined; youtubeVideoId?: string | undefined; }>' is not assignable to type 'ResolverOptions<{ content: string; title: string; excerpt?: string | undefined; categoryId?: string | undefined; seriesId?: string | undefined; seriesOrder?: number | undefined; isDraft?: boolean | undefined; youtubeVideoId?: string | undefined; tags?: string[] | undefined; }>'.
      Type 'boolean | undefined' is not assignable to type 'boolean'.
        Type 'undefined' is not assignable to type 'boolean'.
src/app/(main)/create/page.tsx(72,36): error TS2339: Property 'category' does not exist on type 'CreateTRPCReactBase<BuiltRouter<{ ctx: { session: Session | null; db: PrismaClient<PrismaClientOptions, never, DefaultArgs>; headers: Headers; req: Request | undefined; }; meta: object; errorShape: { ...; }; transformer: true; }, DecorateCreateRouterOptions<...>>, unknown> & DecorateRouterRecord<...>'.
src/app/(main)/create/page.tsx(153,45): error TS2345: Argument of type '(data: CreatePostInput) => Promise<void>' is not assignable to parameter of type 'SubmitHandler<TFieldValues>'.
  Types of parameters 'data' and 'data' are incompatible.
    Type 'TFieldValues' is not assignable to type '{ content: string; title: string; isDraft: boolean; tags: string[]; excerpt?: string | undefined; categoryId?: string | undefined; seriesId?: string | undefined; seriesOrder?: number | undefined; youtubeVideoId?: string | undefined; }'.
      Type 'FieldValues' is missing the following properties from type '{ content: string; title: string; isDraft: boolean; tags: string[]; excerpt?: string | undefined; categoryId?: string | undefined; seriesId?: string | undefined; seriesOrder?: number | undefined; youtubeVideoId?: string | undefined; }': content, title, isDraft, tags
src/app/(main)/create/page.tsx(282,46): error TS2345: Argument of type '(data: CreatePostInput) => Promise<void>' is not assignable to parameter of type 'SubmitHandler<TFieldValues>'.
  Types of parameters 'data' and 'data' are incompatible.
    Type 'TFieldValues' is not assignable to type '{ content: string; title: string; isDraft: boolean; tags: string[]; excerpt?: string | undefined; categoryId?: string | undefined; seriesId?: string | undefined; seriesOrder?: number | undefined; youtubeVideoId?: string | undefined; }'.
      Type 'FieldValues' is missing the following properties from type '{ content: string; title: string; isDraft: boolean; tags: string[]; excerpt?: string | undefined; categoryId?: string | undefined; seriesId?: string | undefined; seriesOrder?: number | undefined; youtubeVideoId?: string | undefined; }': content, title, isDraft, tags
src/app/(main)/create/page.tsx(314,37): error TS7006: Parameter 'category' implicitly has an 'any' type.
src/app/admin/dashboard/page.tsx(44,33): error TS2307: Cannot find module '@/components/admin/charts/user-growth-chart' or its corresponding type declarations.
src/app/admin/dashboard/page.tsx(45,35): error TS2307: Cannot find module '@/components/admin/charts/engagement-heatmap' or its corresponding type declarations.
src/app/admin/dashboard/page.tsx(46,36): error TS2307: Cannot find module '@/components/admin/charts/content-performance' or its corresponding type declarations.
src/app/admin/dashboard/page.tsx(65,39): error TS2322: Type 'TimePeriod' is not assignable to type '"week" | "day" | "month" | "quarter" | "year"'.
  Type '"today"' is not assignable to type '"week" | "day" | "month" | "quarter" | "year"'. Did you mean '"day"'?
src/app/admin/dashboard/page.tsx(250,62): error TS2554: Expected 2 arguments, but got 1.
src/app/admin/dashboard/page.tsx(300,27): error TS2322: Type '{ data: any; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(377,19): error TS2322: Type '{ data: any; type: string; height: number; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(394,33): error TS2322: Type '{ limit: number; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'limit' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(406,29): error TS2322: Type '{ limit: number; period: TimePeriod; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'limit' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(446,19): error TS2322: Type '{ data: any; type: string; height: number; showLegend: true; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(459,25): error TS2322: Type '{ data: any; type: string; height: number; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(472,25): error TS2322: Type '{ data: any; type: string; height: number; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(507,19): error TS2322: Type '{ data: any; type: string; height: number; horizontal: true; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(521,19): error TS2322: Type '{ data: any; type: string; height: number; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(570,19): error TS2322: Type '{ data: any; type: string; height: number; showLegend: true; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(628,31): error TS2322: Type '{ limit: number; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'limit' does not exist on type 'IntrinsicAttributes'.
src/app/admin/dashboard/page.tsx(638,17): error TS2322: Type '{ data: any; type: string; height: number; showLegend: true; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'data' does not exist on type 'IntrinsicAttributes'.
src/app/admin/layout.tsx(39,7): error TS2740: Type '{ id: string; username: string; role: UserRole; image: string | null; email: string; }' is missing the following properties from type '{ id: string; email: string; username: string; hashedPassword: string; authProvider: AuthProvider; emailVerified: Date | null; phoneNumber: string | null; phoneNumberHash: string | null; ... 39 more ...; lastPayoutDate: Date | null; }': hashedPassword, authProvider, emailVerified, phoneNumber, and 39 more.
src/app/admin/layout.tsx(62,13): error TS2741: Property 'name' is missing in type '{ id: string; username: string; role: UserRole; image: string | null; email: string; }' but required in type '{ id: string; name: string; email: string; avatar?: string | undefined; role: string; }'.
src/app/admin/layout.tsx(69,15): error TS2322: Type '(error: any, reset: any) => Element' is not assignable to type 'ComponentType<{ error: Error; reset: () => void; }> | undefined'.
  Type '(error: any, reset: any) => Element' is not assignable to type 'FunctionComponent<{ error: Error; reset: () => void; }>'.
    Target signature provides too few arguments. Expected 2 or more, but got 1.
src/app/admin/layout.tsx(69,26): error TS7006: Parameter 'error' implicitly has an 'any' type.
src/app/admin/layout.tsx(69,33): error TS7006: Parameter 'reset' implicitly has an 'any' type.
src/app/admin/moderation/page.tsx(53,35): error TS2307: Cannot find module '@/components/admin/moderation-history' or its corresponding type declarations.
src/app/admin/moderation/page.tsx(54,33): error TS2307: Cannot find module '@/components/admin/ai-analysis-panel' or its corresponding type declarations.
src/app/admin/moderation/page.tsx(55,33): error TS2307: Cannot find module '@/components/admin/moderation-stats' or its corresponding type declarations.
src/app/admin/moderation/page.tsx(58,23): error TS2307: Cannot find module '@/components/ui/use-toast' or its corresponding type declarations.
src/app/admin/moderation/page.tsx(168,7): error TS7006: Parameter 'item' implicitly has an 'any' type.
src/app/admin/moderation/page.tsx(173,35): error TS7006: Parameter 'item' implicitly has an 'any' type.
src/app/admin/moderation/page.tsx(286,23): error TS2339: Property 'pending' does not exist on type '{ pendingCount: number; reviewedToday: number; autoBlockedToday: number; averageReviewTime: number; }'.
src/app/admin/moderation/page.tsx(301,23): error TS2339: Property 'approvedToday' does not exist on type '{ pendingCount: number; reviewedToday: number; autoBlockedToday: number; averageReviewTime: number; }'.
src/app/admin/moderation/page.tsx(316,23): error TS2339: Property 'rejectedToday' does not exist on type '{ pendingCount: number; reviewedToday: number; autoBlockedToday: number; averageReviewTime: number; }'.
src/app/admin/moderation/page.tsx(331,25): error TS2339: Property 'aiAccuracy' does not exist on type '{ pendingCount: number; reviewedToday: number; autoBlockedToday: number; averageReviewTime: number; }'.
src/app/admin/moderation/page.tsx(346,38): error TS2339: Property 'avgModerationTime' does not exist on type '{ pendingCount: number; reviewedToday: number; autoBlockedToday: number; averageReviewTime: number; }'.
src/app/admin/moderation/page.tsx(623,44): error TS2339: Property 'aiStats' does not exist on type '{ pendingCount: number; reviewedToday: number; autoBlockedToday: number; averageReviewTime: number; }'.
src/app/admin/moderation/page.tsx(645,11): error TS2322: Type '{ content: any; onClose: () => void; onModerate: (action: any) => void; }' is not assignable to type 'IntrinsicAttributes & ContentPreviewDialogProps'.
  Property 'onClose' does not exist on type 'IntrinsicAttributes & ContentPreviewDialogProps'.
src/app/admin/moderation/page.tsx(646,24): error TS7006: Parameter 'action' implicitly has an 'any' type.
src/app/admin/users/page.tsx(68,35): error TS2307: Cannot find module '@/components/admin/user-details-dialog' or its corresponding type declarations.
src/app/admin/users/page.tsx(69,34): error TS2307: Cannot find module '@/components/admin/bulk-action-dialog' or its corresponding type declarations.
src/app/admin/users/page.tsx(70,31): error TS2307: Cannot find module '@/components/admin/user-analytics' or its corresponding type declarations.
src/app/admin/users/page.tsx(74,23): error TS2307: Cannot find module '@/components/ui/use-toast' or its corresponding type declarations.
src/app/admin/users/page.tsx(180,11): error TS18048: 'data.users.length' is possibly 'undefined'.
src/app/admin/users/page.tsx(180,37): error TS18048: 'data' is possibly 'undefined'.
src/app/admin/users/page.tsx(228,7): error TS2322: Type 'string' is not assignable to type '"email" | "role" | "delete" | "verify" | "ban" | "unban"'.
src/app/admin/users/page.tsx(437,23): error TS2322: Type '{ checked: boolean; indeterminate: boolean | undefined; onCheckedChange: () => void; }' is not assignable to type 'IntrinsicAttributes & CheckboxProps & RefAttributes<HTMLButtonElement>'.
  Property 'indeterminate' does not exist on type 'IntrinsicAttributes & CheckboxProps & RefAttributes<HTMLButtonElement>'.
src/app/admin/users/page.tsx(563,32): error TS2532: Object is possibly 'undefined'.
src/app/admin/users/page.tsx(655,35): error TS2322: Type 'string' is not assignable to type '"USER" | "MODERATOR" | "ADMIN" | "CREATOR" | "VERIFIED_CREATOR" | "SYSTEM"'.
src/app/admin/users/page.tsx(697,53): error TS2345: Argument of type '{ userId: string; }' is not assignable to parameter of type '{ userId: string; reason: string; deleteContent?: boolean | undefined; }'.
  Property 'reason' is missing in type '{ userId: string; }' but required in type '{ userId: string; reason: string; deleteContent?: boolean | undefined; }'.
src/app/admin/users/page.tsx(752,22): error TS7006: Parameter 'action' implicitly has an 'any' type.
src/app/admin/users/page.tsx(752,30): error TS7006: Parameter 'params' implicitly has an 'any' type.
src/app/api/admin/jobs/route.ts(44,10): error TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ send: (payload: any) => Promise<Job<any, any, string>>; bulk: (payload: any) => Promise<Job<any, any, string>>; digest: (userId: string) => Promise<Job<any, any, string>>; } | { ...; } | { ...; } | { ...; } | { ...; }'.
src/app/api/admin/jobs/route.ts(52,31): error TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ send: (payload: any) => Promise<Job<any, any, string>>; bulk: (payload: any) => Promise<Job<any, any, string>>; digest: (userId: string) => Promise<Job<any, any, string>>; } | { ...; } | { ...; } | { ...; } | { ...; }'.
src/app/api/trpc/[trpc]/route.ts(15,44): error TS2345: Argument of type '{ req: NextRequest; }' is not assignable to parameter of type 'FetchCreateContextFnOptions | CreateNextContextOptions'.
  Type '{ req: NextRequest; }' is missing the following properties from type 'CreateNextContextOptions': res, info
src/app/layout.tsx(7,31): error TS2307: Cannot find module '@/components/providers/theme-provider' or its corresponding type declarations.
src/app/layout.tsx(8,31): error TS2307: Cannot find module '@/components/providers/query-provider' or its corresponding type declarations.
src/components/admin/admin-activity-monitor.tsx(76,27): error TS2554: Expected 1 arguments, but got 0.
src/components/admin/admin-activity-monitor.tsx(119,11): error TS2322: Type '{ id: string; userId: string; username: string; avatar: string; role: string | undefined; device: any; browser: string | undefined; os: string | undefined; location: string | undefined; ... 5 more ...; status: any; }[]' is not assignable to type 'ActiveSession[]'.
  Type '{ id: string; userId: string; username: string; avatar: string; role: string | undefined; device: any; browser: string | undefined; os: string | undefined; location: string | undefined; ... 5 more ...; status: any; }' is not assignable to type 'ActiveSession'.
    Types of property 'role' are incompatible.
      Type 'string | undefined' is not assignable to type 'string'.
        Type 'undefined' is not assignable to type 'string'.
src/components/admin/admin-activity-monitor.tsx(137,11): error TS2322: Type '{ id: string; userId: string; username: string; action: string | undefined; target: string | undefined; timestamp: Date; }[]' is not assignable to type 'ActivityLog[]'.
  Type '{ id: string; userId: string; username: string; action: string | undefined; target: string | undefined; timestamp: Date; }' is not assignable to type 'ActivityLog'.
    Types of property 'action' are incompatible.
      Type 'string | undefined' is not assignable to type 'string'.
        Type 'undefined' is not assignable to type 'string'.
src/components/admin/analytics-chart.tsx(10,153): error TS2307: Cannot find module 'recharts' or its corresponding type declarations.
src/components/admin/content-preview-dialog.tsx(312,18): error TS2304: Cannot find name 'Card'.
src/components/admin/content-preview-dialog.tsx(313,20): error TS2304: Cannot find name 'CardHeader'.
src/components/admin/content-preview-dialog.tsx(314,22): error TS2304: Cannot find name 'CardTitle'.
src/components/admin/content-preview-dialog.tsx(314,69): error TS2304: Cannot find name 'CardTitle'.
src/components/admin/content-preview-dialog.tsx(315,21): error TS2304: Cannot find name 'CardHeader'.
src/components/admin/content-preview-dialog.tsx(316,20): error TS2304: Cannot find name 'CardContent'.
src/components/admin/content-preview-dialog.tsx(323,21): error TS2304: Cannot find name 'CardContent'.
src/components/admin/content-preview-dialog.tsx(324,19): error TS2304: Cannot find name 'Card'.
src/components/admin/content-preview-dialog.tsx(326,18): error TS2304: Cannot find name 'Card'.
src/components/admin/content-preview-dialog.tsx(327,20): error TS2304: Cannot find name 'CardHeader'.
src/components/admin/content-preview-dialog.tsx(328,22): error TS2304: Cannot find name 'CardTitle'.
src/components/admin/content-preview-dialog.tsx(328,68): error TS2304: Cannot find name 'CardTitle'.
src/components/admin/content-preview-dialog.tsx(329,21): error TS2304: Cannot find name 'CardHeader'.
src/components/admin/content-preview-dialog.tsx(330,20): error TS2304: Cannot find name 'CardContent'.
src/components/admin/content-preview-dialog.tsx(337,21): error TS2304: Cannot find name 'CardContent'.
src/components/admin/content-preview-dialog.tsx(338,19): error TS2304: Cannot find name 'Card'.
src/components/admin/content-preview-dialog.tsx(340,18): error TS2304: Cannot find name 'Card'.
src/components/admin/content-preview-dialog.tsx(341,20): error TS2304: Cannot find name 'CardHeader'.
src/components/admin/content-preview-dialog.tsx(342,22): error TS2304: Cannot find name 'CardTitle'.
src/components/admin/content-preview-dialog.tsx(342,65): error TS2304: Cannot find name 'CardTitle'.
src/components/admin/content-preview-dialog.tsx(343,21): error TS2304: Cannot find name 'CardHeader'.
src/components/admin/content-preview-dialog.tsx(344,20): error TS2304: Cannot find name 'CardContent'.
src/components/admin/content-preview-dialog.tsx(351,21): error TS2304: Cannot find name 'CardContent'.
src/components/admin/content-preview-dialog.tsx(352,19): error TS2304: Cannot find name 'Card'.
src/components/admin/content-preview-dialog.tsx(354,18): error TS2304: Cannot find name 'Card'.
src/components/admin/content-preview-dialog.tsx(355,20): error TS2304: Cannot find name 'CardHeader'.
src/components/admin/content-preview-dialog.tsx(356,22): error TS2304: Cannot find name 'CardTitle'.
src/components/admin/content-preview-dialog.tsx(356,65): error TS2304: Cannot find name 'CardTitle'.
src/components/admin/content-preview-dialog.tsx(357,21): error TS2304: Cannot find name 'CardHeader'.
src/components/admin/content-preview-dialog.tsx(358,20): error TS2304: Cannot find name 'CardContent'.
src/components/admin/content-preview-dialog.tsx(366,21): error TS2304: Cannot find name 'CardContent'.
src/components/admin/content-preview-dialog.tsx(367,19): error TS2304: Cannot find name 'Card'.
src/components/admin/moderator-queue.tsx(62,13): error TS2322: Type '{ id: string; type: any; entityId: string; reason: string | undefined; reportCount: number; priority: number; status: any; createdAt: Date; content: string; author: { id: string; username: string; ... 5 more ...; createdAt: Date; }; reporter: { ...; }; aiAnalysis: { ...; } | undefined; }[]' is not assignable to type 'QueueItem[]'.
  Type '{ id: string; type: any; entityId: string; reason: string | undefined; reportCount: number; priority: number; status: any; createdAt: Date; content: string; author: { id: string; username: string; ... 5 more ...; createdAt: Date; }; reporter: { ...; }; aiAnalysis: { ...; } | undefined; }' is not assignable to type 'QueueItem'.
    Types of property 'reason' are incompatible.
      Type 'string | undefined' is not assignable to type 'string'.
        Type 'undefined' is not assignable to type 'string'.
src/components/admin/moderator-queue.tsx(346,24): error TS2552: Cannot find name 'Progress'. Did you mean 'onprogress'?
src/components/admin/realtime-metrics.tsx(123,26): error TS2554: Expected 1 arguments, but got 0.
src/components/admin/realtime-metrics.tsx(134,60): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(137,26): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(140,38): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(143,38): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(146,52): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(149,51): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(150,15): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(153,52): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(154,15): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(157,38): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(160,38): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(163,38): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(169,13): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(171,13): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(173,13): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(176,11): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(180,15): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(181,17): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(181,33): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(181,63): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(181,84): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(181,105): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(182,71): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(187,31): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(187,67): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(187,82): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(191,24): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(191,40): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(191,69): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(191,90): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(191,111): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(192,71): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(197,31): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(197,75): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(197,90): error TS18048: 'metric' is possibly 'undefined'.
src/components/admin/realtime-metrics.tsx(210,16): error TS2345: Argument of type '(prev: Record<string, RealtimeMetric>) => { activeUsers: { value: number; label?: string | undefined; unit?: string | undefined; trend?: "up" | "down" | "stable" | undefined; percentage?: number | undefined; threshold?: { ...; } | undefined; icon?: ElementType<...> | undefined; color?: string | undefined; }; ... 6 m...' is not assignable to parameter of type 'SetStateAction<Record<string, RealtimeMetric>>'.
  Type '(prev: Record<string, RealtimeMetric>) => { activeUsers: { value: number; label?: string | undefined; unit?: string | undefined; trend?: "up" | "down" | "stable" | undefined; percentage?: number | undefined; threshold?: { ...; } | undefined; icon?: ElementType<...> | undefined; color?: string | undefined; }; ... 6 m...' is not assignable to type '(prevState: Record<string, RealtimeMetric>) => Record<string, RealtimeMetric>'.
    Type '{ activeUsers: { value: number; label?: string | undefined; unit?: string | undefined; trend?: "up" | "down" | "stable" | undefined; percentage?: number; threshold?: { warning: number; critical: number; }; icon?: ElementType<...> | undefined; color?: string | undefined; }; ... 6 more ...; responseTime: { ...; }; }' is not assignable to type 'Record<string, RealtimeMetric>'.
      Property 'activeUsers' is incompatible with index signature.
        Type '{ value: number; label?: string | undefined; unit?: string | undefined; trend?: "up" | "down" | "stable" | undefined; percentage?: number; threshold?: { warning: number; critical: number; }; icon?: ElementType<...> | undefined; color?: string | undefined; }' is not assignable to type 'RealtimeMetric'.
          Types of property 'label' are incompatible.
            Type 'string | undefined' is not assignable to type 'string'.
              Type 'undefined' is not assignable to type 'string'.
src/components/admin/recent-activity.tsx(122,15): error TS18048: 'activity' is possibly 'undefined'.
src/components/admin/recent-activity.tsx(123,17): error TS18048: 'activity' is possibly 'undefined'.
src/components/admin/recent-activity.tsx(137,19): error TS18048: 'activity' is possibly 'undefined'.
src/components/admin/top-content.tsx(92,5): error TS2322: Type '{ id: string; title: string; author: { id: string; name: string; avatar: string; verified: boolean; }; type: string; metrics: { views: number; likes: number; comments: number; shares: number; engagement: number; }; createdAt: Date; tags: string[]; trending: boolean; featured: boolean; }[]' is not assignable to type 'ContentItem[]'.
  Type '{ id: string; title: string; author: { id: string; name: string; avatar: string; verified: boolean; }; type: string; metrics: { views: number; likes: number; comments: number; shares: number; engagement: number; }; createdAt: Date; tags: string[]; trending: boolean; featured: boolean; }' is not assignable to type 'ContentItem'.
    Types of property 'type' are incompatible.
      Type 'string' is not assignable to type '"post" | "comment" | "video"'.
src/components/error-boundary.tsx(32,3): error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'Component<ErrorBoundaryProps, ErrorBoundaryState, any>'.
src/components/error-boundary.tsx(44,3): error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'Component<ErrorBoundaryProps, ErrorBoundaryState, any>'.
src/components/features/comments/comment-form.tsx(136,24): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'SetStateAction<string>'.
  Type 'undefined' is not assignable to type 'SetStateAction<string>'.
src/components/features/comments/comment-form.tsx(207,39): error TS2339: Property 'isLoading' does not exist on type 'UseTRPCMutationResult<{ _count: { reactions: number; replies: number; }; author: ({ profile: { id: string; createdAt: Date; updatedAt: Date; userId: string; bannerImage: string | null; location: string | null; ... 26 more ...; profileCompleteness: number; } | null; } & { ...; }) | null; } & { ...; }, TRPCClientError...'.
  Property 'isLoading' does not exist on type 'TRPCHookResult & Override<MutationObserverIdleResult<{ _count: { reactions: number; replies: number; }; author: ({ profile: { id: string; createdAt: Date; updatedAt: Date; userId: string; ... 28 more ...; profileCompleteness: number; } | null; } & { ...; }) | null; } & { ...; }, TRPCClientErrorLike<...>, { ...; }, u...'.
src/components/features/comments/comment-form.tsx(207,67): error TS2339: Property 'isLoading' does not exist on type 'UseTRPCMutationResult<{ postId: string; _count: { reactions: number; replies: number; }; author: ({ profile: { id: string; createdAt: Date; updatedAt: Date; userId: string; bannerImage: string | null; ... 27 more ...; profileCompleteness: number; } | null; } & { ...; }) | null; ... 21 more ...; pinned: boolean; }, T...'.
  Property 'isLoading' does not exist on type 'TRPCHookResult & Override<MutationObserverIdleResult<{ postId: string; _count: { reactions: number; replies: number; }; author: ({ profile: { id: string; createdAt: Date; updatedAt: Date; userId: string; ... 28 more ...; profileCompleteness: number; } | null; } & { ...; }) | null; ... 21 more ...; pinned: boolean; }...'.
src/components/features/comments/comment-form.tsx(265,30): error TS2322: Type '{ onSelect: (emoji: string) => void; }' is not assignable to type 'IntrinsicAttributes & EmojiPickerProps'.
  Property 'onSelect' does not exist on type 'IntrinsicAttributes & EmojiPickerProps'.
src/components/features/comments/comment-form.tsx(332,19): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/components/features/comments/comment-item.tsx(343,70): error TS18046: 'count' is of type 'unknown'.
src/components/features/comments/comment-item.tsx(347,27): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
src/components/features/comments/comment-item.tsx(411,73): error TS7006: Parameter 'reply' implicitly has an 'any' type.
src/components/features/comments/comment-thread.tsx(109,41): error TS7006: Parameter 'comment' implicitly has an 'any' type.
src/components/features/comments/comment-thread.tsx(133,44): error TS7006: Parameter 'comment' implicitly has an 'any' type.
src/components/features/comments/mention-suggestions.tsx(25,7): error TS2769: No overload matches this call.
  Overload 1 of 2, '(input: { query: string; type?: "mentions" | "all" | "creators" | undefined; limit?: number | undefined; excludeIds?: string[] | undefined; } | typeof skipToken, opts: DefinedUseTRPCQueryOptions<any, any, TRPCClientErrorLike<...>, any>): DefinedUseTRPCQueryResult<...>', gave the following error.
    Object literal may only specify known properties, and 'keepPreviousData' does not exist in type 'DefinedUseTRPCQueryOptions<any, any, TRPCClientErrorLike<{ errorShape: { data: { zodError: typeToFlattenedError<any, string> | null; code: "PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | ... 16 more ... | "CLIENT_CLOSED_REQUEST"; httpStatus: number; path?: string | undefined; stack?: string | undefined; };...'.
  Overload 2 of 2, '(input: { query: string; type?: "mentions" | "all" | "creators" | undefined; limit?: number | undefined; excludeIds?: string[] | undefined; } | typeof skipToken, opts?: UseTRPCQueryOptions<any, any, TRPCClientErrorLike<...>, any> | undefined): UseTRPCQueryResult<...>', gave the following error.
    Object literal may only specify known properties, and 'keepPreviousData' does not exist in type 'UseTRPCQueryOptions<any, any, TRPCClientErrorLike<{ input: { query: string; type?: "mentions" | "all" | "creators" | undefined; limit?: number | undefined; excludeIds?: string[] | undefined; }; output: any; transformer: true; errorShape: { ...; }; }>, any>'.
src/components/features/comments/mention-suggestions.tsx(83,23): error TS7006: Parameter 'user' implicitly has an 'any' type.
src/components/features/comments/mention-suggestions.tsx(83,29): error TS7006: Parameter 'index' implicitly has an 'any' type.
src/components/features/comments/reaction-picker.tsx(106,22): error TS2554: Expected 1 arguments, but got 0.
src/components/features/comments/reaction-picker.tsx(192,30): error TS2339: Property 'filled' does not exist on type '{ icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; label: string; color: string; bgColor: string; animation: string; }'.
src/components/features/comments/reaction-picker.tsx(246,61): error TS2339: Property 'filled' does not exist on type '{ icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; label: string; color: string; bgColor: string; animation: string; } | ... 7 more ... | { ...; }'.
  Property 'filled' does not exist on type '{ icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; label: string; color: string; bgColor: string; animation: string; }'.
src/components/features/editor/rich-text-editor.tsx(11,10): error TS2305: Module '"lowlight"' has no exported member 'lowlight'.
src/components/features/gamification/achievement-details-modal.tsx(396,39): error TS2339: Property 'badgeId' does not exist on type '{ stats: { totalUnlocked: number; completionRate: number; firstUnlockedBy: { id: string; username: string; } | undefined; avgTimeToUnlock: any; unlockRate: number; }; _count: { userAchievements: number; }; ... 29 more ...; maxAchievers: number | null; }'.
src/components/features/gamification/achievement-details-modal.tsx(517,37): error TS2339: Property 'tips' does not exist on type '{ stats: { totalUnlocked: number; completionRate: number; firstUnlockedBy: { id: string; username: string; } | undefined; avgTimeToUnlock: any; unlockRate: number; }; _count: { userAchievements: number; }; ... 29 more ...; maxAchievers: number | null; }'.
src/components/features/gamification/achievement-details-modal.tsx(521,42): error TS2339: Property 'tips' does not exist on type '{ stats: { totalUnlocked: number; completionRate: number; firstUnlockedBy: { id: string; username: string; } | undefined; avgTimeToUnlock: any; unlockRate: number; }; _count: { userAchievements: number; }; ... 29 more ...; maxAchievers: number | null; }'.
src/components/features/post/post-card.tsx(65,20): error TS7006: Parameter 'prev' implicitly has an 'any' type.
src/components/features/post/post-card.tsx(69,20): error TS7006: Parameter 'prev' implicitly has an 'any' type.
src/components/features/post/post-card.tsx(81,20): error TS7006: Parameter 'prev' implicitly has an 'any' type.
src/components/features/post/post-card.tsx(85,20): error TS7006: Parameter 'prev' implicitly has an 'any' type.
src/components/features/post/post-card.tsx(309,42): error TS7006: Parameter 'tag' implicitly has an 'any' type.
src/components/features/post/post-card.tsx(321,24): error TS2322: Type '"ghost"' is not assignable to type '"secondary" | "destructive" | "default" | "outline" | null | undefined'.
src/components/features/youtube/youtube-embed.tsx(85,32): error TS2339: Property 'YT' does not exist on type 'Window & typeof globalThis'.
src/components/features/youtube/youtube-embed.tsx(87,31): error TS2339: Property 'YT' does not exist on type 'Window & typeof globalThis'.
src/components/features/youtube/youtube-embed.tsx(105,37): error TS2339: Property 'YT' does not exist on type 'Window & typeof globalThis'.
src/components/features/youtube/youtube-embed.tsx(108,44): error TS2339: Property 'YT' does not exist on type 'Window & typeof globalThis'.
src/components/features/youtube/youtube-embed.tsx(111,44): error TS2339: Property 'YT' does not exist on type 'Window & typeof globalThis'.
src/components/features/youtube/youtube-embed.tsx(135,37): error TS2339: Property 'YT' does not exist on type 'Window & typeof globalThis'.
src/components/features/youtube/youtube-embed.tsx(136,29): error TS2339: Property 'YT' does not exist on type 'Window & typeof globalThis'.
src/components/features/youtube/youtube-embed.tsx(388,24): error TS2322: Type '"ghost"' is not assignable to type '"secondary" | "destructive" | "default" | "outline" | null | undefined'.
src/components/features/youtube/youtube-embed.tsx(408,46): error TS2339: Property 'YT' does not exist on type 'Window & typeof globalThis'.
src/components/features/youtube/youtube-embed.tsx(412,3): error TS18048: 'firstScriptTag' is possibly 'undefined'.
src/components/features/youtube/youtube-embed.tsx(412,48): error TS2345: Argument of type 'HTMLScriptElement | undefined' is not assignable to parameter of type 'Node | null'.
  Type 'undefined' is not assignable to type 'Node | null'.
src/components/ui/emoji-picker.tsx(8,8): error TS2307: Cannot find module '@/components/ui/popover' or its corresponding type declarations.
src/components/ui/emoji-picker.tsx(162,12): error TS2339: Property 'custom' does not exist on type '{ recent: { label: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; emojis: string[]; }; ... 4 more ...; objects: { ...; }; }'.
src/hooks/use-auth.ts(68,13): error TS2741: Property 'SYSTEM' is missing in type '{ USER: number; CREATOR: number; VERIFIED_CREATOR: number; MODERATOR: number; ADMIN: number; }' but required in type 'Record<UserRole, number>'.
src/hooks/use-socket.ts(252,54): error TS2554: Expected 1 arguments, but got 2.
src/hooks/use-socket.ts(460,28): error TS2554: Expected 1 arguments, but got 0.
src/lib/api.ts(7,28): error TS2552: Cannot find name 'inferRouterInputs'. Did you mean 'RouterInputs'?
src/lib/api.ts(8,29): error TS2552: Cannot find name 'inferRouterOutputs'. Did you mean 'RouterOutputs'?
src/lib/auth/auth.config.ts(38,3): error TS2322: Type 'import("/Home1/test2/node_modules/@auth/prisma-adapter/node_modules/@auth/core/adapters").Adapter' is not assignable to type 'import("/Home1/test2/node_modules/next-auth/adapters").Adapter'.
  Types of property 'getUser' are incompatible.
    Type '((id: string) => import("/Home1/test2/node_modules/@auth/prisma-adapter/node_modules/@auth/core/types").Awaitable<import("/Home1/test2/node_modules/@auth/prisma-adapter/node_modules/@auth/core/adapters").AdapterUser | null>) | undefined' is not assignable to type '((id: string) => import("/Home1/test2/node_modules/next-auth/core/types").Awaitable<import("/Home1/test2/node_modules/next-auth/adapters").AdapterUser | null>) | undefined'.
      Type '(id: string) => import("/Home1/test2/node_modules/@auth/prisma-adapter/node_modules/@auth/core/types").Awaitable<import("/Home1/test2/node_modules/@auth/prisma-adapter/node_modules/@auth/core/adapters").AdapterUser | null>' is not assignable to type '(id: string) => import("/Home1/test2/node_modules/next-auth/core/types").Awaitable<import("/Home1/test2/node_modules/next-auth/adapters").AdapterUser | null>'.
        Type 'import("/Home1/test2/node_modules/@auth/prisma-adapter/node_modules/@auth/core/types").Awaitable<import("/Home1/test2/node_modules/@auth/prisma-adapter/node_modules/@auth/core/adapters").AdapterUser | null>' is not assignable to type 'import("/Home1/test2/node_modules/next-auth/core/types").Awaitable<import("/Home1/test2/node_modules/next-auth/adapters").AdapterUser | null>'.
          Type 'AdapterUser' is not assignable to type 'Awaitable<AdapterUser | null>'.
            Type 'AdapterUser' is missing the following properties from type 'AdapterUser': username, role
src/lib/auth/auth.ts(74,7): error TS2741: Property 'SYSTEM' is missing in type '{ USER: number; CREATOR: number; VERIFIED_CREATOR: number; MODERATOR: number; ADMIN: number; }' but required in type 'Record<UserRole, number>'.
src/lib/db.ts(51,4): error TS2339: Property '$use' does not exist on type 'PrismaClient<PrismaClientOptions, never, DefaultArgs>'.
src/lib/db.ts(51,16): error TS7006: Parameter 'params' implicitly has an 'any' type.
src/lib/db.ts(51,24): error TS7006: Parameter 'next' implicitly has an 'any' type.
src/lib/db.ts(90,4): error TS2339: Property '$use' does not exist on type 'PrismaClient<PrismaClientOptions, never, DefaultArgs>'.
src/lib/db.ts(90,16): error TS7006: Parameter 'params' implicitly has an 'any' type.
src/lib/db.ts(90,24): error TS7006: Parameter 'next' implicitly has an 'any' type.
src/lib/db.ts(102,4): error TS2339: Property '$use' does not exist on type 'PrismaClient<PrismaClientOptions, never, DefaultArgs>'.
src/lib/db.ts(102,16): error TS7006: Parameter 'params' implicitly has an 'any' type.
src/lib/db.ts(102,24): error TS7006: Parameter 'next' implicitly has an 'any' type.
src/lib/events/event-emitter.ts(51,3): error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'EventEmitter<DefaultEventMap>'.
src/lib/events/event-emitter.ts(59,3): error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'EventEmitter<DefaultEventMap>'.
src/lib/events/event-emitter.ts(66,3): error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'EventEmitter<DefaultEventMap>'.
src/lib/events/event-emitter.ts(73,3): error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'EventEmitter<DefaultEventMap>'.
src/lib/events/event-emitter.ts(80,3): error TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'EventEmitter<DefaultEventMap>'.
src/lib/events/event-emitter.ts(92,17): error TS2345: Argument of type '"error"' is not assignable to parameter of type 'keyof SystemEvents'.
src/lib/events/event-emitter.ts(102,49): error TS2554: Expected 1-2 arguments, but got 3.
src/lib/events/event-emitter.ts(106,46): error TS2554: Expected 1-2 arguments, but got 3.
src/lib/events/event-emitter.ts(110,15): error TS2484: Export declaration conflicts with exported declaration of 'SystemEvents'.
src/lib/monitoring.ts(108,30): error TS2339: Property 'now' does not exist on type 'PerformanceMonitor'.
src/lib/monitoring.ts(120,34): error TS2339: Property 'now' does not exist on type 'PerformanceMonitor'.
src/lib/monitoring.ts(121,23): error TS18048: 'timing.endTime' is possibly 'undefined'.
src/lib/rate-limit.ts(25,38): error TS18048: 'config' is possibly 'undefined'.
src/lib/rate-limit.ts(28,61): error TS18048: 'config' is possibly 'undefined'.
src/lib/rate-limit.ts(29,35): error TS18048: 'config' is possibly 'undefined'.
src/lib/rate-limit.ts(30,43): error TS18048: 'config' is possibly 'undefined'.
src/lib/rate-limit.ts(33,25): error TS18048: 'config' is possibly 'undefined'.
src/lib/rate-limit.ts(34,14): error TS18048: 'config' is possibly 'undefined'.
src/lib/rate-limit.ts(43,38): error TS18048: 'config' is possibly 'undefined'.
src/lib/rate-limit.ts(46,11): error TS2304: Cannot find name 'redis'.
src/lib/redis.ts(74,9): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/lib/redis.ts(75,27): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/lib/security.ts(7,23): error TS2307: Cannot find module 'speakeasy' or its corresponding type declarations.
src/lib/security.ts(8,20): error TS2307: Cannot find module 'qrcode' or its corresponding type declarations.
src/lib/security.ts(56,19): error TS2532: Object is possibly 'undefined'.
src/lib/security.ts(183,26): error TS2769: No overload matches this call.
  Overload 1 of 4, '(arrayBuffer: WithImplicitCoercion<ArrayBufferLike>, byteOffset?: number | undefined, length?: number | undefined): Buffer<ArrayBufferLike>', gave the following error.
    Argument of type 'string | undefined' is not assignable to parameter of type 'WithImplicitCoercion<ArrayBufferLike>'.
      Type 'undefined' is not assignable to type 'WithImplicitCoercion<ArrayBufferLike>'.
  Overload 2 of 4, '(string: WithImplicitCoercion<string>, encoding?: BufferEncoding | undefined): Buffer<ArrayBuffer>', gave the following error.
    Argument of type 'string | undefined' is not assignable to parameter of type 'WithImplicitCoercion<string>'.
      Type 'undefined' is not assignable to type 'WithImplicitCoercion<string>'.
src/lib/security.ts(184,31): error TS2769: No overload matches this call.
  Overload 1 of 4, '(arrayBuffer: WithImplicitCoercion<ArrayBufferLike>, byteOffset?: number | undefined, length?: number | undefined): Buffer<ArrayBufferLike>', gave the following error.
    Argument of type 'string | undefined' is not assignable to parameter of type 'WithImplicitCoercion<ArrayBufferLike>'.
      Type 'undefined' is not assignable to type 'WithImplicitCoercion<ArrayBufferLike>'.
  Overload 2 of 4, '(string: WithImplicitCoercion<string>, encoding?: BufferEncoding | undefined): Buffer<ArrayBuffer>', gave the following error.
    Argument of type 'string | undefined' is not assignable to parameter of type 'WithImplicitCoercion<string>'.
      Type 'undefined' is not assignable to type 'WithImplicitCoercion<string>'.
src/lib/security.ts(190,35): error TS2769: No overload matches this call.
  Overload 1 of 4, '(data: ArrayBufferView<ArrayBufferLike>, inputEncoding: undefined, outputEncoding: Encoding): string', gave the following error.
    Argument of type 'string | undefined' is not assignable to parameter of type 'ArrayBufferView<ArrayBufferLike>'.
      Type 'undefined' is not assignable to type 'ArrayBufferView<ArrayBufferLike>'.
  Overload 2 of 4, '(data: string, inputEncoding: Encoding | undefined, outputEncoding: Encoding): string', gave the following error.
    Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
      Type 'undefined' is not assignable to type 'string'.
src/lib/security.ts(191,3): error TS2322: Type 'string' is not assignable to type 'Buffer<ArrayBufferLike> & string'.
  Type 'string' is not assignable to type 'Buffer<ArrayBufferLike>'.
src/lib/security.ts(254,9): error TS2353: Object literal may only specify known properties, and 'timestamp' does not exist in type 'Without<LoginHistoryCreateInput, LoginHistoryUncheckedCreateInput> & LoginHistoryUncheckedCreateInput'.
src/lib/security.ts(310,9): error TS2353: Object literal may only specify known properties, and 'message' does not exist in type 'Without<SecurityAlertCreateInput, SecurityAlertUncheckedCreateInput> & SecurityAlertUncheckedCreateInput'.
src/lib/security.ts(396,12): error TS2532: Object is possibly 'undefined'.
src/lib/socket/socket-server.ts(630,43): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/lib/socket/socket-server.ts(652,5): error TS2322: Type '(string | undefined)[]' is not assignable to type 'string[]'.
  Type 'string | undefined' is not assignable to type 'string'.
    Type 'undefined' is not assignable to type 'string'.
src/lib/utils.ts(249,16): error TS2322: Type 'string | undefined' is not assignable to type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.
src/lib/utils.ts(379,16): error TS2532: Object is possibly 'undefined'.
src/lib/utils.ts(426,12): error TS2532: Object is possibly 'undefined'.
src/lib/utils.ts(519,12): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/lib/utils.ts(519,28): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/lib/utils.ts(730,3): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/middleware.ts(4,10): error TS2724: '"@/lib/rate-limit"' has no exported member named 'rateLimit'. Did you mean 'ratelimit'?
src/middleware.ts(4,21): error TS2305: Module '"@/lib/rate-limit"' has no exported member 'rateLimitConfigs'.
src/server/api/root.ts(5,28): error TS2307: Cannot find module '@/server/api/routers/auth' or its corresponding type declarations.
src/server/api/root.ts(10,33): error TS2307: Cannot find module '@/server/api/routers/analytics' or its corresponding type declarations.
src/server/api/root.ts(44,29): error TS2304: Cannot find name 'createCallerFactory'.
src/server/api/routers/admin.ts(6,34): error TS2307: Cannot find module '@/server/services/analytics.service' or its corresponding type declarations.
src/server/api/routers/admin.ts(8,31): error TS2307: Cannot find module '@/server/services/system.service' or its corresponding type declarations.
src/server/api/routers/admin.ts(240,32): error TS2551: Property 'getModerationQueue' does not exist on type 'ModerationService'. Did you mean 'getModerrationQueue'?
src/server/api/routers/admin.ts(259,32): error TS2339: Property 'moderateContent' does not exist on type 'ModerationService'.
src/server/api/routers/admin.ts(273,32): error TS2339: Property 'bulkModerate' does not exist on type 'ModerationService'.
src/server/api/routers/admin.ts(282,32): error TS2339: Property 'getAISettings' does not exist on type 'ModerationService'.
src/server/api/routers/admin.ts(295,32): error TS2339: Property 'updateAISettings' does not exist on type 'ModerationService'.
src/server/api/routers/comment.ts(184,24): error TS2339: Property 'action' does not exist on type '{ success: boolean; }'.
src/server/api/routers/gamification.ts(266,11): error TS2322: Type 'number | null' is not assignable to type 'number | IntFieldUpdateOperationsInput | undefined'.
  Type 'null' is not assignable to type 'number | IntFieldUpdateOperationsInput | undefined'.
src/server/api/routers/gamification.ts(746,13): error TS2532: Object is possibly 'undefined'.
src/server/api/routers/post.ts(57,9): error TS2345: Argument of type '{ id: string; content?: string | undefined; title?: string | undefined; excerpt?: string | undefined; categoryId?: string | undefined; youtubeVideoId?: string | null | undefined; tags?: string[] | undefined; }' is not assignable to parameter of type 'Partial<{ title: string; content: string; excerpt: string; tags: string[]; categoryId: string; youtubeVideoId: string; }>'.
  Types of property 'youtubeVideoId' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.
src/server/api/routers/youtube.ts(124,32): error TS2339: Property 'leaveParty' does not exist on type 'WatchPartyService'.
src/server/api/routers/youtube.ts(137,32): error TS2339: Property 'getPartyDetails' does not exist on type 'WatchPartyService'.
src/server/api/routers/youtube.ts(162,32): error TS2339: Property 'getUserParties' does not exist on type 'WatchPartyService'.
src/server/services/admin.service.ts(5,30): error TS2307: Cannot find module './email.service' or its corresponding type declarations.
src/server/services/admin.service.ts(570,55): error TS18046: 'error' is of type 'unknown'.
src/server/services/cache.service.ts(396,36): error TS2532: Object is possibly 'undefined'.
src/server/services/comment.service.ts(249,11): error TS2352: Conversion of type 'JsonValue[]' to type 'EditHistoryEntry[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'JsonValue' is not comparable to type 'EditHistoryEntry'.
    Type 'JsonValue[]' is missing the following properties from type 'EditHistoryEntry': content, editedAt
src/server/services/comment.service.ts(348,11): error TS2352: Conversion of type 'JsonValue[]' to type 'EditHistoryEntry[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'JsonValue' is not comparable to type 'EditHistoryEntry'.
    Type 'JsonValue[]' is missing the following properties from type 'EditHistoryEntry': content, editedAt
src/server/services/comment.service.ts(706,13): error TS2532: Object is possibly 'undefined'.
src/server/services/comment.service.ts(784,9): error TS2532: Object is possibly 'undefined'.
src/server/services/comment.service.ts(853,13): error TS2532: Object is possibly 'undefined'.
src/server/services/comment.service.ts(1055,13): error TS7022: 'comment' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
src/server/services/gamification.service.ts(205,11): error TS2353: Object literal may only specify known properties, and 'totalXpEarned' does not exist in type 'Without<UserStatsCreateInput, UserStatsUncheckedCreateInput> & UserStatsUncheckedCreateInput'.
src/server/services/gamification.service.ts(208,11): error TS2353: Object literal may only specify known properties, and 'totalXpEarned' does not exist in type '(Without<UserStatsUpdateInput, UserStatsUncheckedUpdateInput> & UserStatsUncheckedUpdateInput) | (Without<...> & UserStatsUpdateInput)'.
src/server/services/gamification.service.ts(637,11): error TS2532: Object is possibly 'undefined'.
src/server/services/gamification.service.ts(737,15): error TS2353: Object literal may only specify known properties, and '_count' does not exist in type 'ReactionListRelationFilter'.
src/server/services/gamification.service.ts(753,51): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/server/services/gamification.service.ts(897,11): error TS2353: Object literal may only specify known properties, and 'totalAchievements' does not exist in type 'Without<UserStatsCreateInput, UserStatsUncheckedCreateInput> & UserStatsUncheckedCreateInput'.
src/server/services/gamification.service.ts(900,11): error TS2353: Object literal may only specify known properties, and 'totalAchievements' does not exist in type '(Without<UserStatsUpdateInput, UserStatsUncheckedUpdateInput> & UserStatsUncheckedUpdateInput) | (Without<...> & UserStatsUpdateInput)'.
src/server/services/gamification.service.ts(934,7): error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/gamification.service.ts(965,9): error TS1117: An object literal cannot have multiple properties with the same name.
src/server/services/gamification.service.ts(1082,11): error TS2353: Object literal may only specify known properties, and 'questsCompleted' does not exist in type 'Without<UserStatsCreateInput, UserStatsUncheckedCreateInput> & UserStatsUncheckedCreateInput'.
src/server/services/gamification.service.ts(1085,11): error TS2353: Object literal may only specify known properties, and 'questsCompleted' does not exist in type '(Without<UserStatsUpdateInput, UserStatsUncheckedUpdateInput> & UserStatsUncheckedUpdateInput) | (Without<...> & UserStatsUpdateInput)'.
src/server/services/gamification.service.ts(1499,11): error TS2322: Type 'null' is not assignable to type 'string'.
src/server/services/gamification.service.ts(1510,9): error TS2322: Type 'LeaderboardEntry[]' is not assignable to type 'JsonNull | InputJsonValue'.
  Type 'LeaderboardEntry[]' is not assignable to type 'InputJsonObject'.
    Index signature for type 'string' is missing in type 'LeaderboardEntry[]'.
src/server/services/gamification.service.ts(1514,9): error TS2322: Type 'LeaderboardEntry[]' is not assignable to type 'JsonNull | InputJsonValue | undefined'.
  Type 'LeaderboardEntry[]' is not assignable to type 'InputJsonObject'.
    Index signature for type 'string' is missing in type 'LeaderboardEntry[]'.
src/server/services/mention.service.ts(145,21): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/server/services/post.service.ts(62,9): error TS2322: Type '{ connectOrCreate: { where: { name: string; }; create: { name: string; slug: string; }; }[]; }' is not assignable to type 'PostTagUncheckedCreateNestedManyWithoutPostInput | PostTagCreateNestedManyWithoutPostInput | undefined'.
  Types of property 'connectOrCreate' are incompatible.
    Type '{ where: { name: string; }; create: { name: string; slug: string; }; }[]' is not assignable to type 'PostTagCreateOrConnectWithoutPostInput | PostTagCreateOrConnectWithoutPostInput[] | undefined'.
      Type '{ where: { name: string; }; create: { name: string; slug: string; }; }[]' is not assignable to type 'PostTagCreateOrConnectWithoutPostInput[]'.
        Type '{ where: { name: string; }; create: { name: string; slug: string; }; }' is not assignable to type 'PostTagCreateOrConnectWithoutPostInput'.
          Types of property 'where' are incompatible.
            Type '{ name: string; }' is not assignable to type 'PostTagWhereUniqueInput'.
src/server/services/post.service.ts(204,9): error TS2322: Type 'JsonValue' is not assignable to type 'JsonNull | InputJsonValue'.
  Type 'null' is not assignable to type 'JsonNull | InputJsonValue'.
src/server/services/post.service.ts(312,13): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/server/services/post.service.ts(409,17): error TS2322: Type '{ some: { name: string; }; } | undefined' is not assignable to type 'PostTagListRelationFilter | undefined'.
  Type '{ some: { name: string; }; }' is not assignable to type 'PostTagListRelationFilter'.
    Types of property 'some' are incompatible.
      Object literal may only specify known properties, and 'name' does not exist in type 'PostTagWhereInput'.
src/server/services/post.service.ts(474,7): error TS2322: Type '(string | null)[]' is not assignable to type 'string[]'.
  Type 'string | null' is not assignable to type 'string'.
    Type 'null' is not assignable to type 'string'.
src/server/services/post.service.ts(594,20): error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/post.service.ts(601,11): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
src/server/services/post.service.ts(677,18): error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/post.service.ts(843,9): error TS2353: Object literal may only specify known properties, and 'entityId' does not exist in type 'Without<ReportCreateInput, ReportUncheckedCreateInput> & ReportUncheckedCreateInput'.
src/server/services/post.service.ts(869,41): error TS2339: Property 'id' does not exist on type '{ createdAt: Date; postId: string; addedBy: string | null; tagId: string; }'.
src/server/services/post.service.ts(881,33): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type 'PostTagWhereInput'.
src/server/services/post.service.ts(1096,57): error TS2345: Argument of type '{ type: "USER_POSTED"; userId: string; actorId: any; entityId: any; entityType: string; message: string; title: string; }' is not assignable to parameter of type '{ type: NotificationType; userId: string; actorId?: string | undefined; entityId?: string | undefined; entityType?: string | undefined; title: string; message: string; data?: any; imageUrl?: string | undefined; actionUrl?: string | undefined; priority?: number | undefined; }'.
  Types of property 'type' are incompatible.
    Type '"USER_POSTED"' is not assignable to type 'NotificationType'.
src/server/services/search.service.ts(3,8): error TS2613: Module '"/Home1/test2/node_modules/algoliasearch/dist/browser"' has no default export. Did you mean to use 'import { algoliasearch } from "/Home1/test2/node_modules/algoliasearch/dist/browser"' instead?
src/server/services/search.service.ts(3,39): error TS2305: Module '"algoliasearch"' has no exported member 'SearchIndex'.
src/server/services/search.service.ts(56,23): error TS2531: Object is possibly 'null'.
src/server/services/search.service.ts(56,42): error TS2339: Property 'initIndex' does not exist on type '{ transporter: Transporter; appId: string; apiKey: string; clearCache(): Promise<void>; readonly _ua: string; addAlgoliaAgent(segment: string, version?: string | undefined): void; ... 76 more ...; updateApiKey({ key, apiKey }: UpdateApiKeyProps, requestOptions?: RequestOptions | undefined): Promise<...>; }'.
src/server/services/search.service.ts(57,23): error TS2531: Object is possibly 'null'.
src/server/services/search.service.ts(57,42): error TS2339: Property 'initIndex' does not exist on type '{ transporter: Transporter; appId: string; apiKey: string; clearCache(): Promise<void>; readonly _ua: string; addAlgoliaAgent(segment: string, version?: string | undefined): void; ... 76 more ...; updateApiKey({ key, apiKey }: UpdateApiKeyProps, requestOptions?: RequestOptions | undefined): Promise<...>; }'.
src/server/services/search.service.ts(58,22): error TS2531: Object is possibly 'null'.
src/server/services/search.service.ts(58,41): error TS2339: Property 'initIndex' does not exist on type '{ transporter: Transporter; appId: string; apiKey: string; clearCache(): Promise<void>; readonly _ua: string; addAlgoliaAgent(segment: string, version?: string | undefined): void; ... 76 more ...; updateApiKey({ key, apiKey }: UpdateApiKeyProps, requestOptions?: RequestOptions | undefined): Promise<...>; }'.
src/server/services/upload.service.ts(36,10): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ avatar: string[]; cover: string[]; post: string[]; comment: string[]; }'.
  No index signature with a parameter of type 'string' was found on type '{ avatar: string[]; cover: string[]; post: string[]; comment: string[]; }'.
src/server/services/user.service.ts(139,14): error TS2551: Property 'status' does not exist on type '{ id: string; email: string; username: string; image: string | null; bio: string | null; role: UserRole; verified: boolean; lastSeenAt: Date | null; createdAt: Date; profile: { ...; } | null; stats: { ...; } | null; _count: { ...; }; }'. Did you mean 'stats'?
src/server/services/user.service.ts(840,28): error TS2339: Property 'push' does not exist on type 'UserWhereInput | UserWhereInput[]'.
  Property 'push' does not exist on type 'UserWhereInput'.
src/server/services/user.service.ts(1116,38): error TS2339: Property 'checkAndUnlockAchievements' does not exist on type 'GamificationService'.
src/server/services/watch-party.service.ts(91,9): error TS2322: Type '"RESOURCE_EXHAUSTED"' is not assignable to type '"PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "NOT_IMPLEMENTED" | "BAD_GATEWAY" | "SERVICE_UNAVAILABLE" | "GATEWAY_TIMEOUT" | "UNAUTHORIZED" | "PAYMENT_REQUIRED" | ... 10 more ... | "CLIENT_CLOSED_REQUEST"'.
src/server/services/youtube.service.ts(3,10): error TS2300: Duplicate identifier 'PrismaClient'.
src/server/services/youtube.service.ts(6,10): error TS2300: Duplicate identifier 'TRPCError'.
src/server/services/youtube.service.ts(114,9): error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(117,38): error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(118,48): error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(124,9): error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(126,9): error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(174,9): error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(176,9): error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(181,9): error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(274,11): error TS2322: Type '"RESOURCE_EXHAUSTED"' is not assignable to type '"PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "NOT_IMPLEMENTED" | "BAD_GATEWAY" | "SERVICE_UNAVAILABLE" | "GATEWAY_TIMEOUT" | "UNAUTHORIZED" | "PAYMENT_REQUIRED" | ... 10 more ... | "CLIENT_CLOSED_REQUEST"'.
src/server/services/youtube.service.ts(337,7): error TS2322: Type '{ items: SearchResult[]; nextPageToken: string | null | undefined; totalResults: number; }' is not assignable to type '{ items: SearchResult[]; nextPageToken?: string | undefined; totalResults: number; }'.
  Types of property 'nextPageToken' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(469,11): error TS2532: Object is possibly 'undefined'.
src/server/services/youtube.service.ts(492,11): error TS2532: Object is possibly 'undefined'.
src/server/services/youtube.service.ts(525,26): error TS2339: Property 'subscriberCount' does not exist on type '{ _count: { watchParties: number; clips: number; }; analytics: { id: string; updatedAt: Date; shareCount: number; engagementRate: number; videoId: string; watchTime: bigint; avgWatchTime: number; ... 5 more ...; peakViewers: number; } | null; } & { ...; }'.
src/server/services/youtube.service.ts(525,53): error TS2339: Property 'subscriberCount' does not exist on type '{ _count: { watchParties: number; clips: number; }; analytics: { id: string; updatedAt: Date; shareCount: number; engagementRate: number; videoId: string; watchTime: bigint; avgWatchTime: number; ... 5 more ...; peakViewers: number; } | null; } & { ...; }'.
src/server/services/youtube.service.ts(674,7): error TS2322: Type '{ id: string; title: string; description: string; thumbnail: string; thumbnailHd: string | null | undefined; channelId: string; channelTitle: string; duration: number; durationFormatted: string; ... 6 more ...; liveBroadcast: boolean; }[]' is not assignable to type 'VideoDetails[]'.
  Type '{ id: string; title: string; description: string; thumbnail: string; thumbnailHd: string | null | undefined; channelId: string; channelTitle: string; duration: number; durationFormatted: string; ... 6 more ...; liveBroadcast: boolean; }' is not assignable to type 'VideoDetails'.
    Types of property 'thumbnailHd' are incompatible.
      Type 'string | null | undefined' is not assignable to type 'string | undefined'.
        Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(682,38): error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(683,48): error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/server/services/youtube.service.ts(888,10): error TS2300: Duplicate identifier 'PrismaClient'.
src/server/services/youtube.service.ts(889,10): error TS2300: Duplicate identifier 'TRPCError'.
src/server/services/youtube.service.ts(1118,11): error TS2532: Object is possibly 'undefined'.
src/server/services/youtube.service.ts(1177,33): error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
src/server/websocket/socket.server.ts(7,10): error TS2724: '"@/lib/rate-limit"' has no exported member named 'RateLimiter'. Did you mean 'ratelimit'?
src/server/websocket/socket.server.ts(319,9): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/server/websocket/socket.server.ts(328,11): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/server/websocket/socket.server.ts(351,9): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/server/websocket/socket.server.ts(596,24): error TS2532: Object is possibly 'undefined'.
src/server/websocket/socket.server.ts(781,31): error TS2345: Argument of type '"collab:cursor"' is not assignable to parameter of type '"error" | "post:created" | "post:updated" | "post:deleted" | "post:liked" | "comment:created" | "comment:updated" | "comment:deleted" | "reconnect" | "comment:typing" | "user:online" | ... 12 more ... | "watchParty:playbackSync"'.
src/server/websocket/socket.server.ts(814,31): error TS2345: Argument of type '"collab:change"' is not assignable to parameter of type '"error" | "post:created" | "post:updated" | "post:deleted" | "post:liked" | "comment:created" | "comment:updated" | "comment:deleted" | "reconnect" | "comment:typing" | "user:online" | ... 12 more ... | "watchParty:playbackSync"'.
src/server/websocket/socket.server.ts(911,31): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/server/websocket/socket.server.ts(956,9): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/services/auth.service.ts(193,38): error TS2345: Argument of type 'string' is not assignable to parameter of type 'boolean'.
src/services/auth.service.ts(239,45): error TS2339: Property 'decryptSecret' does not exist on type '{ generateSecret(email: string): { secret: string; qrCode: Promise<string>; backupCodes: string[]; }; verifyToken(secret: string, token: string): boolean; generateBackupCodes(): string[]; }'.
src/services/auth.service.ts(264,11): error TS2554: Expected 1 arguments, but got 5.
src/services/auth.service.ts(273,36): error TS2345: Argument of type 'string' is not assignable to parameter of type 'boolean'.
src/services/auth.service.ts(289,50): error TS2554: Expected 0-1 arguments, but got 2.
src/services/auth.service.ts(300,24): error TS2339: Property 'session' does not exist on type '{ getJSON<T>(key: string): Promise<T | null>; setJSON<T>(key: string, value: T, ttl?: number | undefined): Promise<void>; incrementWithExpiry(key: string, ttl: number): Promise<...>; ... 24 more ...; ping(): Promise<...>; }'.
src/services/auth.service.ts(313,67): error TS2353: Object literal may only specify known properties, and 'correlationId' does not exist in type '{ userId: string; ipAddress: string; }'.
src/services/auth.service.ts(343,47): error TS2339: Property 'generateQRCode' does not exist on type '{ generateSecret(email: string): { secret: string; qrCode: Promise<string>; backupCodes: string[]; }; verifyToken(secret: string, token: string): boolean; generateBackupCodes(): string[]; }'.
src/services/auth.service.ts(346,59): error TS2554: Expected 0 arguments, but got 1.
src/services/auth.service.ts(349,43): error TS2339: Property 'encryptSecret' does not exist on type '{ generateSecret(email: string): { secret: string; qrCode: Promise<string>; backupCodes: string[]; }; verifyToken(secret: string, token: string): boolean; generateBackupCodes(): string[]; }'.
src/services/auth.service.ts(388,43): error TS2339: Property 'decryptSecret' does not exist on type '{ generateSecret(email: string): { secret: string; qrCode: Promise<string>; backupCodes: string[]; }; verifyToken(secret: string, token: string): boolean; generateBackupCodes(): string[]; }'.
src/services/auth.service.ts(411,7): error TS2554: Expected 1 arguments, but got 5.
src/services/auth.service.ts(417,23): error TS2345: Argument of type '"auth:2faEnabled"' is not assignable to parameter of type 'keyof SystemEvents'.
src/services/auth.service.ts(455,43): error TS2339: Property 'decryptSecret' does not exist on type '{ generateSecret(email: string): { secret: string; qrCode: Promise<string>; backupCodes: string[]; }; verifyToken(secret: string, token: string): boolean; generateBackupCodes(): string[]; }'.
src/services/auth.service.ts(475,7): error TS2554: Expected 1 arguments, but got 5.
src/services/auth.service.ts(481,23): error TS2345: Argument of type '"auth:2faDisabled"' is not assignable to parameter of type 'keyof SystemEvents'.
src/services/auth.service.ts(494,41): error TS2339: Property 'incrWithExpire' does not exist on type '{ getJSON<T>(key: string): Promise<T | null>; setJSON<T>(key: string, value: T, ttl?: number | undefined): Promise<void>; incrementWithExpiry(key: string, ttl: number): Promise<...>; ... 24 more ...; ping(): Promise<...>; }'.
src/services/auth.service.ts(499,36): error TS2345: Argument of type 'string' is not assignable to parameter of type 'boolean'.
src/services/auth.service.ts(525,9): error TS2554: Expected 1 arguments, but got 5.
src/services/auth.service.ts(563,55): error TS2353: Object literal may only specify known properties, and 'correlationId' does not exist in type '{ userId: string; }'.
src/services/auth.service.ts(592,48): error TS2554: Expected 0-1 arguments, but got 2.
src/services/auth.service.ts(627,23): error TS2345: Argument of type '"auth:passwordResetRequested"' is not assignable to parameter of type 'keyof SystemEvents'.
src/services/auth.service.ts(676,26): error TS2339: Property 'session' does not exist on type '{ getJSON<T>(key: string): Promise<T | null>; setJSON<T>(key: string, value: T, ttl?: number | undefined): Promise<void>; incrementWithExpiry(key: string, ttl: number): Promise<...>; ... 24 more ...; ping(): Promise<...>; }'.
src/services/auth.service.ts(686,7): error TS2554: Expected 1 arguments, but got 5.
src/services/auth.service.ts(694,7): error TS2353: Object literal may only specify known properties, and 'correlationId' does not exist in type '{ userId: string; }'.
src/services/auth.service.ts(703,44): error TS2339: Property 'session' does not exist on type '{ getJSON<T>(key: string): Promise<T | null>; setJSON<T>(key: string, value: T, ttl?: number | undefined): Promise<void>; incrementWithExpiry(key: string, ttl: number): Promise<...>; ... 24 more ...; ping(): Promise<...>; }'.
src/services/auth.service.ts(706,24): error TS2339: Property 'session' does not exist on type '{ getJSON<T>(key: string): Promise<T | null>; setJSON<T>(key: string, value: T, ttl?: number | undefined): Promise<void>; incrementWithExpiry(key: string, ttl: number): Promise<...>; ... 24 more ...; ping(): Promise<...>; }'.
src/services/auth.service.ts(717,7): error TS2353: Object literal may only specify known properties, and 'userId' does not exist in type '{ sessionToken: string; }'.
src/services/auth.service.ts(724,44): error TS2339: Property 'session' does not exist on type '{ getJSON<T>(key: string): Promise<T | null>; setJSON<T>(key: string, value: T, ttl?: number | undefined): Promise<void>; incrementWithExpiry(key: string, ttl: number): Promise<...>; ... 24 more ...; ping(): Promise<...>; }'.
src/services/auth.service.ts(738,26): error TS2339: Property 'session' does not exist on type '{ getJSON<T>(key: string): Promise<T | null>; setJSON<T>(key: string, value: T, ttl?: number | undefined): Promise<void>; incrementWithExpiry(key: string, ttl: number): Promise<...>; ... 24 more ...; ping(): Promise<...>; }'.
src/services/auth.service.ts(749,24): error TS2339: Property 'session' does not exist on type '{ getJSON<T>(key: string): Promise<T | null>; setJSON<T>(key: string, value: T, ttl?: number | undefined): Promise<void>; incrementWithExpiry(key: string, ttl: number): Promise<...>; ... 24 more ...; ping(): Promise<...>; }'.
src/services/email.service.ts(115,71): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'LogContext | undefined'.
src/services/email.service.ts(307,34): error TS2345: Argument of type 'Promise<string>' is not assignable to parameter of type 'string'.
src/services/email.service.ts(309,14): error TS2322: Type 'Promise<string>' is not assignable to type 'string'.
src/services/email.service.ts(340,23): error TS2345: Argument of type '"email:sent"' is not assignable to parameter of type 'keyof SystemEvents'.
src/services/email.service.ts(533,20): error TS2353: Object literal may only specify known properties, and 'likes' does not exist in type 'PostOrderByWithRelationInput | PostOrderByWithRelationInput[]'.
src/services/notification.service.ts(187,18): error TS7053: Element implicitly has an 'any' type because expression of type 'NotificationType' can't be used to index type '{ SYSTEM: number; ACHIEVEMENT_UNLOCKED: number; LEVEL_UP: number; CONTENT_FEATURED: number; MILESTONE_REACHED: number; default: number; }'.
  Property 'POST_LIKED' does not exist on type '{ SYSTEM: number; ACHIEVEMENT_UNLOCKED: number; LEVEL_UP: number; CONTENT_FEATURED: number; MILESTONE_REACHED: number; default: number; }'.
src/services/notification.service.ts(286,34): error TS2532: Object is possibly 'undefined'.
src/services/upload.service.ts(121,25): error TS2345: Argument of type '"file:uploaded"' is not assignable to parameter of type 'keyof SystemEvents'.
src/services/upload.service.ts(166,50): error TS2345: Argument of type 'Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>' is not assignable to parameter of type 'Buffer<ArrayBufferLike>'.
  Type 'Uint8Array<ArrayBufferLike>' is missing the following properties from type 'Buffer<ArrayBufferLike>': write, toJSON, equals, compare, and 66 more.
src/services/upload.service.ts(187,26): error TS2339: Property 'width' does not exist on type '{ width: number; height: number; quality: number; } | { width: number; height: number; quality: number; } | { width: number; height: number; quality: number; } | { width: number; height: number; quality: number; } | { ...; }'.
  Property 'width' does not exist on type '{ quality: number; }'.
src/services/upload.service.ts(187,40): error TS2339: Property 'height' does not exist on type '{ width: number; height: number; quality: number; } | { width: number; height: number; quality: number; } | { width: number; height: number; quality: number; } | { width: number; height: number; quality: number; } | { ...; }'.
  Property 'height' does not exist on type '{ quality: number; }'.
src/services/upload.service.ts(417,12): error TS2532: Object is possibly 'undefined'.
src/services/upload.service.ts(475,23): error TS2345: Argument of type '"upload:progress"' is not assignable to parameter of type 'keyof SystemEvents'.
src/services/user.service.ts(216,49): error TS2353: Object literal may only specify known properties, and 'correlationId' does not exist in type '{ user: any; }'.
src/services/user.service.ts(330,55): error TS2339: Property 'BIO_MAX' does not exist on type '{ username: { min: number; max: number; }; password: { min: number; max: number; }; email: { max: number; }; bio: { max: number; }; postTitle: { min: number; max: number; }; postContent: { min: number; max: number; }; commentContent: { ...; }; tagName: { ...; }; groupName: { ...; }; groupDescription: { ...; }; }'.
src/services/user.service.ts(331,52): error TS2339: Property 'BIO_MAX' does not exist on type '{ username: { min: number; max: number; }; password: { min: number; max: number; }; email: { max: number; }; bio: { max: number; }; postTitle: { min: number; max: number; }; postContent: { min: number; max: number; }; commentContent: { ...; }; tagName: { ...; }; groupName: { ...; }; groupDescription: { ...; }; }'.
src/services/user.service.ts(385,47): error TS2353: Object literal may only specify known properties, and 'correlationId' does not exist in type '{ user: any; }'.
src/services/user.service.ts(483,7): error TS2353: Object literal may only specify known properties, and 'correlationId' does not exist in type '{ user: any; status: string; reason?: string | undefined; }'.
src/services/user.service.ts(624,11): error TS2353: Object literal may only specify known properties, and 'correlationId' does not exist in type '{ userId: string; oldLevel: number; newLevel: number; }'.
src/services/user.service.ts(774,25): error TS2551: Property 'status' does not exist on type '{ id: string; username: string; image: string | null; bio: string | null; role: UserRole; verified: boolean; level: number; lastSeenAt: Date | null; createdAt: Date; profile: { ...; } | null; stats: { ...; } | null; _count: { ...; }; }'. Did you mean 'stats'?
src/services/user.service.ts(862,49): error TS2353: Object literal may only specify known properties, and 'correlationId' does not exist in type '{ userId: string; }'.
src/types/comment.ts(49,18): error TS2430: Interface 'CommentWithRelations' incorrectly extends interface '{ content: string; userAgent: string | null; id: string; version: number; deleted: boolean; deletedAt: Date | null; deletedBy: string | null; createdAt: Date; updatedAt: Date; ... 13 more ...; pinned: boolean; }'.
  Types of property 'editHistory' are incompatible.
    Type 'EditHistoryEntry[] | undefined' is not assignable to type 'JsonValue[]'.
      Type 'undefined' is not assignable to type 'JsonValue[]'.
src/types/index.ts(12,3): error TS2305: Module '"@prisma/client"' has no exported member 'JsonValue'.

---
# File: package.json
```json
{
  "name": "sparkle-universe",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "db:indexes": "tsx scripts/apply-indexes.ts",
    "postinstall": "prisma generate",
    "prepare": "husky install",
    "validate": "npm run lint && npm run type-check && npm run test",
    "analyze": "ANALYZE=true next build"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.10.0",
    "@aws-sdk/client-s3": "^3.864.0",
    "@aws-sdk/s3-request-presigner": "^3.864.0",
    "@hookform/resolvers": "^5.2.1",
    "@next-auth/prisma-adapter": "^1.0.7",
    "@portabletext/react": "^3.2.1",
    "@prisma/client": "^6.14.0",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@react-email/components": "^0.5.0",
    "@react-email/render": "^1.2.0",
    "@react-three/drei": "^9.122.0",
    "@react-three/fiber": "^8.18.0",
    "@socket.io/redis-adapter": "^8.3.0",
    "@tanstack/react-query": "^5.85.3",
    "@tanstack/react-query-devtools": "^5.85.3",
    "@tiptap/extension-code-block-lowlight": "^2.26.1",
    "@tiptap/extension-image": "^2.26.1",
    "@tiptap/extension-link": "^2.26.1",
    "@tiptap/extension-placeholder": "^2.26.1",
    "@tiptap/extension-youtube": "^2.26.1",
    "@tiptap/pm": "^2.26.1",
    "@tiptap/react": "^2.26.1",
    "@tiptap/starter-kit": "^2.26.1",
    "@trpc/client": "^11.4.4",
    "@trpc/next": "^11.4.4",
    "@trpc/react-query": "^11.4.4",
    "@trpc/server": "^11.4.4",
    "@types/swagger-ui-react": "^5.18.0",
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0",
    "algoliasearch": "^5.35.0",
    "bcryptjs": "^3.0.2",
    "bullmq": "^5.58.0",
    "canvas-confetti": "^1.9.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "decimal.js": "^10.6.0",
    "framer-motion": "^11.18.2",
    "googleapis": "^156.0.0",
    "ioredis": "^5.7.0",
    "isomorphic-dompurify": "^2.26.0",
    "jsonwebtoken": "^9.0.2",
    "lowlight": "^3.3.0",
    "lucide-react": "^0.539.0",
    "next": "^14.2.31",
    "next-auth": "^4.24.11",
    "next-sanity": "^9.12.3",
    "next-themes": "^0.4.6",
    "nodemailer": "^6.10.1",
    "openapi-types": "^12.1.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.62.0",
    "react-hot-toast": "^2.6.0",
    "react-intersection-observer": "^9.16.0",
    "react-player": "^3.3.1",
    "sanity": "^3.99.0",
    "sharp": "^0.34.3",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "sonner": "^2.0.7",
    "superjson": "^2.2.2",
    "swagger-ui-react": "^5.27.1",
    "tailwind-merge": "^3.3.1",
    "three": "^0.179.1",
    "twilio": "^5.8.0",
    "uploadthing": "^7.7.4",
    "uuid": "^10.0.0",
    "zod": "^3.25.76",
    "zustand": "^5.0.7"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^15.4.6",
    "@playwright/test": "^1.54.2",
    "@testing-library/jest-dom": "^6.7.0",
    "@testing-library/react": "^16.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/canvas-confetti": "^1.9.0",
    "@types/cookie": "^0.6.0",
    "@types/jest": "^30.0.0",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^22.17.2",
    "@types/nodemailer": "^7.0.0",
    "@types/react": "^19.1.10",
    "@types/react-dom": "^19.1.7",
    "@types/three": "^0.179.0",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^8.39.1",
    "@typescript-eslint/parser": "^8.39.1",
    "autoprefixer": "^10.4.21",
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.31",
    "eslint-config-prettier": "^8.10.2",
    "eslint-plugin-prettier": "^5.5.4",
    "eslint-plugin-react": "^7.37.5",
    "husky": "^9.1.7",
    "jest": "^30.0.5",
    "jest-environment-jsdom": "^30.0.5",
    "lint-staged": "^15.5.2",
    "postcss": "^8.5.6",
    "prettier": "^3.6.2",
    "prettier-plugin-tailwindcss": "^0.6.14",
    "prisma": "^6.14.0",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.20.4",
    "tw-animate-css": "^1.3.7",
    "typescript": "^5.9.2"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.2.5"
}
```

# File: tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["jest", "@testing-library/jest-dom"]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "src/**/*",
    "prisma/**/*",
    "tailwind.config.ts",
    "postcss.config.mjs"
  ],
  "exclude": [
    "node_modules",
    "dist",
    ".next",
    "out",
    "coverage",
    "**/*.spec.ts",
    "**/*.test.ts"
  ]
}
```

# File: tailwind.config.ts 
```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx,mdx}',
    './src/lib/**/*.{ts,tsx}',
    './src/emails/**/*.{ts,tsx}',
    '!./src/**/*.test.{ts,tsx}',
    '!./src/**/*.spec.{ts,tsx}',
    '!./src/**/*.stories.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Sparkle Universe Theme Colors
        sparkle: {
          purple: '#8B5CF6',      // Vibrant Purple
          pink: '#EC4899',        // Hot Pink
          blue: '#3B82F6',        // Electric Blue
          green: '#10B981',       // Emerald
          gold: '#F59E0B',        // Gold
          gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981)',
        },
        // Badge Rarity Colors (8 tiers)
        rarity: {
          common: '#9CA3AF',      // Gray
          uncommon: '#10B981',    // Green
          rare: '#3B82F6',        // Blue
          epic: '#8B5CF6',        // Purple
          legendary: '#F59E0B',   // Gold
          mythic: '#EC4899',      // Pink
          limited: '#EF4444',     // Red
          seasonal: '#14B8A6',    // Teal
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'sparkle': {
          '0%, 100%': { 
            opacity: '0', 
            transform: 'scale(0) rotate(0deg)' 
          },
          '50%': { 
            opacity: '1', 
            transform: 'scale(1) rotate(180deg)' 
          },
        },
        'glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.8)' 
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            opacity: '1',
            filter: 'brightness(1)'
          },
          '50%': { 
            opacity: '0.8',
            filter: 'brightness(1.2)'
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'sparkle-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #10B981 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    // Glassmorphism utilities
    function({ addUtilities }: any) {
      addUtilities({
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.3)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.sparkle-text': {
          'background': 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.sparkle-border': {
          'border-image': 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981) 1',
        },
        '.sparkle-shadow': {
          'box-shadow': '0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(236, 72, 153, 0.2)',
        },
      })
    },
  ],
}

export default config
```

# File: postcss.config.mjs 
```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
```

# File: next.config.mjs
```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

# File: eslint.config.mjs
```mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

# File: .prettierrc.json
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.ts",
  "tailwindFunctions": ["clsx", "cn", "tw"]
}
```

# File: .eslintrc.json
```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports"
      }
    ],
    "react/display-name": "off",
    "react-hooks/exhaustive-deps": "warn"
  },
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "warn"
      }
    }
  ]
}
```

# File: components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

# File: src/app/globals.css 
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 271 91% 65%;  /* Sparkle Purple */
    --primary-foreground: 0 0% 98%;
    --secondary: 327 73% 58%;  /* Sparkle Pink */
    --secondary-foreground: 0 0% 98%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 158 64% 42%;  /* Sparkle Green */
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 271 91% 65%;
    --radius: 0.625rem;
    
    /* Sparkle theme specific */
    --sparkle-purple: 271 91% 65%;
    --sparkle-pink: 327 73% 58%;
    --sparkle-blue: 217 91% 60%;
    --sparkle-green: 158 64% 42%;
    --sparkle-gold: 38 92% 50%;
    
    /* Font variables */
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 6%;
    --popover-foreground: 0 0% 98%;
    --primary: 271 91% 65%;
    --primary-foreground: 240 10% 3.9%;
    --secondary: 327 73% 58%;
    --secondary-foreground: 240 10% 3.9%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 158 64% 42%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 20%;
    --ring: 271 91% 65%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Better focus styles */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Text rendering improvements */
  h1, h2, h3, h4, h5, h6 {
    text-wrap: balance;
  }
  
  p {
    text-wrap: pretty;
  }
}

@layer components {
  /* Glassmorphism card */
  .glass-card {
    @apply bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10;
  }
  
  /* Sparkle button */
  .btn-sparkle {
    @apply relative overflow-hidden;
    background: linear-gradient(135deg, #8B5CF6, #EC4899, #10B981);
    transition: all 0.3s ease;
  }
  
  .btn-sparkle:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
  }
  
  .btn-sparkle::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s;
  }
  
  .btn-sparkle:hover::before {
    left: 100%;
  }
  
  /* Badge rarity styles */
  .badge-common {
    @apply bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30;
  }
  
  .badge-uncommon {
    @apply bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30;
  }
  
  .badge-rare {
    @apply bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30;
  }
  
  .badge-epic {
    @apply bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30;
  }
  
  .badge-legendary {
    @apply bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30;
    animation: glow 2s ease-in-out infinite;
  }
  
  .badge-mythic {
    @apply bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30;
    background: linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2));
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .badge-limited {
    @apply bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30;
    position: relative;
    overflow: hidden;
  }
  
  .badge-seasonal {
    @apply bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30;
  }
  
  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    @apply bg-muted rounded-full;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-primary/30 rounded-full hover:bg-primary/50;
    background: linear-gradient(#8B5CF6, #EC4899);
  }
  
  /* Loading skeleton with sparkle effect */
  .skeleton-sparkle {
    @apply relative overflow-hidden bg-muted;
    background: linear-gradient(90deg, 
      rgba(139,92,246,0.1) 0%, 
      rgba(236,72,153,0.2) 50%, 
      rgba(139,92,246,0.1) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  /* Reaction animations */
  .reaction-bounce {
    animation: bounce 0.5s ease-out;
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
  
  /* Notification bell */
  .notification-bell {
    @apply relative;
  }
  
  .notification-bell.has-unread::after {
    content: '';
    @apply absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full;
    animation: pulse 2s infinite;
  }
}

@layer utilities {
  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Text gradient */
  .text-gradient {
    @apply bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent;
  }
  
  /* Sparkle particle effect */
  .sparkle-effect {
    position: relative;
  }
  
  .sparkle-effect::after {
    content: '✨';
    position: absolute;
    top: -10px;
    right: -10px;
    animation: sparkle 2s ease-in-out infinite;
  }
  
  /* Prevent text selection */
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
}

/* Animations */
@keyframes glow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 
                0 0 40px rgba(236, 72, 153, 0.3);
  }
  50% { 
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.7), 
                0 0 60px rgba(236, 72, 153, 0.5);
  }
}

@keyframes sparkle {
  0%, 100% { 
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% { 
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}

/* Micro-interactions */
.hover-lift {
  transition: transform 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-glow:hover {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
}

/* Loading states */
.loading-dots::after {
  content: '...';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}
```

# Current project codebase file structure and listing:
src/emails/templates/index.tsx
src/hooks/use-socket.ts
src/hooks/use-auth.ts
src/config/achievements.ts
src/types/comment.ts
src/types/index.ts
src/lib/analytics.ts
src/lib/utils.ts.bak
src/lib/security.ts
src/lib/jobs/job-processor.ts
src/lib/socket/socket-server.ts
src/lib/openapi.ts
src/lib/security.ts.bak
src/lib/redis.ts
src/lib/utils.ts
src/lib/api.ts
src/lib/utils/format.ts
src/lib/utils.ts.shadcn-init
src/lib/events/event-emitter.ts
src/lib/auth/auth.ts
src/lib/auth/auth.config.ts
src/lib/monitoring.ts
src/lib/rate-limit.ts
src/lib/validations/comment.ts
src/lib/validations/post.ts
src/lib/validations/user.ts
src/lib/db.ts
src/services/auth.service.ts.bak
src/services/auth.service.ts
src/services/user.service.ts
src/services/notification.service.ts
src/services/email.service.ts
src/services/user.service.ts.bak
src/services/upload.service.ts
src/server/websocket/socket.server.ts
src/server/api/trpc.ts
src/server/api/routers/comment.ts
src/server/api/routers/upload.ts
src/server/api/routers/gamification.ts
src/server/api/routers/post.ts
src/server/api/routers/youtube.ts
src/server/api/routers/search.ts
src/server/api/routers/admin.ts
src/server/api/routers/notification.ts
src/server/api/routers/user.ts
src/server/api/root.ts
src/server/services/comment.service.ts
src/server/services/user.service.ts.bak2
src/server/services/event.service.ts
src/server/services/watchparty.service.ts
src/server/services/user.service.ts
src/server/services/mention.service.ts
src/server/services/cache.service.ts.bak2
src/server/services/notification.service.ts
src/server/services/realtime.service.ts
src/server/services/post.service.ts
src/server/services/watch-party.service.ts
src/server/services/activity.service.ts
src/server/services/gamification.service.ts
src/server/services/youtube.service.ts
src/server/services/upload.service.ts
src/server/services/achievement.service.ts
src/server/services/cache.service.ts
src/server/services/admin.service.ts
src/server/services/moderation.service.ts
src/server/services/search.service.ts
src/middleware.ts
src/components/ui/button.tsx
src/components/ui/select.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/switch.tsx
src/components/ui/badge.tsx
src/components/ui/textarea.tsx
src/components/ui/separator.tsx
src/components/ui/tooltip.tsx
src/components/ui/progress.tsx
src/components/ui/avatar.tsx
src/components/ui/input.tsx
src/components/ui/checkbox.tsx
src/components/ui/table.tsx
src/components/ui/tabs.tsx
src/components/ui/sonner.tsx
src/components/ui/dialog.tsx
src/components/ui/scroll-area.tsx
src/components/ui/card.tsx
src/components/admin/admin-sidebar.tsx
src/components/error-boundary.tsx
src/components/features/youtube/youtube-embed.tsx
src/components/features/gamification/level-progress.tsx
src/components/features/gamification/achievement-details-modal.tsx
src/components/features/gamification/achievement-grid.tsx
src/components/features/editor/rich-text-editor.tsx
src/components/features/post/post-card.tsx
src/components/features/post/post-actions.tsx
src/components/features/comments/comment-form.tsx
src/components/features/comments/mention-suggestions.tsx
src/components/features/comments/comment-item.tsx
src/components/features/comments/reaction-picker.tsx
src/components/features/comments/comment-thread.tsx
src/app/globals.css
src/app/(main)/create/page.tsx
src/app/api-docs/page.tsx
src/app/api/trpc/[trpc]/route.ts
src/app/api/admin/jobs/route.ts
src/app/api/openapi.json/route.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/layout.tsx
src/app/admin/layout.tsx
src/app/admin/moderation/page.tsx
src/app/admin/moderation/page.tsx.p6
src/app/admin/dashboard/page.tsx
src/app/admin/users/page.tsx
src/app/fonts/GeistVF.woff
src/app/fonts/GeistMonoVF.woff
