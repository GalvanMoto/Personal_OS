"use client"

import { useEffect, useRef, useState } from "react";
import { CloseIcon, CommandIcon, SearchIcon } from "./icons";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { buildNavigation } from "@/components/dashboard/navigation-config";
import { useShell } from "@/components/dashboard/shell-context";
import { ActivityCenterDrawer } from "@/components/activity/activity-center-drawer";

export function DashboardTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace } = useShell();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const navigationGroups = useMemo(
    () => buildNavigation(workspace.slug),
    [workspace.slug],
  );

  // Longest matching href wins, so /settings/integrations does not resolve to
  // the /settings entry.
  const currentPage =
    navigationGroups
      .flatMap((group) => group.items)
      .filter(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      )
      .sort((a, b) => b.href.length - a.href.length)[0] ??
    navigationGroups[0].items[0];

  const CurrentPageIcon = currentPage.icon;

  const runSearch = (query: string) => {
    const term = query.trim();
    if (!term) return;
    router.push(`/w/${workspace.slug}/search?q=${encodeURIComponent(term)}`);
    setIsMobileSearchOpen(false);
  };

  const openMobileSearch = () => {
    setIsMobileSearchOpen(true);
    requestAnimationFrame(() => {
      mobileSearchInputRef.current?.focus();
    });
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        if (window.matchMedia("(max-width: 767px)").matches) {
          setIsMobileSearchOpen(true);
          requestAnimationFrame(() => {
            mobileSearchInputRef.current?.focus();
          });
          return;
        }

        searchInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setIsMobileSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="flex h-18 shrink-0 items-center justify-between gap-4 px-5 md:px-6">
      {isMobileSearchOpen ? (
        <div className="flex w-full items-center gap-2 md:hidden">
          <InputGroup className="h-9 flex-1 rounded-lg border-none bg-secondary py-1 pr-2 pl-3">
            <InputGroupAddon className="pl-0 text-muted-foreground">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              ref={mobileSearchInputRef}
              className="h-full p-0 px-1.5! text-sm leading-5 tracking-tight placeholder:text-muted-foreground"
              aria-label="Find a control"
              placeholder="find a control"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch(searchQuery);
              }}
            />
          </InputGroup>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-lg"
            aria-label="Close search"
            onClick={closeMobileSearch}
          >
            <CloseIcon />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger
              size="icon"
              className="shrink-0 md:hidden [&_svg]:size-5!"
            />
            <div className="hidden items-end gap-4 md:flex">
              <div className="flex h-6 items-center gap-3">
                <CurrentPageIcon className="size-4" />
                <span className="text-lg leading-6.5 font-medium">
                  {currentPage.name}
                </span>
              </div>
              <div className="flex h-6 items-center gap-1.5 text-xs text-muted-foreground">
                <span>•</span>
                <span>Last synced 5 min ago</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <InputGroup className="hidden h-9 w-64 lg:w-72 shrink-0 rounded-xl border border-border/50 bg-secondary/80 py-1 pr-2 pl-2.5 md:flex focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
              <InputGroupAddon className="gap-1.5 p-0 text-muted-foreground">
                <SearchIcon className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInputRef}
                className="h-full p-0 px-1 text-xs placeholder:text-muted-foreground"
                aria-label="Search tasks, deliverables, clients"
                placeholder="Search tasks, deliverables, clients..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") runSearch(searchQuery);
                }}
              />
              {searchQuery === "" ? (
                <InputGroupAddon
                  align="inline-end"
                  className="p-0 text-muted-foreground"
                >
                  <div className="flex h-5 w-8 items-center justify-center gap-0.5 rounded-md bg-background/80 border border-border/60 p-1 text-[10px] font-mono">
                    <CommandIcon className="size-2.5" />
                    <span>K</span>
                  </div>
                </InputGroupAddon>
              ) : null}
            </InputGroup>

            {/* Global System Activity Center Badge */}
            <ActivityCenterDrawer />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            aria-label="Open search"
            onClick={openMobileSearch}
          >
            <SearchIcon className="size-4" />
          </Button>
        </>
      )}
    </header>
  );
}
