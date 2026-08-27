import { GET as handleGmailCallback } from "@/app/api/integrations/gmail/callback/route"

export async function GET(request: Request) {
  return handleGmailCallback(request)
}
