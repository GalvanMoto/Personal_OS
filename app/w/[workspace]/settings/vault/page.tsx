import { requireWorkspace } from "@/lib/auth/dal"
import { listVaultMeta, getVaultMap, buildPasswordCandidates } from "@/lib/domain/vault"
import { saveVaultSecretAction, deleteVaultSecretAction } from "@/lib/actions/vault"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, ShieldCheck, KeyRound, EyeOff } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const metadata = { title: "Statement Vault · Personal OS" }

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
  const candidates = buildPasswordCandidates(vault, bank || "SBI")

  const hasPAN = meta.some((m) => m.kind === "PAN")
  const hasDOB = meta.some((m) => m.kind === "DOB")
  const hasPhone = meta.some((m) => m.kind === "PHONE")

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight flex items-center gap-2">
            <Lock className="size-5 text-primary" /> Statement Vault
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Store the details your banks use for statement passwords. Encrypted, workspace-isolated, and only used to open your own PDFs.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="size-3 text-emerald-500" /> Encrypted • Private to this workspace
        </Badge>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 text-xs leading-relaxed">
          <p className="font-medium flex items-center gap-1.5"><KeyRound className="size-3.5" /> How it works</p>
          <p className="text-muted-foreground mt-1">
            When a bank statement arrives by email (SBI/HDFC/ICICI/Chase), the agent detects it is password-protected, builds candidates like <code className="bg-muted px-1 rounded">NAME+DDMM</code>, <code className="bg-muted px-1 rounded">PAN+DDMM</code>, <code className="bg-muted px-1 rounded">phone</code> from your vault, and tries them in-memory. No password is ever logged.
          </p>
          <p className="text-muted-foreground">Agent: <code className="bg-muted px-1 rounded">fetch email → detect statement → try vault → categorize → analyze</code> — all automatic.</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your vault</CardTitle>
            <CardDescription className="text-xs">Values are stored encrypted and shown masked. Add at least PAN, DOB, and phone for best automation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {meta.length === 0 ? (
              <p className="text-xs text-muted-foreground">No details yet — add them on the right. Categorization will still work, but encrypted PDFs will wait for review.</p>
            ) : (
              <div className="space-y-1.5">
                {meta.map((m) => (
                  <div key={`${m.kind}:${m.label}`} className="flex items-center justify-between rounded border bg-muted/20 px-2.5 py-1.5 text-xs">
                    <span><Badge variant="outline" className="text-[0.625rem] mr-1.5">{m.kind}</Badge> {m.label} <span className="font-mono text-muted-foreground">{m.masked}</span></span>
                    <form action={deleteVaultSecretAction.bind(null, workspace, m.kind, m.label) as unknown as string}>
                      <button type="submit" className="text-[0.625rem] text-muted-foreground hover:text-destructive">Remove</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[0.625rem] text-muted-foreground pt-2">
              <EyeOff className="size-3" /> Never shown in plain text after save.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add to vault</CardTitle>
            <CardDescription className="text-xs">Use the exact values as on your bank records. DOB as DDMMYYYY.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveVaultSecretAction.bind(null, workspace) as unknown as string} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select name="kind" defaultValue="PAN" className="w-full rounded border bg-background px-2 py-1.5 text-xs">
                    <option value="PAN">PAN</option>
                    <option value="DOB">DOB (DDMMYYYY)</option>
                    <option value="PHONE">Phone</option>
                    <option value="NAME">Full Name (as on bank)</option>
                    <option value="CUSTOMER_ID">Customer ID</option>
                    <option value="BANK_TEMPLATE">Bank Template (advanced)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input name="label" placeholder="PAN, DOB, SBI ..." defaultValue="PAN" className="h-8 text-xs" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Value</Label>
                <Input name="value" placeholder="ABCDE1234F or 15081990 or 98XXXXXXXX" className="h-8 text-xs" required />
                <p className="text-[0.625rem] text-muted-foreground">For BANK_TEMPLATE, enter the exact password for that bank (e.g., HDFC: custID+DOB).</p>
              </div>
              <Button type="submit" size="sm" className="w-full h-8 text-xs">Save securely</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preview — what the agent will try</CardTitle>
          <CardDescription className="text-xs">Based on your current vault {bank ? `for ${bank}` : "(try SBI/HDFC/ICICI)"}. Up to 8 shown, 20 tried in order.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex items-center gap-2 mb-3 text-xs">
            <span className="text-muted-foreground">Bank:</span>
            <a href={`?bank=SBI`} className={`px-2 py-1 rounded border text-xs ${bank === "SBI" || !bank ? "bg-primary text-primary-foreground" : "bg-card"}`}>SBI</a>
            <a href={`?bank=HDFC`} className={`px-2 py-1 rounded border text-xs ${bank === "HDFC" ? "bg-primary text-primary-foreground" : "bg-card"}`}>HDFC</a>
            <a href={`?bank=ICICI`} className={`px-2 py-1 rounded border text-xs ${bank === "ICICI" ? "bg-primary text-primary-foreground" : "bg-card"}`}>ICICI</a>
            <a href={`?bank=CHASE`} className={`px-2 py-1 rounded border text-xs ${bank === "CHASE" ? "bg-primary text-primary-foreground" : "bg-card"}`}>Chase</a>
          </form>
          {!hasPAN && !hasDOB && !hasPhone ? (
            <p className="text-xs text-muted-foreground">Add PAN, DOB, or phone to see candidates. Agent will still fetch and categorize, but PDFs will need manual review.</p>
          ) : candidates.length === 0 ? (
            <p className="text-xs text-muted-foreground">No candidates yet — add more details.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {candidates.slice(0, 8).map((c) => (
                <Badge key={c} variant="secondary" className="font-mono text-[0.625rem]">{c.slice(0, 2)}****{c.slice(-2)}</Badge>
              ))}
            </div>
          )}
          <p className="text-[0.625rem] text-muted-foreground mt-2">Agent detects bank from email header, builds these in-memory, and analyzes transactions — no password is stored as the password itself, only your PII vault is encrypted.</p>
        </CardContent>
      </Card>
    </div>
  )
}
