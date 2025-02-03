import { NextResponse } from "next/server"
import { getSimulationStats } from "@/lib/database"

export async function GET() {
  try {
    const stats = await getSimulationStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching simulation stats:", error)
    return NextResponse.json({ error: "Failed to fetch simulation statistics" }, { status: 500 })
  }
}

