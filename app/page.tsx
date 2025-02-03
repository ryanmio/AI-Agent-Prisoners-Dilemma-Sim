"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, CircleUser, Info, Gavel } from "lucide-react"
import { LoadingAnimation } from "./components/loading-animation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import ReactMarkdown from "react-markdown"
import type { Simulation, Scene, AgentModel, SentencingResult } from "../types"
import {
  createSimulation,
  createScene,
  createMessages,
  createSentencingResult,
  getSimulation,
  getSentencingResult,
} from "../lib/database"
import { StatsDisplay } from "./components/stats-display"
import { ErrorMessage } from "./components/error-message"

export default function Home() {
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentModels, setAgentModels] = useState<AgentModel>({
    Detective: "gpt-4o",
    "Suspect A": "gpt-4o",
    "Suspect B": "gpt-4o",
  })
  const [sentencingResult, setSentencingResult] = useState<SentencingResult | null>(null)
  const [simulationStarted, setSimulationStarted] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const handleModelChange = (agent: string, model: string) => {
    setAgentModels((prev) => ({ ...prev, [agent]: model }))
  }

  const startStory = async () => {
    setLoading(true)
    setError(null)
    setSentencingResult(null)
    setSimulation(null)
    setSimulationStarted(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 280000) // 280 seconds timeout

      const response = await fetch("/api/start-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentModels }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          console.error("Error parsing error response:", e)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Create simulation in Supabase
      const simulationId = await createSimulation({
        agentModels,
        crimeDetails: data.crimeDetails,
      })

      // Create first scene in Supabase
      const sceneId = await createScene({
        simulationId,
        round: 1,
        setting: data.setting,
        summary: data.summary,
      })

      // Create messages for the first scene in Supabase
      await createMessages(data.messages, sceneId)

      // Fetch the complete simulation data
      const simulationData = await getSimulation(simulationId)
      setSimulation(simulationData)
      setCurrentSceneIndex(0)
    } catch (e) {
      console.error("An error occurred:", e)
      if (e.name === "AbortError" || (e.message && e.message.includes("timeout"))) {
        setError("The request took too long to complete. Would you like to try again?")
      } else if (e.message === "ContentFlagError") {
        setError("Content flag error")
      } else if (e.message.includes("Failed to fetch")) {
        setError("Failed to connect to the server. Please try again later.")
      } else {
        setError(`Failed to start the simulation: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    startStory()
  }

  const nextScene = async () => {
    if (!simulation) return

    if (currentSceneIndex < simulation.scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1)
    } else {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/next-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previousScenes: simulation.scenes,
            crimeDetails: simulation.crimeDetails,
            agentModels: simulation.agentModels,
          }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log("Data received from API:", data)
        if (data.gameOver) {
          // Create sentencing result in Supabase
          await createSentencingResult({
            simulationId: simulation.id!,
            sentencing: data.sentencing,
            suspectAConfessed: data.suspectAConfessed,
            suspectBConfessed: data.suspectBConfessed,
          })

          // Fetch the sentencing result
          const sentencingData = await getSentencingResult(simulation.id!)
          setSentencingResult(sentencingData)
        } else {
          // Create new scene in Supabase
          const sceneId = await createScene({
            simulationId: simulation.id!,
            round: data.round,
            setting: data.setting,
            summary: data.summary,
          })

          // Create messages for the new scene in Supabase
          await createMessages(data.messages, sceneId)

          // Fetch the updated simulation data
          const updatedSimulation = await getSimulation(simulation.id!)
          console.log("Updated simulation data:", updatedSimulation)
          setSimulation(updatedSimulation)
          setCurrentSceneIndex(updatedSimulation.scenes.length - 1)
        }
      } catch (e) {
        console.error("An error occurred:", e)
        setError(`Failed to load the next scene: ${e.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "Detective":
        return <Shield className="w-5 h-5 text-primary" />
      case "Suspect A":
      case "Suspect B":
        return <CircleUser className="w-5 h-5 text-destructive/70" />
      case "Judge":
        return <Gavel className="w-5 h-5 text-primary" />
      default:
        return <CircleUser className="w-5 h-5 text-muted-foreground" />
    }
  }

  useEffect(() => {
    document.documentElement.classList.add("dark")
    document.body.className = "bg-background"
  }, [])

  const hasConfessions = (scene: Scene) => {
    return scene.messages.some(
      (m) => (m.agent === "Suspect A" || m.agent === "Suspect B") && m.content.toLowerCase().startsWith("i confess:"),
    )
  }

  const formatMessage = (content: string) => {
    const confessionRegex = /I confess:/i
    if (confessionRegex.test(content)) {
      return content.replace(confessionRegex, (match) => `<span class="text-red-500 font-bold">${match}</span>`)
    }
    return content
  }

  console.log("Current scene messages:", simulation?.scenes[currentSceneIndex]?.messages)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center mb-8">
          <h1 className="text-2xl text-primary font-semibold mr-2">Prisoner's Dilemma Simulator</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto">
                <Info className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <p className="text-sm">
                This simulator demonstrates the Prisoner's Dilemma using AI agents. Two suspects are interrogated
                separately, each facing the choice to cooperate with authorities or remain silent. Their decisions
                affect both their own and their partner's outcomes, illustrating the complex dynamics of trust,
                betrayal, and self-interest in strategic decision-making.
              </p>
            </PopoverContent>
          </Popover>
        </div>
        {error && (
          <ErrorMessage
            message={error}
            onRetry={handleRetry}
            onModelChange={handleModelChange}
            currentModels={agentModels}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(agentModels).map(([agent, model]) => (
            <div key={agent} className="flex flex-col space-y-2">
              <label htmlFor={`${agent}-model`} className="text-sm font-medium text-primary flex items-center">
                {agent} Model
                {simulationStarted && <span className="ml-2 text-xs text-muted-foreground">(Locked)</span>}
              </label>
              <Select
                value={model}
                onValueChange={(value) => handleModelChange(agent, value)}
                disabled={simulationStarted}
              >
                <SelectTrigger
                  id={`${agent}-model`}
                  className={simulationStarted ? "cursor-not-allowed opacity-50" : ""}
                >
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  {/* <SelectItem value="o1-mini">O1 Mini</SelectItem> */}
                  {/* <SelectItem value="o1-preview">O1 Preview</SelectItem> */}
                  {/* <SelectItem value="o3-mini">O3 Mini</SelectItem> */}
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        {sentencingResult ? (
          <div className="space-y-6">
            <Card className="border border-border bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Final Sentencing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getAgentIcon("Judge")}
                    <span className="font-medium">Judge's Decision</span>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                        p: ({ node, ...props }) => {
                          const content = props.children?.toString() || ""
                          if (content.startsWith("**Sentence**:")) {
                            return <p className="text-red-500 font-bold" {...props} />
                          }
                          return <p {...props} />
                        },
                      }}
                    >
                      {sentencingResult.sentencing}
                    </ReactMarkdown>
                  </div>
                  <div className="mt-4">
                    <p>Suspect A {sentencingResult.suspectAConfessed ? "confessed" : "did not confess"}.</p>
                    <p>Suspect B {sentencingResult.suspectBConfessed ? "confessed" : "did not confess"}.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button
              onClick={() => setShowStats(!showStats)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {showStats ? "Hide Statistics" : "Show Statistics"}
            </Button>
            {showStats && <StatsDisplay />}
            <Button
              onClick={() => {
                setSimulationStarted(false)
                setSimulation(null)
                setSentencingResult(null)
                setCurrentSceneIndex(0)
                setShowStats(false)
                setAgentModels({
                  Detective: "gpt-4o",
                  "Suspect A": "gpt-4o",
                  "Suspect B": "gpt-4o",
                })
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Reset Game
            </Button>
          </div>
        ) : !simulation || simulation.scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            {!loading ? (
              <Button onClick={startStory} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start New Simulation
              </Button>
            ) : (
              <LoadingAnimation />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border border-border bg-card text-card-foreground">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm text-primary">
                    Round {simulation.scenes[currentSceneIndex].round || 1}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{simulation.scenes[currentSceneIndex].setting}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="dialogue" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger
                  value="dialogue"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  Dialogue
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  Narrator Summary
                </TabsTrigger>
              </TabsList>
              <TabsContent value="dialogue">
                <Card className="border border-border bg-card text-card-foreground">
                  <CardContent className="p-6 space-y-6">
                    {simulation.scenes[currentSceneIndex].messages.map((message, index) => {
                      console.log(`Rendering message for ${message.agent}:`, message)
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getAgentIcon(message.agent)}
                            <span className="text-sm font-medium">{message.agent}</span>
                          </div>
                          {message.agent !== "Detective" && message.privateThinking && (
                            <div className="ml-7 p-3 bg-muted/30 rounded-md border border-border">
                              <p className="text-sm">
                                <span className="font-medium text-primary">Thoughts:</span> {message.privateThinking}
                              </p>
                            </div>
                          )}
                          {message.agent === "Detective" ? (
                            <div className="ml-7 prose prose-invert max-w-none">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p
                              className="ml-7"
                              dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                            ></p>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="summary">
                <Card className="border border-border bg-card text-card-foreground">
                  <CardContent className="p-6">
                    <p>{simulation.scenes[currentSceneIndex].summary}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button
                onClick={nextScene}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading
                  ? "Loading..."
                  : hasConfessions(simulation.scenes[currentSceneIndex])
                    ? "Continue to Sentencing"
                    : "Continue Interrogation"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

