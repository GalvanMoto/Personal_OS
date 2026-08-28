"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  selectedDate: string // YYYY-MM-DD
  onSelectDate: (date: string) => void
  loggedDates: string[]
}

export function JournalCalendar({ selectedDate, onSelectDate, loggedDates }: Props) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const d = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const monthName = currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const todayStr = new Date().toISOString().split("T")[0]

  const loggedSet = new Set(loggedDates)

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  function jumpToToday() {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    onSelectDate(todayStr)
  }

  // Calculate streak of consecutive days logged up to today
  const streakCount = React.useMemo(() => {
    let streak = 0
    let check = new Date()
    while (true) {
      const s = check.toISOString().split("T")[0]
      if (loggedSet.has(s)) {
        streak++
        check.setDate(check.getDate() - 1)
      } else {
        // if today is not logged yet, check yesterday before breaking
        if (s === todayStr && streak === 0) {
          check.setDate(check.getDate() - 1)
          const yest = check.toISOString().split("T")[0]
          if (loggedSet.has(yest)) {
            streak++
            check.setDate(check.getDate() - 1)
            continue
          }
        }
        break
      }
    }
    return streak
  }, [loggedSet, todayStr])

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanksArray = Array.from({ length: firstDayIndex }, (_, i) => i)

  return (
    <div className="flex flex-col gap-3 p-3 bg-card rounded-xl border border-border/80 shadow-xs">
      {/* Month Navigation & Today Button */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="size-7" onClick={prevMonth}>
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="text-xs font-semibold tracking-tight text-foreground min-w-[110px] text-center">
            {monthName}
          </span>
          <Button variant="ghost" size="icon" className="size-7" onClick={nextMonth}>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {streakCount > 0 ? (
            <Badge variant="outline" className="text-[10px] font-mono gap-1 text-amber-500 border-amber-500/30 bg-amber-500/10 py-0 px-1.5 h-6">
              <Flame className="size-3 text-amber-500" />
              <span>{streakCount}d</span>
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-medium" onClick={jumpToToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {blanksArray.map((i) => (
          <div key={`blank-${i}`} className="h-7 w-7" />
        ))}
        {daysArray.map((day) => {
          const m = String(month + 1).padStart(2, "0")
          const d = String(day).padStart(2, "0")
          const dateStr = `${year}-${m}-${d}`
          const isSelected = selectedDate === dateStr
          const isToday = todayStr === dateStr
          const hasLog = loggedSet.has(dateStr)

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "h-7 w-7 rounded-md text-xs font-medium relative flex flex-col items-center justify-center transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : isToday
                  ? "bg-muted font-bold text-primary hover:bg-muted/80"
                  : "text-foreground hover:bg-muted/60"
              )}
            >
              <span>{day}</span>
              {hasLog ? (
                <span
                  className={cn(
                    "absolute bottom-0.5 size-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-emerald-500"
                  )}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
