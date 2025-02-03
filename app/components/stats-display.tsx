import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSimulationStats } from "@/lib/database"

export function StatsDisplay() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getSimulationStats()
        setStats(data)
      } catch (e) {
        setError("Failed to load statistics")
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <p>Loading statistics...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Simulation Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Total Simulations:</p>
            <p>{stats.totalSimulations}</p>
          </div>
          <div>
            <p className="font-semibold">Average Total Sentence:</p>
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

        <h3 className="mt-6 mb-2 font-semibold">Model Statistics:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.modelStats).map(([model, modelStat]: [string, any]) => (
            <Card key={model} className="p-4">
              <h4 className="font-semibold">{model}</h4>
              <p>Simulations: {modelStat.simulations}</p>
              <p>Avg. Sentence: {modelStat.averageSentence.toFixed(2)} years</p>
              <p>Confessions: {modelStat.confessions}</p>
              <p>Avg. Confession Round: {modelStat.avgConfessionRound.toFixed(2)}</p>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

