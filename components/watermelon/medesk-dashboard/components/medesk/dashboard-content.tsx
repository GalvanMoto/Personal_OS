"use client"

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { captureAction } from "@/lib/actions/inbox";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import {
  CheckCircle2Icon,
  CircleIcon,
  CircleDashedIcon,
  CircleCheckBigIcon,
  FileDownIcon,
  MessageCircleIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TimerIcon,
  XIcon,
  SparklesIcon,
  ExternalLinkIcon,
  FolderIcon,
  CopyIcon,
  CheckIcon,
  FileTextIcon,
  LayersIcon,
  ListTodoIcon,
  BotIcon,
  SendIcon,
  FlameIcon,
  TrendingUpIcon,
  StarIcon,
  ZapIcon,
  TargetIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRightIcon,
  CalendarDotsIcon,
  CaretDownIcon,
  ClockIcon,
  FileArrowUpIcon,
} from "./icons";
import { useDashboardNavigation } from "./navigation";
import { UniversalInboxView } from "../views/universal-inbox-view";
import { ProjectsBoardView } from "../views/projects-board-view";
import { ClientsHubView } from "../views/clients-hub-view";
import { CloudAssetsView } from "../views/cloud-assets-view";
import { FinancialRadarView } from "../views/financial-radar-view";
import { CopilotBriefingView } from "../views/copilot-briefing-view";
import { WorkspaceSettingsView } from "../views/workspace-settings-view";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  dashboardAppointmentStatusFilters,
  dashboardTimelineData,
  dashboardTimelineRanges,
  filterDashboardAppointments,
  staffDetails,
} from "../../data";
import type {
  DashboardAppointment,
  DashboardAppointmentStatus,
  DashboardAppointmentStatusFilter,
  DashboardTimelineRange,
} from "../../data";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

const dashboardColors = {
  scheduled: "var(--dashboard-scheduled)",
  completed: "var(--dashboard-completed)",
  noShow: "var(--dashboard-no-show)",
  secondary: "var(--dashboard-secondary)",
  destructive: "var(--destructive)",
} as const;

const chartSeries = [
  { key: "scheduled", label: "Ingested", color: dashboardColors.scheduled },
  { key: "completed", label: "Completed", color: dashboardColors.completed },
  { key: "noShow", label: "Waiting / Blocked", color: dashboardColors.noShow },
] as const;

const statusClassName: Record<DashboardAppointmentStatus, string> = {
  "In progress":
    "bg-[color-mix(in_oklch,var(--dashboard-scheduled)_14%,transparent)] text-[var(--dashboard-scheduled)] border border-[var(--dashboard-scheduled)]/20",
  Waiting:
    "bg-[color-mix(in_oklch,var(--dashboard-no-show)_14%,transparent)] text-[var(--dashboard-no-show)] border border-[var(--dashboard-no-show)]/20",
  Confirmed:
    "bg-[color-mix(in_oklch,var(--dashboard-completed)_14%,transparent)] text-[var(--dashboard-completed)] border border-[var(--dashboard-completed)]/20",
  Done: "bg-[color-mix(in_oklch,var(--dashboard-completed)_14%,transparent)] text-[var(--dashboard-completed)] border border-[var(--dashboard-completed)]/20",
};

const filterStatusIcons: Record<
  DashboardAppointmentStatusFilter,
  ComponentType<{ className?: string }>
> = {
  all: SlidersHorizontalIcon,
  "In progress": TimerIcon,
  Waiting: CircleDashedIcon,
  Confirmed: CheckCircle2Icon,
  Done: CircleCheckBigIcon,
};

function DashboardCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl bg-card border border-border/50 p-5 text-card-foreground shadow-xs transition-all hover:border-border",
        className,
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h2 className="text-lg leading-6 font-semibold tracking-tight text-foreground">{title}</h2>
      {action ? (
        <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-foreground/80">
          {action}
        </div>
      ) : null}
    </div>
  );
}

function MetricBars({
  lastSixDays,
  className,
}: {
  lastSixDays: readonly number[];
  className: string;
}) {
  const max = Math.max(...lastSixDays);

  return (
    <div className="flex h-11 items-end gap-1">
      {lastSixDays.map((value, index) => {
        const height = max === 0 ? 0 : (value / max) * 100;
        const clampedHeight = Math.max(12, Math.round(height));

        return (
          <span
            key={index}
            className={cn(
              "w-2 rounded-t-md opacity-85 transition-transform hover:scale-y-110",
              className,
              index === 2 && "opacity-100 ring-2 ring-foreground/20",
            )}
            style={{ height: `${clampedHeight}%` }}
          />
        );
      })}
    </div>
  );
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: readonly {
    value?: number | string;
    name?: string;
    fill?: string;
    stroke?: string;
    [key: string]: any;
  }[];
  label?: string;
};

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md">
      {label ? <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p> : null}
      <div className="flex flex-col gap-1.5">
        {payload.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-4 text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.fill || item.stroke }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-mono font-bold text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type DashboardTimelineData =
  (typeof dashboardTimelineData)[keyof typeof dashboardTimelineData];

type AppointmentVolumeDatum = {
  week: string;
  scheduled: number;
  completed: number;
  noShow: number;
};

function AppointmentVolumeCard({ data }: { data: DashboardTimelineData }) {
  const appointmentVolume = [
    ...data.appointmentVolume,
  ] as AppointmentVolumeDatum[];

  return (
    <DashboardCard className="flex flex-col gap-4 pb-2">
      <CardHeader
        title="Task & Ingestion Volume"
        action={
          <a
            href="/analytics"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span>Full Analytics</span>
            <ArrowUpRightIcon className="size-3.5" />
          </a>
        }
      />

      <div className="grid flex-1 gap-6 md:grid-cols-[6.5rem_minmax(0,1fr)]">
        <div className="grid grid-cols-3 gap-4 md:flex md:flex-col md:justify-center md:gap-6">
          {data.appointmentStats.map(([value, label]) => (
            <div key={label} className="flex min-w-0 flex-col gap-1">
              <p className="text-[1.75rem] leading-none font-bold tracking-tight text-foreground font-mono">
                {value}
              </p>
              <p className="text-xs leading-tight text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="min-h-0 min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-end gap-4">
            {chartSeries.map((series) => (
              <div
                key={series.key}
                className="flex items-center gap-1.5 text-xs font-medium text-foreground/80"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </div>
            ))}
          </div>
          <div className="h-68 min-w-md md:min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={appointmentVolume}
                barGap={6}
                barCategoryGap="24%"
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.65}
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 250]}
                  ticks={[0, 50, 100, 150, 200, 250]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  width={42}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                  content={(props) => <ChartTooltip {...(props as unknown as ChartTooltipProps)} />}
                />
                <Bar
                  dataKey="scheduled"
                  name="Ingested"
                  fill={dashboardColors.scheduled}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill={dashboardColors.completed}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="noShow"
                  name="Waiting / Blocked"
                  fill={dashboardColors.noShow}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function DepartmentLoadCard({ data }: { data: DashboardTimelineData }) {
  const departmentTotal = data.departmentLoad.reduce(
    (total, department) => total + department.value,
    0,
  );

  return (
    <DashboardCard className="flex flex-col gap-4">
      <CardHeader
        title="Client & Project Workload"
        action={
          <a
            href="/departments"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span>Breakdown</span>
            <ArrowUpRightIcon className="size-3.5" />
          </a>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Total Active Deliverables</span>
            <span className="font-mono font-bold text-foreground">
              {departmentTotal}
            </span>
          </div>
          <div className="flex h-4 items-start gap-1 overflow-hidden rounded-md bg-muted/30 p-0.5">
            {data.departmentLoad.map((department, index) => (
              <span
                key={department.label}
                className={cn(
                  "dashboard-load-segment h-full min-w-3 shrink-0 rounded-xs",
                  department.color,
                )}
                style={
                  {
                    "--department-width": `${(department.value / departmentTotal) * 100}%`,
                    animationDelay: `${index * 90}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {data.departmentLoad.map((department) => (
            <div
              key={department.label}
              className="flex min-w-0 items-center gap-3 text-sm"
            >
              <div className="flex min-w-0 shrink-0 items-center gap-2.5">
                <span className={cn("size-3 rounded-xs shrink-0", department.color)} />
                <span className="truncate text-xs font-medium text-foreground/90">
                  {department.label}
                </span>
              </div>
              <span className="min-w-0 flex-1 border-t border-dashed border-border/80" />
              <div className="flex shrink-0 items-center gap-2 font-mono text-xs">
                <span className="w-6 text-right font-semibold text-foreground">
                  {department.value}
                </span>
                <span className="w-12 text-right text-muted-foreground">
                  {department.percent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

function AppointmentsTableCard({
  appointments,
  statusFilter,
  onStatusFilterChange,
  onSelectTask,
  onOpenIngest,
}: {
  appointments: readonly DashboardAppointment[];
  statusFilter: DashboardAppointmentStatusFilter;
  onStatusFilterChange: (statusFilter: DashboardAppointmentStatusFilter) => void;
  onSelectTask: (task: DashboardAppointment) => void;
  onOpenIngest: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAppointments = appointments.filter((apt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      apt.patient.toLowerCase().includes(q) ||
      apt.type.toLowerCase().includes(q) ||
      apt.doctor.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardCard className="flex flex-col gap-4 px-0 pb-0 overflow-hidden">
      <div className="px-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Today&apos;s Deliverables &amp; Ingest Pipeline
            </h2>
            <p className="text-xs text-muted-foreground">
              Click any row to open the full <span className="font-semibold text-primary">Context Pack</span> (Drive assets, briefs, checklists)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenIngest}
              className="h-8 gap-1.5 rounded-lg text-xs"
            >
              <FileDownIcon className="size-3.5" />
              Ingest Brief
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={buttonVariants({
                  variant: "outline",
                  className: "h-8 gap-1.5 rounded-lg text-xs px-2.5",
                })}
              >
                <SlidersHorizontalIcon className="size-3.5" />
                Filter
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(value) =>
                    onStatusFilterChange(
                      value as DashboardAppointmentStatusFilter,
                    )
                  }
                >
                  {dashboardAppointmentStatusFilters.map((filter) => (
                    <DropdownMenuRadioItem
                      key={filter.value}
                      value={filter.value}
                      className={cn(
                        "text-muted-foreground [&_svg]:text-muted-foreground text-xs",
                        statusFilter === filter.value &&
                          "font-medium text-foreground [&_svg]:text-foreground",
                      )}
                    >
                      {(() => {
                        const FilterIcon = filterStatusIcons[filter.value];
                        return <FilterIcon className="size-3.5" />;
                      })()}
                      {filter.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deliverables, clients, or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 rounded-lg bg-muted/40 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary border border-border/40"
          />
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-160 table-fixed text-left">
          <thead>
            <tr className="h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-t border-b border-border/40 bg-muted/20">
              <th className="w-[12%] px-5">Time</th>
              <th className="w-[32%] px-4">Deliverable / Task</th>
              <th className="w-[20%] px-4">Project</th>
              <th className="w-[18%] px-4">Client / Source</th>
              <th className="w-[18%] px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((appointment) => (
              <tr
                key={`${appointment.time}-${appointment.patient}`}
                onClick={() => onSelectTask(appointment)}
                className="h-14 border-b border-border/40 transition-colors hover:bg-muted/40 cursor-pointer group"
              >
                <td className="px-5 text-xs font-mono text-muted-foreground group-hover:text-foreground">
                  {appointment.time}
                </td>
                <td className="px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {appointment.patient}
                    </span>
                    <SparklesIcon className="size-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </td>
                <td className="truncate px-4 text-xs text-muted-foreground font-mono">
                  {appointment.type}
                </td>
                <td className="px-4 text-xs text-foreground/80 font-medium">
                  {appointment.doctor}
                </td>
                <td className="px-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-4",
                      statusClassName[appointment.status],
                    )}
                  >
                    {appointment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}

type DashboardStaff = DashboardTimelineData["staffPerformance"][number];

function StaffDetailsSheet({
  staff,
  open,
  onOpenChange,
}: {
  staff: DashboardStaff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const details = staff
    ? staffDetails[staff.name as keyof typeof staffDetails]
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full! max-w-full! overflow-hidden bg-transparent sm:p-3 shadow-none sm:w-130! sm:max-w-130! border-none"
      >
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background sm:rounded-2xl border border-border/60 shadow-2xl">
          <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border/40">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-primary" />
              <SheetTitle className="text-base font-semibold">Operator &amp; Agent Profile</SheetTitle>
            </div>
            <SheetClose render={<Button type="button" variant="ghost" size="icon" aria-label="Close details" className="size-8" />}><XIcon className="size-4" /></SheetClose>
          </header>

          {staff && details ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 no-scrollbar">
              <SheetDescription className="sr-only">
                Specs for {staff.name}
              </SheetDescription>

              <div className="flex flex-col gap-6">
                <section className="flex items-center gap-4">
                  <Avatar className="size-18 rounded-2xl ring-2 ring-primary/20">
                    <AvatarImage
                      src={staff.avatar}
                      alt={staff.name}
                      className="rounded-2xl"
                    />
                    <AvatarFallback>{staff.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>

                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="truncate text-xl font-bold text-foreground">
                      {staff.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {details.specialty}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-500">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{details.status}</span>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Telemetry</h4>
                  <div className="grid gap-2.5 grid-cols-3">
                    {details.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="flex flex-col justify-between rounded-xl bg-card border border-border/50 p-3"
                      >
                        <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                        <p className="text-lg font-bold font-mono text-foreground mt-1">{metric.value}</p>
                        <p className="text-[10px] text-emerald-500 font-mono mt-0.5">{metric.trend}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent &amp; Operator Specs</h4>
                  <div className="grid gap-2 grid-cols-2">
                    {details.information.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex flex-col gap-0.5 rounded-lg bg-muted/40 border border-border/40 p-2.5"
                      >
                        <span className="text-[10px] uppercase font-mono text-muted-foreground">
                          {label}
                        </span>
                        <span className="text-xs font-medium text-foreground truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          <footer className="p-4 border-t border-border/40 bg-muted/10 flex items-center gap-2">
            <Button className="h-10 flex-1 gap-1.5 rounded-xl">
              <BotIcon className="size-4" />
              Launch Copilot Session
            </Button>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TaskContextSheet({
  task,
  open,
  onOpenChange,
  workspace,
}: {
  task: DashboardAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: string;
}) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Verify linked Google Drive assets & resolution", done: true },
    { id: 2, text: "Check client audio cues and brand vector logo", done: true },
    { id: 3, text: "Assemble rough cut and color grading", done: false },
    { id: 4, text: "Export 1080x1920 MP4 & trigger approval webhook", done: false },
  ]);

  const toggleCheck = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
  };

  const copyContextPack = () => {
    if (!task) return;
    const text = `DLRS CONTEXT PACK:\nTask: ${task.patient}\nProject: ${task.type}\nClient: ${task.doctor}\nStatus: ${task.status}\nDrive: drive.google.com/drive/folders/dlrs-${task.type.toLowerCase().replace(/\s+/g, "-")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full! max-w-full! overflow-hidden bg-transparent sm:p-3 shadow-none sm:w-140! sm:max-w-140! border-none"
      >
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background sm:rounded-2xl border border-border/60 shadow-2xl">
          <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border/40 bg-card/50">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              <SheetTitle className="text-base font-semibold">
                Task Context Pack
              </SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyContextPack}
                className="h-8 gap-1.5 text-xs rounded-lg"
              >
                {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                {copied ? "Copied" : "Copy Pack"}
              </Button>
              <SheetClose render={<Button type="button" variant="ghost" size="icon" aria-label="Close" className="size-8" />}><XIcon className="size-4" /></SheetClose>
            </div>
          </header>

          {task ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 no-scrollbar">
              <SheetDescription className="sr-only">
                Context pack for {task.patient}
              </SheetDescription>

              <div className="flex flex-col gap-6">
                {/* Title and Badges */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", statusClassName[task.status])}>
                      {task.status}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Time: {task.time}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {task.patient}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Client: <span className="font-semibold text-foreground">{task.doctor}</span> • Project: <span className="font-semibold text-primary">{task.type}</span>
                  </p>
                </div>

                {/* Objective & Extracted Scope */}
                <div className="rounded-xl bg-card border border-border/60 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <TargetIcon className="size-3.5 text-primary" />
                    <span>AI-Extracted Scope &amp; Constraints</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/90">
                    Create 9:16 vertical high-retention reel. 3-second hook with motion title, 2-second dynamic scene transitions, ambient restaurant/event audio track with background score.
                  </p>
                </div>

                {/* Connected Asset Vault */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FolderIcon className="size-3.5 text-primary" />
                    <span>Connected Asset Vault (Google Drive &amp; Local)</span>
                  </h4>
                  <div className="grid gap-2">
                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <FolderIcon className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                            Drive / 2026 / {task.type} / Raw Footage
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            14 files • 3.8 GB 4K 60fps clips
                          </span>
                        </div>
                      </div>
                      <ExternalLinkIcon className="size-3.5 text-muted-foreground group-hover:text-primary" />
                    </a>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                          <FileTextIcon className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">
                            {task.doctor.replace(/\s+/g, "_")}_Brand_Vector_Logo.svg
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Vector Alpha • Primary Brand Asset
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Execution Checklist */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ListTodoIcon className="size-3.5 text-primary" />
                    <span>Deliverable Execution Checklist</span>
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {checklist.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-card hover:bg-muted/40 transition-colors text-left"
                      >
                        <span
                          className={cn(
                            "size-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                            item.done
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border",
                          )}
                        >
                          {item.done && <CheckIcon className="size-3" />}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            item.done ? "line-through text-muted-foreground" : "text-foreground",
                          )}
                        >
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <footer className="p-4 border-t border-border/40 bg-card/40 flex items-center gap-3">
            <Button
              className="h-11 flex-1 gap-2 rounded-xl shadow-md"
              disabled={launching}
              onClick={async () => {
                if (!task) return;
                setLaunching(true);
                try {
                  if (workspace) {
                    // Mark as in-progress via real inbox capture so it appears in Tasks
                    const fd = new FormData();
                    fd.set("text", `Start focused work: ${task.patient} — ${task.type} for ${task.doctor}`);
                    await captureAction(workspace, fd);
                    router.push(`/w/${workspace}/tasks`);
                  }
                } finally {
                  setLaunching(false);
                  onOpenChange(false);
                }
              }}
            >
              <ZapIcon className="size-4 text-amber-300" />
              <span>{launching ? "Launching..." : "Launch Focused Execution Workspace"}</span>
            </Button>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UniversalIngestDialog({
  open,
  onOpenChange,
  onIngestTask,
  workspace,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIngestTask: (task: DashboardAppointment) => void;
  workspace?: string;
}) {
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const presets = [
    {
      label: "GB Banquet Reel",
      text: "Bro please make a 9:16 reel for GB Banquet showing food catering and decor. Need by 4 PM today. Footage in Drive.",
      type: "GB Banquet Reels",
      patient: "Buffet & Decor Showcase Reel (9:16)",
      doctor: "GB Banquet Client",
    },
    {
      label: "Tanniaqua SEO Deck",
      text: "Sarah from Tanniaqua Zone wants the Q3 organic search audit deck finalized by 3 PM.",
      type: "Tanniaqua Zone",
      patient: "Q3 Organic Search Deck & KPI Report",
      doctor: "Sarah M.",
    },
    {
      label: "Happy Rewards Storyboard",
      text: "Loyalty Inc asked for the motion storyboard for the new loyalty badge animations.",
      type: "Happy Rewards",
      patient: "Loyalty Badge Motion Storyboard",
      doctor: "Loyalty Inc.",
    },
  ];

  const handleIngest = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    try {
      if (workspace) {
        const fd = new FormData();
        fd.set("text", rawText);
        const res = await captureAction(workspace, fd);
        if (res.ok) {
          router.refresh();
        }
      }
      // keep optimistic UI for demo shell
      onIngestTask({
        time: "15:00",
        patient: rawText.length > 35 ? `${rawText.slice(0, 35)}...` : rawText,
        type: "Direct Ingest",
        doctor: "Universal Inbox",
        status: "In progress",
      });
      setRawText("");
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreset = async (preset: (typeof presets)[number]) => {
    setIsProcessing(true);
    try {
      if (workspace) {
        const fd = new FormData();
        fd.set("text", preset.text);
        await captureAction(workspace, fd);
        router.refresh();
      }
      onIngestTask({
        time: "16:00",
        patient: preset.patient,
        type: preset.type,
        doctor: preset.doctor,
        status: "In progress",
      });
      setRawText("");
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-border/60 shadow-2xl p-6">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2 text-primary">
            <SparklesIcon className="size-4" />
            <DialogTitle className="text-lg font-bold">Universal Ingest Engine</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste any client brief, voice note transcript, or forwarded email. DLRS extracts entities, links Drive folders, and schedules it immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Quick Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Quick Test Briefs</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/50 transition-colors"
                >
                  ⚡ {p.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g., 'Client says make 3 reels for GB Banquet by Friday. Use new logo from Drive.'"
            className="w-full rounded-xl bg-muted/40 p-3 text-xs text-foreground placeholder:text-muted-foreground border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary font-sans leading-relaxed"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 rounded-xl text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleIngest}
            disabled={!rawText.trim() || isProcessing}
            className="h-9 gap-1.5 rounded-xl text-xs bg-linear-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/20"
          >
            {isProcessing ? (
              <>
                <span className="size-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Extracting Entities...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="size-3.5" />
                <span>Extract &amp; Add Deliverable</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CopilotDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Good morning Gautam! I have indexed 52 active deliverables across GB Banquet, Tanniaqua Zone, and Happy Rewards. What would you like to tackle first?",
    },
  ]);
  const [input, setInput] = useState("");

  const sendQuery = (text: string) => {
    if (!text.trim()) return;
    const userMsg = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      let botReply = "I have cross-checked your schedule, Google Drive, and active client briefs. Let me know if you need to generate a context pack!";
      if (text.toLowerCase().includes("gb") || text.toLowerCase().includes("reel")) {
        botReply = "🎬 GB Banquet has 3 reels due this weekend. The Event Highlights Reel (9:16) is ready in your workspace with 14 raw 4K clips linked in Drive.";
      } else if (text.toLowerCase().includes("due") || text.toLowerCase().includes("today")) {
        botReply = "🔴 3 High Priority items due today: 1) GB Banquet Reel (10:30 AM), 2) Tanniaqua SEO Deck (11:00 AM), 3) Happy Rewards Motion (11:30 AM).";
      } else if (text.toLowerCase().includes("sub") || text.toLowerCase().includes("bill") || text.toLowerCase().includes("spend")) {
        botReply = "💳 Subscription Radar: Adobe Creative Cloud ($54.99) renews in 3 days. Total software spend this month is ₹18,420 (within 88% budget).";
      }
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    }, 500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full! max-w-full! overflow-hidden bg-transparent sm:p-3 shadow-none sm:w-120! sm:max-w-120! border-none"
      >
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background sm:rounded-2xl border border-border/60 shadow-2xl">
          <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border/40 bg-card/50">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-tr from-indigo-600 to-cyan-400 text-white shadow-xs">
                <BotIcon className="size-4" />
              </div>
              <SheetTitle className="text-base font-semibold">DLRS AI Copilot</SheetTitle>
            </div>
            <SheetClose render={<Button type="button" variant="ghost" size="icon" className="size-8" />}><XIcon className="size-4" /></SheetClose>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col gap-1 max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed",
                  m.sender === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-xs"
                    : "mr-auto bg-muted/60 text-foreground border border-border/40 rounded-bl-xs",
                )}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border/40 bg-card/30 flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => sendQuery("What is due today?")}
                className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                🔴 What is due today?
              </button>
              <button
                type="button"
                onClick={() => sendQuery("Show GB Banquet assets")}
                className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                🎬 GB Banquet assets
              </button>
              <button
                type="button"
                onClick={() => sendQuery("Upcoming subscriptions")}
                className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                💳 Subscriptions
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuery(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask DLRS Copilot anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 h-9 rounded-xl bg-muted/40 px-3 text-xs text-foreground placeholder:text-muted-foreground border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="icon" className="size-9 rounded-xl shrink-0">
                <SendIcon className="size-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StaffPerformanceCard({
  data,
  onStaffSelect,
}: {
  data: DashboardTimelineData;
  onStaffSelect: (staff: DashboardStaff) => void;
}) {
  return (
    <DashboardCard className="flex flex-col gap-4 px-0 pb-0">
      <CardHeader
        className="px-5"
        title="Operator & Agent Performance"
        action={
          <a
            href="/staff"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>View all</span>
            <ArrowUpRightIcon className="size-3.5" />
          </a>
        }
      />

      <div className="flex flex-col">
        {data.staffPerformance.map((staff, index) => (
          <button
            type="button"
            key={staff.name}
            onClick={() => onStaffSelect(staff)}
            className={cn(
              "flex items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/40 cursor-pointer",
              index > 0 && "border-t border-border/40",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={staff.avatar}
                alt=""
                className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-border"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {staff.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {staff.role}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs font-mono">
              <StatValue value={staff.points} label="tasks today" />
              <StatValue value={staff.rating} label="rating" />
            </div>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}

function StatValue({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function ResourceUsageCard({ data }: { data: DashboardTimelineData }) {
  return (
    <DashboardCard className="flex flex-col gap-5">
      <CardHeader
        title="Connected Storage & AI Budget"
        action={
          <a
            href="/resources"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>All Connectors</span>
            <ArrowUpRightIcon className="size-3.5" />
          </a>
        }
      />

      <div className="flex flex-col gap-4">
        {data.resources.map((resource, index) => (
          <ResourceRow
            key={resource.label}
            {...resource}
            withDivider={index > 0}
          />
        ))}
      </div>
    </DashboardCard>
  );
}

function ResourceRow({
  label,
  value,
  unit,
  Icon,
  color,
  withDivider,
}: {
  label: string;
  value: number;
  unit: string;
  Icon: ComponentType<{ className?: string }>;
  color: string;
  withDivider: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3.5 items-center",
        withDivider && "border-t border-border/40 pt-4",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="truncate font-medium text-foreground">{label}</span>
          <span className="shrink-0 text-muted-foreground font-mono text-[11px]">
            <span className="font-bold text-foreground">{value}% </span>
            {unit}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/60">
          <span
            className={cn(
              "dashboard-resource-progress block h-full rounded-full",
              color,
            )}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage({ userName, workspace }: { userName?: string; workspace?: string } = {}) {
  const { pathname, navigate } = useDashboardNavigation();
  const [selectedRange, setSelectedRange] =
    useState<DashboardTimelineRange>("aug-2026");
  const [appointmentStatusFilter, setAppointmentStatusFilter] =
    useState<DashboardAppointmentStatusFilter>("all");
  const [selectedStaff, setSelectedStaff] = useState<DashboardStaff | null>(null);
  const [selectedTask, setSelectedTask] = useState<DashboardAppointment | null>(null);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const selectedData = dashboardTimelineData[selectedRange];
  const [customAppointments, setCustomAppointments] = useState<DashboardAppointment[]>([]);

  const allAppointments = [...customAppointments, ...selectedData.appointments];
  const visibleAppointments = filterDashboardAppointments(
    allAppointments,
    appointmentStatusFilter,
  );

  const selectedRangeMeta = dashboardTimelineRanges.find(
    (range) => range.value === selectedRange,
  );

  const handleIngestTask = (newTask: DashboardAppointment) => {
    setCustomAppointments((prev) => [newTask, ...prev]);
  };

  const navTabs = [
    { id: "/", label: "📊 Command Center & Charts" },
    { id: "/appointment", label: "⚡ Universal Inbox" },
    { id: "/staff", label: "💼 Active Projects" },
    { id: "/departments", label: "🏢 Clients & Brands" },
    { id: "/resources", label: "📁 Cloud Assets" },
    { id: "/analytics", label: "💳 Financial Radar" },
    { id: "/ai-assistant", label: "🤖 AI Copilot" },
    { id: "/settings", label: "⚙️ Settings" },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header Matching Screenshot */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-1 border-b border-border/20">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Good Morning {userName || "Gautam"}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <CalendarDotsIcon className="size-3.5" />
            <span>Monday, Aug 26, 2026</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCopilotOpen(true)}
            className="h-9.5 gap-1.5 rounded-xl text-xs font-medium border-border/60 hover:bg-muted"
          >
            <FileArrowUpIcon className="size-3.5" />
            <span>Export</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={buttonVariants({
                variant: "outline",
                className: "h-9.5 rounded-xl px-3 text-xs gap-1.5 border-border/60",
              })}
            >
              <CalendarDotsIcon className="size-3.5 text-muted-foreground" />
              <span>{selectedRangeMeta?.label}</span>
              <CaretDownIcon className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuRadioGroup
                value={selectedRange}
                onValueChange={(value) =>
                  setSelectedRange(value as DashboardTimelineRange)
                }
              >
                {dashboardTimelineRanges.map((range) => (
                  <DropdownMenuRadioItem
                    key={range.value}
                    value={range.value}
                    className={cn(
                      "text-muted-foreground text-xs",
                      selectedRange === range.value &&
                        "font-medium text-foreground",
                    )}
                  >
                    {range.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            onClick={() => setIsIngestOpen(true)}
            className="h-9.5 gap-1.5 rounded-xl px-4 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:opacity-95 transition-all"
          >
            <PlusIcon className="size-4" />
            <span>+ Add New</span>
          </Button>
        </div>
      </section>

      {/* 4 KPI Metric Cards */}
      <section className="@container">
        <div className="grid grid-cols-1 gap-3.5 @min-[36rem]:grid-cols-2 @min-[72rem]:grid-cols-4">
          {selectedData.metrics.map((metric, index) => {
            const icons = [ClockIcon, ClockIcon, ClockIcon, ClockIcon];
            const Icon = icons[index % icons.length];
            return (
              <article
                key={metric.label}
                className="flex h-34 min-w-0 flex-col justify-between rounded-2xl bg-card border border-border/50 p-4.5 text-card-foreground shadow-xs hover:border-border transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xs font-medium text-muted-foreground">
                    {metric.label}
                  </h2>
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                </div>

                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[1.85rem] leading-none font-bold font-mono tracking-tight text-foreground">
                      {metric.value}
                      {metric.suffix ? (
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          {metric.suffix}
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                      <ArrowUpRightIcon
                        className={cn("size-3.5", metric.trendColor)}
                      />
                      <span className="font-semibold text-foreground">
                        {metric.trend.split(" ")[0]}
                      </span>
                      <span>
                        {metric.trend.substring(metric.trend.indexOf(" ") + 1)}
                      </span>
                    </div>
                  </div>
                  <MetricBars
                    lastSixDays={metric.lastSixDays}
                    className={metric.color}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]">
        <div className="min-w-0 overflow-x-auto no-scrollbar">
          <AppointmentVolumeCard key={selectedRange} data={selectedData} />
        </div>
        <DepartmentLoadCard key={selectedRange} data={selectedData} />
      </section>

      {/* Active Deliverables Table & Operator Sidebar */}
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]">
        <AppointmentsTableCard
          appointments={visibleAppointments}
          statusFilter={appointmentStatusFilter}
          onStatusFilterChange={setAppointmentStatusFilter}
          onSelectTask={setSelectedTask}
          onOpenIngest={() => setIsIngestOpen(true)}
        />
        <div className="grid min-w-0 gap-4 self-start">
          <StaffPerformanceCard
            data={selectedData}
            onStaffSelect={setSelectedStaff}
          />
          <ResourceUsageCard key={selectedRange} data={selectedData} />
        </div>
      </section>

      {/* Interactive Sheets & Modals */}
      <StaffDetailsSheet
        staff={selectedStaff}
        open={selectedStaff !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStaff(null);
          }
        }}
      />

      <TaskContextSheet
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
          }
        }}
        workspace={workspace}
      />

      <UniversalIngestDialog
        open={isIngestOpen}
        onOpenChange={setIsIngestOpen}
        onIngestTask={handleIngestTask}
        workspace={workspace}
      />

      <CopilotDrawer
        open={isCopilotOpen}
        onOpenChange={setIsCopilotOpen}
      />
    </div>
  );
}
