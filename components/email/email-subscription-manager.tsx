"use client"

import { useState, useTransition, useMemo } from "react"
import {
  AtSign,
  Ban,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Inbox,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Reply,
  Search,
  ShieldAlert,
  Sparkles,
  Square,
  Trash2,
  Users2,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { CreateEmailDrawer } from "@/components/create/create-email-drawer"
import { deleteEmails, deleteEmailsBySender, markEmailsAsRead } from "@/app/w/[workspace]/email/actions"

export type EmailItem = {
  id: string
  subject: string | null
  fromName: string | null
  fromEmail: string | null
  snippet: string | null
  body: string | null
  receivedAt: string | Date
  isRead: boolean
  category: string | null
}

function extractUnsubscribeLink(body: string | null, snippet: string | null): string | null {
  const text = `${body || ""} ${snippet || ""}`
  // Look for href="https://...unsubscribe..." or http(s)://...unsubscribe...
  const match = text.match(/https?:\/\/[^\s"'<>]*(?:unsubscribe|optout|opt-out|manage-preferences|email-preferences|subscriptions)[^\s"'<>]*/i)
  if (match) return match[0]

  // Fallback to mailto:
  const mailtoMatch = text.match(/mailto:[^\s"'<>]*\?subject=[^\s"'<>]*/i)
  if (mailtoMatch) return mailtoMatch[0]

  return null
}

export function EmailSubscriptionManager({
  workspace,
  initialEmails,
}: {
  workspace: string
  initialEmails: EmailItem[]
}) {
  const [emails, setEmails] = useState<EmailItem[]>(initialEmails)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Derive categories
  const clientComms = useMemo(
    () =>
      emails.filter(
        (e) =>
          e.category === "CLIENT_COMMS" ||
          e.category === "TASK_REQUEST" ||
          e.subject?.toLowerCase().includes("project") ||
          e.subject?.toLowerCase().includes("brief")
      ),
    [emails]
  )

  const financialEmails = useMemo(
    () =>
      emails.filter(
        (e) =>
          e.category === "INVOICE" ||
          e.category === "RECEIPT" ||
          e.category === "SUBSCRIPTION" ||
          e.subject?.toLowerCase().includes("invoice") ||
          e.subject?.toLowerCase().includes("receipt") ||
          e.subject?.toLowerCase().includes("statement") ||
          e.subject?.toLowerCase().includes("payment")
      ),
    [emails]
  )

  const actionRequired = useMemo(
    () =>
      emails.filter(
        (e) => !e.isRead || e.category === "TASK_REQUEST" || e.subject?.toLowerCase().includes("urgent")
      ),
    [emails]
  )

  // Group recurring senders & newsletters
  const subscriptionSenders = useMemo(() => {
    const senderMap = new Map<
      string,
      {
        fromEmail: string
        fromName: string
        emails: EmailItem[]
        unsubscribeUrl: string | null
        lastReceived: Date
      }
    >()

    for (const email of emails) {
      const from = (email.fromEmail || "unknown").toLowerCase()
      const existing = senderMap.get(from)
      const unsubLink = extractUnsubscribeLink(email.body, email.snippet)
      const received = new Date(email.receivedAt)

      if (existing) {
        existing.emails.push(email)
        if (!existing.unsubscribeUrl && unsubLink) {
          existing.unsubscribeUrl = unsubLink
        }
        if (received > existing.lastReceived) {
          existing.lastReceived = received
        }
      } else {
        senderMap.set(from, {
          fromEmail: email.fromEmail || "unknown",
          fromName: email.fromName || email.fromEmail || "Unknown Sender",
          emails: [email],
          unsubscribeUrl: unsubLink,
          lastReceived: received,
        })
      }
    }

    // Filter to senders with >= 1 recurring emails or explicit unsubscribe links or marketing indicators
    return Array.from(senderMap.values())
      .filter(
        (s) =>
          s.emails.length >= 1 &&
          (s.unsubscribeUrl ||
            s.emails.length >= 2 ||
            /^(newsletter|promo|marketing|deals|notifications|updates|digest|info|no-reply|noreply)@/i.test(
              s.fromEmail
            ) ||
            s.emails.some((e) => e.category === "NOISE" || e.category === "SUBSCRIPTION"))
      )
      .sort((a, b) => b.emails.length - a.emails.length || b.lastReceived.getTime() - a.lastReceived.getTime())
  }, [emails])

  // Get active list based on tab
  const displayedEmails = useMemo(() => {
    let list = emails
    if (activeTab === "action") list = actionRequired
    else if (activeTab === "clients") list = clientComms
    else if (activeTab === "finance") list = financialEmails
    else if (activeTab === "subscriptions") {
      const subEmailIds = new Set(subscriptionSenders.flatMap((s) => s.emails.map((e) => e.id)))
      list = emails.filter((e) => subEmailIds.has(e.id))
    }

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (e) =>
        e.subject?.toLowerCase().includes(q) ||
        e.fromEmail?.toLowerCase().includes(q) ||
        e.fromName?.toLowerCase().includes(q) ||
        e.snippet?.toLowerCase().includes(q)
    )
  }, [emails, activeTab, actionRequired, clientComms, financialEmails, subscriptionSenders, searchQuery])

  // Selection handlers
  const isAllSelected = displayedEmails.length > 0 && displayedEmails.every((e) => selectedIds.has(e.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds)
      displayedEmails.forEach((e) => next.delete(e.id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      displayedEmails.forEach((e) => next.add(e.id))
      setSelectedIds(next)
    }
  }

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Bulk Actions
  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    if (!confirm(`Are you sure you want to delete ${ids.length} selected email(s)?`)) return

    startTransition(async () => {
      await deleteEmails(workspace, ids)
      setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)))
      setSelectedIds(new Set())
      setStatusMessage(`Successfully deleted ${ids.length} email(s).`)
      setTimeout(() => setStatusMessage(null), 4000)
    })
  }

  const handleBulkMarkRead = () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return

    startTransition(async () => {
      await markEmailsAsRead(workspace, ids)
      setEmails((prev) =>
        prev.map((e) => (selectedIds.has(e.id) ? { ...e, isRead: true } : e))
      )
      setSelectedIds(new Set())
      setStatusMessage(`Marked ${ids.length} email(s) as read.`)
      setTimeout(() => setStatusMessage(null), 4000)
    })
  }

  const handleDeleteAllFromSender = (fromEmail: string) => {
    if (!confirm(`Delete all emails received from ${fromEmail}?`)) return

    startTransition(async () => {
      await deleteEmailsBySender(workspace, fromEmail)
      setEmails((prev) => prev.filter((e) => e.fromEmail?.toLowerCase() !== fromEmail.toLowerCase()))
      setStatusMessage(`Deleted all emails from ${fromEmail}.`)
      setTimeout(() => setStatusMessage(null), 4000)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Bulk Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search emails, senders, subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Global Select All / Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleSelectAll}
            className="h-8 gap-1.5 text-xs"
          >
            {isAllSelected ? (
              <CheckSquare className="size-3.5 text-primary" />
            ) : (
              <Square className="size-3.5 text-muted-foreground" />
            )}
            <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
          </Button>

          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isPending}
                className="h-8 gap-1.5 text-xs"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleBulkMarkRead}
                disabled={isPending}
                className="h-8 gap-1.5 text-xs"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Mark Read</span>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      {/* Main Tabbed Communication Matrix */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-8 text-[0.6875rem]">
          <TabsTrigger value="all">All ({emails.length})</TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-1">
            <span>Subscriptions ({subscriptionSenders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="action">Action Required ({actionRequired.length})</TabsTrigger>
          <TabsTrigger value="clients">Client Comms ({clientComms.length})</TabsTrigger>
          <TabsTrigger value="finance">Invoices ({financialEmails.length})</TabsTrigger>
        </TabsList>

        {/* 1. SUBSCRIPTIONS & NEWSLETTERS TAB */}
        <TabsContent value="subscriptions" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Ban className="size-4 text-primary" />
                  Recurring Senders &amp; Subscription Clean-Up
                </span>
                <Badge variant="outline">{subscriptionSenders.length} Senders Identified</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your recurring daily emails, marketing newsletters, and subscriptions. Unsubscribe with 1-click or bulk delete old emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {subscriptionSenders.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Recurring Subscriptions Found</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Your inbox is clean of automated recurring newsletters and marketing blasts.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {subscriptionSenders.map((sub) => {
                    const allSubEmailIds = sub.emails.map((e) => e.id)
                    const isAllSubSelected = allSubEmailIds.every((id) => selectedIds.has(id))

                    return (
                      <div
                        key={sub.fromEmail}
                        className="p-4 hover:bg-muted/30 transition-colors flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isAllSubSelected}
                            onChange={() => {
                              const next = new Set(selectedIds)
                              if (isAllSubSelected) {
                                allSubEmailIds.forEach((id) => next.delete(id))
                              } else {
                                allSubEmailIds.forEach((id) => next.add(id))
                              }
                              setSelectedIds(next)
                            }}
                            className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {sub.fromName}
                              </span>
                              <Badge variant="secondary" className="text-[0.625rem] font-mono">
                                {sub.emails.length} email{sub.emails.length === 1 ? "" : "s"}
                              </Badge>
                            </div>
                            <p className="text-[0.6875rem] text-muted-foreground font-mono truncate">
                              {sub.fromEmail} · Last active {sub.lastReceived.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>

                        {/* Unsubscribe & Purge Actions */}
                        <div className="flex items-center gap-2">
                          {sub.unsubscribeUrl ? (
                            <a
                              href={sub.unsubscribeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 px-2.5 py-1.5 text-xs font-medium transition-colors"
                            >
                              <ExternalLink className="size-3" />
                              <span>Unsubscribe</span>
                            </a>
                          ) : (
                            <a
                              href={`https://mail.google.com/mail/u/0/#search/from%3A${encodeURIComponent(sub.fromEmail)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="size-3" />
                              <span>Search in Gmail</span>
                            </a>
                          )}

                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteAllFromSender(sub.fromEmail)}
                            disabled={isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1"
                          >
                            <Trash2 className="size-3" />
                            <span>Delete All ({sub.emails.length})</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. ALL MESSAGES TAB */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Synchronized Inbox Timeline</span>
                <Badge variant="outline">{displayedEmails.length} Displayed</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {displayedEmails.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Messages Found</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    No emails match your current filter or search criteria.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {displayedEmails.map((email) => {
                    const isSelected = selectedIds.has(email.id)
                    const unsubLink = extractUnsubscribeLink(email.body, email.snippet)

                    return (
                      <div
                        key={email.id}
                        className={`p-4 hover:bg-muted/30 transition-colors space-y-2 ${
                          isSelected ? "bg-muted/40" : ""
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(email.id)}
                              className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-sm truncate">
                                  {email.subject || "No Subject"}
                                </span>
                                <Badge variant="secondary" className="text-[0.625rem] font-mono">
                                  {email.category || "GENERAL"}
                                </Badge>
                                {!email.isRead ? (
                                  <Badge variant="destructive" className="text-[0.625rem]">
                                    Unread
                                  </Badge>
                                ) : null}
                              </div>

                              <p className="text-[0.625rem] text-muted-foreground font-mono">
                                From: {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail || "Unknown"} · Received{" "}
                                {new Date(email.receivedAt).toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {unsubLink ? (
                              <a
                                href={unsubLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 px-2 py-1 text-xs font-medium"
                              >
                                <Ban className="size-3" />
                                <span>Unsubscribe</span>
                              </a>
                            ) : null}

                            <CreateEmailDrawer
                              workspace={workspace}
                              defaultToEmail={email.fromEmail || ""}
                              defaultSubject={`Re: ${email.subject || ""}`}
                              trigger={
                                <Button size="xs" variant="outline" className="gap-1 text-xs">
                                  <Reply className="size-3" />
                                  <span>Reply</span>
                                </Button>
                              }
                            />

                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                startTransition(async () => {
                                  await deleteEmails(workspace, [email.id])
                                  setEmails((prev) => prev.filter((e) => e.id !== email.id))
                                })
                              }}
                              className="text-muted-foreground hover:text-destructive text-xs p-1"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {email.snippet ? (
                          <p className="text-xs text-muted-foreground font-mono line-clamp-2 bg-muted/20 rounded p-2 border">
                            {email.snippet}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ACTION REQUIRED TAB */}
        <TabsContent value="action" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Action Required &amp; Urgent</span>
                <Badge variant="outline">{displayedEmails.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {displayedEmails.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">Inbox Zero Achieved</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    All high-priority emails and task requests have been addressed.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {displayedEmails.map((email) => (
                    <div key={email.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{email.subject}</span>
                        <Badge variant="destructive" className="text-[0.625rem]">
                          Action Required
                        </Badge>
                      </div>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono">{email.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. CLIENT COMMS TAB */}
        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Client Communications &amp; Threads</span>
                <Badge variant="outline">{displayedEmails.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {displayedEmails.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Client Communications</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Client emails will appear here automatically when linked.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {displayedEmails.map((email) => (
                    <div key={email.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{email.subject}</span>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono">{email.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. FINANCIAL EMAILS TAB */}
        <TabsContent value="finance" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Financial Statements &amp; SaaS Invoices</span>
                <Badge variant="outline">{displayedEmails.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {displayedEmails.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Financial Emails</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Invoices and receipts received via email are processed into the Finance domain.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {displayedEmails.map((email) => (
                    <div key={email.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{email.subject}</span>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono">{email.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
