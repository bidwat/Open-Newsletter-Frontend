import { NextResponse } from "next/server";
import { fetchCampaignContacts } from "@/src/lib/api";

interface CampaignContactsContext {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: CampaignContactsContext,
) {
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign ID" }, { status: 400 });
  }

  const result = await fetchCampaignContacts(campaignId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
