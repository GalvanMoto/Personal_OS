import { requireWorkspace } from "@/lib/auth/dal"
import { listVaultMeta, getVaultMap, buildPasswordCandidates } from "@/lib/domain/vault"
import { saveVaultSecretAction, deleteVaultSecretAction } from "@/lib/actions/vault"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Lock,
  ShieldCheck,
  KeyRound,
  EyeOff,
  Bot,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Wallet,
  Calendar,
  ListTodo,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const metadata = { title: "Secure Credential & Identity Vault · Personal OS" }

export default async function VaultPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ bank?: string }>
}) {
  const { workspace } = await params
  const { bank } = await searchParams
  const { db } = await requireWorkspace(workspace)

  const [meta, vault] = await Promise.all([listVaultMeta(db), getVaultMap(db)])
  const activeBank = bank || "SBI"
  const candidates = buildPasswordCandidates(vault, activeBank)

  const hasPAN = meta.some((m) => m.kind === "PAN")
  const hasDOB = meta.some((m) => m.kind === "DOB")
  const hasPhone = meta.some((m) => m.kind === "PHONE")

  const permissions = [
    {
      agent: "Finance Agent & Document Processor",
      icon: Wallet,
      color: "#10b981",
      panAccess: true,
      dobAccess: true,
      secretAccess: "Indirect (In-Memory Decrypt Only)",
      notes: "Unlocks bank statement PDFs & extracts transaction ledger.",
    },
    {
      agent: "AI Model / LLM Context",
      icon: Bot,
      color: "#06b6d4",
      panAccess: false,
      dobAccess: false,
      secretAccess: "NEVER (Blocked)",
      notes: "Receives only parsed structured financial tables, never raw secrets.",
    },
    {
      agent: "Calendar & Planning Agent",
      icon: Calendar,
      color: "#ec4899",
      panAccess: false,
      dobAccess: false,
      secretAccess: "Blocked",
      notes: "Only accesses meeting times, focus windows, and deadlines.",
    },
    {
      agent: "Task & Project Agent",
      icon: ListTodo,
      color: "#8b5cf6",
      panAccess: false,
      dobAccess: false,
      secretAccess: "Blocked",
      notes: "Only accesses deliverables, checklist items, and project graphs.",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight flex items-center gap-2">
            <Lock className="size-5 text-primary" /> Credential &amp; Identity Vault
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Hardware-grade AES-256 encrypted credential vault for automated statement decryption and identity protection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-[0.6875rem]">
            <ShieldCheck className="size-3 text-emerald-500" /> AES-256-GCM • Workspace Isolated
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-mono text-[0.6875rem]">
            <EyeOff className="size-3 text-cyan-400" /> Zero LLM Exposure
          </Badge>
        </div>
      </div>

      {/* Security Philosophy Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 text-xs leading-relaxed space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium flex items-center gap-1.5 text-foreground">
              <KeyRound className="size-3.5 text-primary" /> The Personal OS Security Architecture
            </p>
            <span className="font-mono text-[0.625rem] text-primary">docs/modules/vault.txt</span>
          </div>
          <p className="text-muted-foreground">
            When a password-protected bank statement (SBI, HDFC, ICICI, Chase, Zerodha) arrives by email, the <strong>Document Processor</strong> builds candidate decryption keys in-memory and unlocks the PDF locally.
          </p>
          <p className="text-foreground/90 font-medium">
            🛡️ The AI Agent and LLM prompt context NEVER receive your raw passwords. The agent only receives the extracted, structured financial transactions after local verification.
          </p>
        </CardContent>
      </Card>

      {/* Main Grid: Vault Items & Add Form */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Current Encrypted Vault Entries */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Encrypted Credentials</CardTitle>
              <Badge variant="secondary" className="font-mono text-[0.625rem]">
                {meta.length} stored
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Values are encrypted with AES-256 before storage and never displayed in plain text.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {meta.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground font-mono">
                No credentials stored yet. Add your PAN, DOB, or Bank Password on the right to enable automatic statement extraction.
              </div>
            ) : (
              <div className="space-y-2">
                {meta.map((m) => (
                  <div
                    key={`${m.kind}:${m.label}`}
                    className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[0.625rem]">
                        {m.kind}
                      </Badge>
                      <span className="font-medium text-foreground">{m.label}</span>
                      <span className="font-mono text-muted-foreground text-[0.6875rem]">
                        {m.masked}
                      </span>
                    </div>
                    <form action={deleteVaultSecretAction.bind(null, workspace, m.kind, m.label) as unknown as string}>
                      <button
                        type="submit"
                        className="text-[0.6875rem] text-muted-foreground hover:text-destructive transition-colors font-medium px-2 py-1 rounded hover:bg-destructive/10"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[0.625rem] text-muted-foreground pt-1 border-t">
              <EyeOff className="size-3" /> Plaintext is never logged or shown after saving.
            </div>
          </CardContent>
        </Card>

        {/* Right: Add New Vault Credential Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add to Credential Vault</CardTitle>
            <CardDescription className="text-xs">
              Add individual identity components or explicit bank statement passwords.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveVaultSecretAction.bind(null, workspace) as unknown as string} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Credential Type</Label>
                  <select
                    name="kind"
                    defaultValue="PAN"
                    className="w-full rounded border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                  >
                    <option value="PAN">PAN (Permanent Account Number)</option>
                    <option value="DOB">Date of Birth (DDMMYYYY)</option>
                    <option value="PHONE">Phone Number</option>
                    <option value="NAME">Full Legal Name (as on Bank)</option>
                    <option value="CUSTOMER_ID">Customer ID / Account #</option>
                    <option value="BANK_TEMPLATE">Direct Bank Password</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Label / Bank Name</Label>
                  <Input
                    name="label"
                    placeholder="e.g. JIO, SBI, HDFC (or leave as 'default')"
                    defaultValue="default"
                    className="h-8 text-xs"
                    required
                  />
                  <p className="text-[0.625rem] text-muted-foreground">
                    For Jio use <span className="font-mono">JIO</span> or <span className="font-mono">JPB</span>. For direct password, label the bank.
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Secret Value</Label>
                <Input
                  name="value"
                  type="password"
                  placeholder="Enter secret (ABCDE1234F / 15081990 / password)"
                  className="h-8 text-xs font-mono"
                  required
                />
                <p className="text-[0.625rem] text-muted-foreground">
                  Encrypted immediately in memory with AES-256 before writing to database.
                </p>
              </div>
              <Button type="submit" size="sm" className="w-full h-8 text-xs font-medium">
                🔒 Save Encrypted Secret
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Decryption Preview & Candidate Simulator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm">Decryption Candidate Preview</CardTitle>
              <CardDescription className="text-xs">
                In-memory password patterns generated for incoming statements ({activeBank}).
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              {["SBI", "HDFC", "ICICI", "JIO", "AXIS", "KOTAK", "CHASE", "ZERODHA"].map((b) => (
                <a
                  key={b}
                  href={`?bank=${b}`}
                  className={`px-2 py-0.5 rounded border text-[0.6875rem] font-mono transition-colors ${
                    activeBank === b
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {b}
                </a>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasPAN && !hasDOB && !hasPhone ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground font-mono">
              Add at least PAN, DOB, or Phone in the vault above to generate automated statement decryption keys.
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-xs text-muted-foreground">No candidate keys generated for this provider.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {candidates.slice(0, 10).map((c, i) => (
                <Badge key={i} variant="secondary" className="font-mono text-[0.6875rem] py-1 px-2">
                  <span className="text-muted-foreground mr-1">#{i + 1}</span>
                  {c.slice(0, 2)}••••{c.slice(-2)}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-[0.625rem] text-muted-foreground">
            The Document Processor tests these candidates sequentially in-memory without logging passwords. Once verified, the statement is converted to clean double-entry transactions.
          </p>
        </CardContent>
      </Card>

      {/* Agent Access & Privacy Isolation Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Agent Privacy &amp; Access Policy Matrix</CardTitle>
          <CardDescription className="text-xs">
            Guaranteed isolation rules governing which autonomous agents have access to identity and credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-[0.6875rem] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Agent / System Role</th>
                  <th className="px-4 py-2.5 font-medium">PAN Access</th>
                  <th className="px-4 py-2.5 font-medium">DOB Access</th>
                  <th className="px-4 py-2.5 font-medium">Credential Access</th>
                  <th className="px-4 py-2.5 font-medium">Policy Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {permissions.map((p) => {
                  const Icon = p.icon
                  return (
                    <tr key={p.agent} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="size-3.5" style={{ color: p.color }} />
                          <span>{p.agent}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.panAccess ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[0.6875rem]">
                            <CheckCircle2 className="size-3" /> Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground font-mono text-[0.6875rem]">
                            <XCircle className="size-3 text-destructive/60" /> Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.dobAccess ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[0.6875rem]">
                            <CheckCircle2 className="size-3" /> Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground font-mono text-[0.6875rem]">
                            <XCircle className="size-3 text-destructive/60" /> Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[0.6875rem]">
                        <Badge
                          variant={p.secretAccess.startsWith("Indirect") ? "secondary" : "outline"}
                          className="text-[0.625rem]"
                        >
                          {p.secretAccess}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[0.6875rem]">
                        {p.notes}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
