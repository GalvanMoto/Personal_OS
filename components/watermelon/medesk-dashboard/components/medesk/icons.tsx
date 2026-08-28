import type { SVGProps } from "react";
import {
  IconHome,
  IconInbox,
  IconCircleCheck,
  IconFolder,
  IconUsersGroup,
  IconStack2,
  IconCalendar,
  IconFiles,
  IconFileText,
  IconNote,
  IconMail,
  IconChartBar,
  IconArrowsExchange,
  IconReceipt,
  IconSparkles,
  IconBrain,
  IconRobot,
  IconActivityHeartbeat,
  IconSettingsAutomation,
  IconSettings,
  IconBell,
  IconPlugConnected,
  IconLayoutDashboard,
  IconClock,
  IconAlertTriangle,
  IconFile,
  IconShieldCheck,
  IconPlayerPlay,
  IconSearch,
  IconCommand,
  IconChevronDown,
  IconX,
  IconLayoutSidebarLeftCollapse,
  IconPlayerPause,
  IconArrowUpRight,
  IconShieldCheck as IconSeal,
  IconRefresh,
  IconFilter,
  IconLoader,
  IconUpload,
  IconLayoutSidebarRightCollapse,
  IconTrendingUp,
  IconLoader2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement>;

// Helper to wrap Tabler icons with consistent size
function wrap(Comp: React.ComponentType<{ className?: string; size?: number | string }>) {
  return function WrappedIcon({ className, ...props }: IconProps) {
    return <Comp className={cn("size-5", className)} size={20} {...(props as any)} />;
  };
}

function smallWrap(Comp: React.ComponentType<{ className?: string; size?: number | string }>) {
  return function WrappedIcon({ className, ...props }: IconProps) {
    return <Comp className={cn("size-4", className)} size={16} {...(props as any)} />;
  };
}

// --- Sidebar navigation icons — unique Tabler icons per item ---
export const HomeIcon = wrap(IconLayoutDashboard);
export const CheckCircleIcon = wrap(IconCircleCheck);
export const FolderIcon = wrap(IconFolder);
export const UsersIcon = wrap(IconUsersGroup);
export const StackIcon = wrap(IconStack2);
export const CalendarDotsIcon = wrap(IconCalendar);
export const FileIcon = wrap(IconFileText);
export const LinkIcon = wrap(IconMail);
export const ChartBarIcon = wrap(IconChartBar);
export const SealCheckIcon = wrap(IconReceipt);
export const SparkleIcon = wrap(IconSparkles);
export const TimelineCheckIcon = wrap(IconActivityHeartbeat);
export const GearIcon = wrap(IconSettings);
export const BellIcon = wrap(IconBell);
export const PlugsConnectedIcon = wrap(IconPlugConnected);

// Aliases for distinct finance/docs items
export const CalendarCheckIcon = wrap(IconCalendar);
export const IdentificationBadgeIcon = wrap(IconUsersGroup);
export const HospitalIcon = wrap(IconUsersGroup);
export const ChartBarIconAlt = wrap(IconArrowsExchange);
export const FileArrowUpIcon = wrap(IconInbox);

// Additional distinct icons for former duplicates
export const FilesIcon = wrap(IconFiles);
export const NoteIcon = wrap(IconNote);
export const TransactionsIcon = wrap(IconArrowsExchange);
export const SubscriptionsIcon = wrap(IconRefresh);
export const InvoicesIcon = wrap(IconReceipt);
export const AssistantIcon = wrap(IconSparkles);
export const MemoryIcon = wrap(IconBrain);
export const AgentsIcon = wrap(IconRobot);
export const ActivityIcon = wrap(IconActivityHeartbeat);
export const AutomationsIcon = wrap(IconSettingsAutomation);
export const NotificationsIcon = wrap(IconBell);
export const IntegrationsIcon = wrap(IconPlugConnected);
export const SettingsIcon = wrap(IconSettings);

// --- General icons kept for compatibility ---
export const ClockIcon = wrap(IconClock);
export const WarningIcon = wrap(IconAlertTriangle);
export const ShieldCheckIcon = wrap(IconShieldCheck);
export const PlayCircleIcon = wrap(IconPlayerPlay);
export const FolderIconLegacy = wrap(IconFolder);
export const SearchIcon = smallWrap(IconSearch);
export const CommandIcon = smallWrap(IconCommand);
export const CaretDownIcon = smallWrap(IconChevronDown);
export const CloseIcon = smallWrap(IconX);
export const SidebarCollapseIcon = smallWrap(IconLayoutSidebarLeftCollapse);
export const PlayIcon = smallWrap(IconPlayerPlay);
export const PauseIcon = smallWrap(IconPlayerPause);
export const ArrowUpRightIcon = smallWrap(IconArrowUpRight);
export const ArrowsCounterClockwiseIcon = wrap(IconRefresh);
export const SpinnerGapIcon = smallWrap(IconLoader);
export const SpinnerIcon = smallWrap(IconLoader2);
export const TrendUpIcon = wrap(IconTrendingUp);
export const FadersHorizontalIcon = smallWrap(IconFilter);
export const FileArrowUpIconSmall = smallWrap(IconUpload);
export const CheckCircleIconSmall = smallWrap(IconCircleCheck);
export const StatusWarningIcon = smallWrap(IconAlertTriangle);
export const CalendarCheckIconSmall = smallWrap(IconCalendar);
export const FileIconSmall = smallWrap(IconFile);
export const TimelineCheckIconSmall = smallWrap(IconActivityHeartbeat);
