"use client"

import {
  BookOpenIcon,
  ChevronRight,
  LogOutIcon,
  MessageCircleIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MedeskLogo } from "./logo";
import { SidebarCollapseIcon } from "./icons";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import * as React from "react";
import {
  buildNavigation,
  type AppNavigationItem,
} from "@/components/dashboard/navigation-config";
import { useShell } from "@/components/dashboard/shell-context";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const menuButtonClassName = cn(
  "h-12.5 gap-2.5 rounded-lg bg-transparent py-2.5 pl-3 pr-2 text-base font-normal text-muted-foreground transition-colors",
  "hover:!bg-transparent hover:text-foreground active:!bg-transparent",
  "aria-[current=page]:!bg-transparent aria-[current=page]:font-medium aria-[current=page]:text-foreground",
  "data-open:!bg-transparent data-open:hover:!bg-transparent data-open:text-foreground data-active:!bg-transparent",
  "[&_svg]:size-5! [&_svg]:shrink-0",
  "group-data-[collapsible=icon]:size-12.5! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden",
);

const sidebarGroupLabelClassName =
  "h-auto px-0 py-1 text-[1.0625rem] font-normal text-foreground/70 transition-colors";

const dropdownTriggerClassName =
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0";

/// The two routes below are real application pages; everything else in this
/// demo shell is cosmetic. They are wired to the actual Next.js router so they
/// navigate and highlight correctly, scoped to the current workspace.
/**
 * A single navigation entry.
 *
 * Every href now arrives fully qualified from `buildNavigation()`, so the
 * allowlist that used to decide which links were real and which were the
 * template's in-app demo is gone — they are all real routes.
 */
function NavItem({ item }: { item: AppNavigationItem }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const { badges } = useShell();

  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  const count = item.badgeKey ? badges[item.badgeKey] : undefined;

  return (
    <SidebarMenuButton
      tooltip={item.name}
      className={menuButtonClassName}
      render={
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        />
      }
    >
      <item.icon />
      <span>{item.name}</span>
      {count ? <SidebarMenuBadge>{count}</SidebarMenuBadge> : null}
    </SidebarMenuButton>
  );
}

export function DashboardSidebar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { state, toggleSidebar } = useSidebar();
  const isDark = resolvedTheme === "dark";

  // Real workspace data, not the template's fixtures.
  const { workspace, user } = useShell();
  const navigationGroups = React.useMemo(
    () => buildNavigation(workspace.slug),
    [workspace.slug],
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0!">
      <SidebarHeader className="relative h-20 flex-row items-center justify-between gap-3 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <div className="flex min-w-0 items-center gap-3 transition-opacity group-data-[collapsible=icon]:hidden">
          <MedeskLogo className="size-7 shrink-0" />
          <div className="flex flex-col">
            <span className="truncate text-base font-bold tracking-tight text-foreground">
              DLRS
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              Personal OS
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          aria-label={
            state === "expanded" ? "Collapse sidebar" : "Expand sidebar"
          }
          className="size-10"
        >
          <SidebarCollapseIcon className="size-5 transition-transform group-data-[collapsible=icon]:rotate-180" />
        </Button>
      </SidebarHeader>

      <SidebarContent className="gap-3 px-4 py-3 group-data-[collapsible=icon]:overflow-auto!">
        {navigationGroups.map((group) => {
          const isCollapsible = group.collapsible ?? false;

          if (isCollapsible) {
            return (
              <Collapsible
                key={group.label}
                defaultOpen
                className="group/collapsible"
              >
                <SidebarGroup className="gap-1 p-0">
                  <SidebarGroupLabel className={sidebarGroupLabelClassName} render={<CollapsibleTrigger className="flex w-full items-center justify-between transition-colors hover:text-foreground" />}><span>{group.label}</span><ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" /></SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="gap-0">
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.name}>
                            <NavItem item={item} />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          }

          return (
            <SidebarGroup key={group.label} className="gap-1 p-0">
              <SidebarGroupLabel className={sidebarGroupLabelClassName}>
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <NavItem item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="px-4 py-2">
        <SidebarGroup className="gap-0 p-0">
          <SidebarGroupLabel
            className={cn(
              sidebarGroupLabelClassName,
              "group-data-[collapsible=icon]:hidden",
            )}
          >
            Account
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0">
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  className={cn(
                    dropdownTriggerClassName,
                    menuButtonClassName,
                    "justify-start px-0!",
                  )}
                  aria-label={user.name}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar size="sm" className="border border-border/50">
                      <AvatarImage
                        src={user.avatarUrl ?? undefined}
                        alt={user.name}
                      />
                      <AvatarFallback>
                        {user.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      {user.name}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="leading-tight">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => setTheme(isDark ? "light" : "dark")}
                    >
                      {isDark ? <SunIcon /> : <MoonIcon />}
                      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<a href="/privacy" />}><BookOpenIcon className="size-4" /><span>Privacy &amp; Security</span></DropdownMenuItem>
                    <DropdownMenuItem render={<a href="/terms" />}><MessageCircleIcon className="size-4" /><span>Terms of Service</span></DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      void signOut()
                    }}
                  >
                    <LogOutIcon className="size-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
