import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest, publicSeller } from "@/lib/auth";

/** GET /api/auth/me – innlogget bruker, eller null. */
export async function GET(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  return NextResponse.json({
    seller: seller ? publicSeller(seller) : null,
  });
}
