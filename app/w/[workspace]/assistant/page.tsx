import { requireWorkspace } from "@/lib/auth/dal"
import { AssistantPanel } from "@/components/assistant/assistant-panel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Bot, MessageSquare, ShieldCheck, Target, Zap } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const [openTasksCount, pendingApprovalsCount, inboxPendingCount] =
    await Promise.all([
      db.task.count({
        where: {
          status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
          parentId: null,
        },
      }),
      db.approvalRequest.count({ where: { status: "PENDING" } }),
      db.inboxItem.count({ where: { status: { in: ["PENDING", "NEEDS_REVIEW"] } } }),
    ])

  const tiles = [
    {
      label: "Open tasks",
      value: openTasksCount.toString(),
      note: "scheduled and backlog",
      icon: Target,
    },
    {
      label: "Awaiting approval",
      value: pendingApprovalsCount.toString(),
      note: "outbound email only",
      icon: Zap,
    },
    {
      label: "Inbox",
      value: inboxPendingCount.toString(),
      note: "captures to triage",
      icon: MessageSquare,
    },
    {
      label: "Delete tools",
      value: "0",
      note: "the agent cannot destroy data",
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="flex h-[calc(100svh-4rem)] max-h-[calc(100svh-4rem)] flex-col gap-3 overflow-hidden p-3 md:p-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Assistant</h1>
          <p className="text-[0.6875rem] text-muted-foreground">
            Reads your mail, unlocks statements, plans the day, and remembers how
            you work.
          </p>
        </div>

        <Badge variant="outline" className="gap-1.5 py-0.5 font-mono text-[0.6875rem]">
          <Bot className="size-3 text-primary" />
          Personal OS
        </Badge>
      </div>

      {/* Resizable so the sidebar can be pushed out of the way when the
          conversation is what matters. */}
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {/* Sizes are strings: react-resizable-panels reads bare numbers as
            pixels and strings as percentages. */}
        <ResizablePanel
          defaultSize="26"
          minSize="16"
          maxSize="40"
          collapsible
          collapsedSize="0"
          className="hidden lg:block"
        >
          <div className="flex h-full flex-col gap-2.5 overflow-y-auto pr-3">
            <div className="grid shrink-0 grid-cols-2 gap-2">
              {tiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Card key={tile.label} className="p-0 shadow-xs">
                    <CardContent className="flex flex-col gap-1 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-[0.625rem] font-medium text-muted-foreground">
                          {tile.label}
                        </span>
                        <Icon className="size-3 shrink-0 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold tabular-nums">
                          {tile.value}
                        </p>
                        <p className="truncate text-[0.5625rem] text-muted-foreground">
                          {tile.note}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Item variant="muted" size="sm" className="shrink-0">
              <ItemMedia variant="icon">
                <ShieldCheck className="text-primary" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Safety boundary</ItemTitle>
                <ItemDescription className="leading-relaxed">
                  Reading, creating and editing run on their own and are all
                  logged. There is no delete tool. Sending email is the only
                  action that stops for your approval.
                </ItemDescription>
              </ItemContent>
            </Item>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden lg:flex" />

        <ResizablePanel defaultSize="74" minSize="40">
          <div className="flex h-full min-h-0 flex-col overflow-hidden lg:pl-3">
            <AssistantPanel workspace={workspace} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
