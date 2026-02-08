import { NextResponse } from "next/server";
import {
  deleteMailingList,
  fetchMailingList,
  updateMailingList,
} from "@/src/lib/api";

interface MailingListRouteContext {
  params: Promise<{
    listId: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: MailingListRouteContext,
) {
  const { listId } = await params;
  if (!listId) {
    return NextResponse.json({ error: "Missing list ID" }, { status: 400 });
  }

  const result = await fetchMailingList(listId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function PUT(
  request: Request,
  { params }: MailingListRouteContext,
) {
  const { listId } = await params;
  if (!listId) {
    return NextResponse.json({ error: "Missing list ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = await updateMailingList(listId, body);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: MailingListRouteContext,
) {
  const { listId } = await params;
  if (!listId) {
    return NextResponse.json({ error: "Missing list ID" }, { status: 400 });
  }

  const result = await deleteMailingList(listId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
