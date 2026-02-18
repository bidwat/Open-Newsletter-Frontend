import { NextResponse } from "next/server";
import { fetchCoreMyProfile, updateCoreMyProfile } from "@/src/lib/api";

interface UpdateMyProfileBody {
  name?: string;
  username?: string;
}

export async function GET() {
  const result = await fetchCoreMyProfile();

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function PUT(request: Request) {
  try {
    const body: UpdateMyProfileBody = await request.json();
    const name = body.name?.trim();
    const username = body.username?.trim();

    if (!name || !username) {
      return NextResponse.json(
        { error: "Name and username are required" },
        { status: 400 },
      );
    }

    const result = await updateCoreMyProfile({ name, username });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
