"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingAnimation } from "../components/loading-animation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

interface ModelStats {
  simulations: number
  averageSentence: number
  confessions: number
  avgConfessionRound: number
}

interface Stats {
  totalSimulations: number
  averageSentence: number
  totalConfessions: number
  totalConvictions: number
  avgConfessionRound: number
  modelStats: {
    [key: string]: ModelStats
  }
}

type SortKey = keyof ModelStats | "model"
type SortOrder = "asc" | "desc"

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortOrder }>({
    key: "model",
    direction: "asc",
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log("Fetching stats from API...")
        const response = await fetch("/api/stats")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log("Stats fetched successfully:", data)
        setStats(data)
      } catch (e) {
        console.error("Error fetching stats:", e)
        setError(`Failed to load statistics: ${e.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const sortedModelStats = stats
    ? Object.entries(stats.modelStats)
        .map(([model, stat]) => ({
          model,
          ...stat,
        }))
        .sort((a, b) => {
          if (sortConfig.key === "model") {
            return sortConfig.direction === "asc" ? a.model.localeCompare(b.model) : b.model.localeCompare(a.model)
          }
          const aValue = a[sortConfig.key as keyof ModelStats]
          const bValue = b[sortConfig.key as keyof ModelStats]
          if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
          if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
          return 0
        })
    : []

  const requestSort = (key: SortKey) => {
    let direction: SortOrder = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  if (loading) return <LoadingAnimation />
  if (error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  if (!stats) return <p>No statistics available</p>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simulation Statistics</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Total Simulations:</p>
              <p>{stats.totalSimulations}</p>
            </div>
            <div>
              <p className="font-semibold">Average Sentence:</p>
              <p>{stats.averageSentence.toFixed(2)} years</p>
            </div>
            <div>
              <p className="font-semibold">Total Confessions:</p>
              <p>{stats.totalConfessions}</p>
            </div>
            <div>
              <p className="font-semibold">Total Convictions:</p>
              <p>{stats.totalConvictions}</p>
            </div>
            <div>
              <p className="font-semibold">Avg. Confession Round:</p>
              <p>{stats.avgConfessionRound.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4">Model Statistics</h2>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("model")}>
                    Model <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("simulations")}>
                    Simulations <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("averageSentence")}>
                    Avg. Sentence <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("confessions")}>
                    Confessions <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("avgConfessionRound")}>
                    Avg. Confession Round <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModelStats.map((modelStat) => (
                <TableRow key={modelStat.model}>
                  <TableCell className="font-medium">{modelStat.model}</TableCell>
                  <TableCell>{modelStat.simulations}</TableCell>
                  <TableCell>{modelStat.averageSentence.toFixed(2)} years</TableCell>
                  <TableCell>{modelStat.confessions}</TableCell>
                  <TableCell>{modelStat.avgConfessionRound.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

