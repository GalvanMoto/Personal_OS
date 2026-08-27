"use client"

import * as React from "react"
import {
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  FolderGit2,
  ListTodo,
  Mail,
  Plus,
  Receipt,
  StickyNote,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateTaskDrawer } from "@/components/create/create-task-drawer"
import { CreateProjectDrawer } from "@/components/create/create-project-drawer"
import { CreateClientDrawer } from "@/components/create/create-client-drawer"
import { CreateNoteDrawer } from "@/components/create/create-note-drawer"
import { CreateTransactionDrawer } from "@/components/create/create-transaction-drawer"
import { CreateEventDrawer } from "@/components/create/create-event-drawer"
import { CreateFileDrawer } from "@/components/create/create-file-drawer"
import { CreateDocumentDrawer } from "@/components/create/create-document-drawer"
import { CreateEmailDrawer } from "@/components/create/create-email-drawer"

interface UniversalCreateHubProps {
  workspace: string
}

export function UniversalCreateHub({ workspace }: UniversalCreateHubProps) {
  const [projectOpen, setProjectOpen] = React.useState(false)
  const [clientOpen, setClientOpen] = React.useState(false)
  const [eventOpen, setEventOpen] = React.useState(false)
  const [docOpen, setDocOpen] = React.useState(false)
  const [emailOpen, setEmailOpen] = React.useState(false)
  const [fileOpen, setFileOpen] = React.useState(false)
  const [noteOpen, setNoteOpen] = React.useState(false)
  const [txOpen, setTxOpen] = React.useState(false)

  return (
    <div className="flex items-center gap-1">
      {/* 1. Dedicated Direct Task Button */}
      <CreateTaskDrawer
        workspace={workspace}
        trigger={
          <Button size="sm" className="h-8 gap-1.5 px-3 text-xs bg-primary text-primary-foreground font-medium shadow-xs">
            <Plus className="size-3.5" />
            <span>Task</span>
          </Button>
        }
      />

      {/* 2. Dropdown for All Other Specialized Entity Creation Drawers */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            />
          }
        >
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 text-xs">
          <DropdownMenuLabel className="text-[0.625rem] font-semibold text-muted-foreground uppercase tracking-wider">
            Create Entity
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setProjectOpen(true)} className="gap-2 cursor-pointer">
            <FolderGit2 className="size-3.5 text-primary" />
            <span>New Project</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setClientOpen(true)} className="gap-2 cursor-pointer">
            <Building2 className="size-3.5 text-primary" />
            <span>New Client</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setEmailOpen(true)} className="gap-2 cursor-pointer">
            <Mail className="size-3.5 text-primary" />
            <span>Compose Email</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setDocOpen(true)} className="gap-2 cursor-pointer">
            <BookOpen className="size-3.5 text-primary" />
            <span>New Document</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setEventOpen(true)} className="gap-2 cursor-pointer">
            <Calendar className="size-3.5 text-primary" />
            <span>New Event / Meeting</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setFileOpen(true)} className="gap-2 cursor-pointer">
            <Upload className="size-3.5 text-primary" />
            <span>Upload File / Asset</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setNoteOpen(true)} className="gap-2 cursor-pointer">
            <StickyNote className="size-3.5 text-primary" />
            <span>New Note</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setTxOpen(true)} className="gap-2 cursor-pointer">
            <Receipt className="size-3.5 text-primary" />
            <span>New Transaction</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectDrawer
        workspace={workspace}
        trigger={
          <button
            id={`open-project-${workspace}`}
            style={{ display: projectOpen ? "block" : "none" }}
            onClick={() => setProjectOpen(false)}
          />
        }
      />

      <CreateClientDrawer
        workspace={workspace}
        trigger={
          <button
            id={`open-client-${workspace}`}
            style={{ display: clientOpen ? "block" : "none" }}
            onClick={() => setClientOpen(false)}
          />
        }
      />

      <CreateEmailDrawer
        workspace={workspace}
        trigger={
          <button
            id={`open-email-${workspace}`}
            style={{ display: emailOpen ? "block" : "none" }}
            onClick={() => setEmailOpen(false)}
          />
        }
      />

      <CreateDocumentDrawer
        workspace={workspace}
        trigger={
          <button
            id={`open-doc-${workspace}`}
            style={{ display: docOpen ? "block" : "none" }}
            onClick={() => setDocOpen(false)}
          />
        }
      />

      <CreateEventDrawer
        workspace={workspace}
        trigger={
          <button
            id={`open-event-${workspace}`}
            style={{ display: eventOpen ? "block" : "none" }}
            onClick={() => setEventOpen(false)}
          />
        }
      />

      <CreateFileDrawer
        workspace={workspace}
        trigger={
          <button
            id={`open-file-${workspace}`}
            style={{ display: fileOpen ? "block" : "none" }}
            onClick={() => setFileOpen(false)}
          />
        }
      />

      <CreateNoteDrawer
        workspace={workspace}
        trigger={
          <button
            id={`open-note-${workspace}`}
            style={{ display: noteOpen ? "block" : "none" }}
            onClick={() => setNoteOpen(false)}
          />
        }
      />

      <CreateTransactionDrawer
        workspace={workspace}
        trigger={
          <button
            id={`open-tx-${workspace}`}
            style={{ display: txOpen ? "block" : "none" }}
            onClick={() => setTxOpen(false)}
          />
        }
      />
    </div>
  )
}
