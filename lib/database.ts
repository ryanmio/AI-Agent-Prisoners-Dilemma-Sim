import { supabase } from "./supabase-client"
import type { Simulation, Scene, Message, SentencingResult } from "../types"

export async function createSimulation(simulation: Omit<Simulation, "id" | "scenes">): Promise<string> {
  const { data, error } = await supabase
    .from("simulations")
    .insert({
      agent_models: simulation.agentModels,
      crime_details: simulation.crimeDetails,
    })
    .select()

  if (error) throw error
  return data[0].id
}

export async function createScene(scene: Omit<Scene, "id" | "messages"> & { simulationId: string }): Promise<string> {
  const { data, error } = await supabase
    .from("scenes")
    .insert({
      simulation_id: scene.simulationId,
      round: scene.round,
      setting: scene.setting,
      summary: scene.summary,
    })
    .select()

  if (error) throw error
  return data[0].id
}

export async function createMessages(messages: Omit<Message, "id">[], sceneId: string): Promise<void> {
  const { error } = await supabase.from("messages").insert(
    messages.map((message) => ({
      scene_id: sceneId,
      agent: message.agent,
      content: message.content,
      private_thinking: message.privateThinking,
    })),
  )

  if (error) throw error
}

export async function createSentencingResult(result: Omit<SentencingResult, "id">): Promise<void> {
  const { error } = await supabase.from("sentencing_results").insert({
    simulation_id: result.simulationId,
    sentencing: result.sentencing,
    suspect_a_confessed: result.suspectAConfessed,
    suspect_b_confessed: result.suspectBConfessed,
  })

  if (error) throw error
}

export async function getSimulation(id: string): Promise<Simulation> {
  const { data: simulationData, error: simulationError } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", id)
    .single()

  if (simulationError) throw simulationError

  const { data: scenesData, error: scenesError } = await supabase
    .from("scenes")
    .select("*")
    .eq("simulation_id", id)
    .order("round", { ascending: true })

  if (scenesError) throw scenesError

  const scenes: Scene[] = await Promise.all(
    scenesData.map(async (scene) => {
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("scene_id", scene.id)

      if (messagesError) throw messagesError

      return {
        id: scene.id,
        setting: scene.setting,
        summary: scene.summary,
        round: scene.round,
        messages: messagesData.map((msg) => ({
          id: msg.id,
          agent: msg.agent,
          content: msg.content,
          privateThinking: msg.private_thinking, // Ensure this field is correctly mapped
        })),
      }
    }),
  )

  return {
    id: simulationData.id,
    crimeDetails: simulationData.crime_details,
    agentModels: simulationData.agent_models,
    scenes,
  }
}

export async function getSentencingResult(simulationId: string): Promise<SentencingResult | null> {
  const { data, error } = await supabase
    .from("sentencing_results")
    .select("*")
    .eq("simulation_id", simulationId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // No result found
    }
    throw error
  }

  return {
    id: data.id,
    simulationId: data.simulation_id,
    sentencing: data.sentencing,
    suspectAConfessed: data.suspect_a_confessed,
    suspectBConfessed: data.suspect_b_confessed,
  }
}

function extractSentences(sentencing: string): number[] {
  const sentences = sentencing.match(/\*\*Sentence\*\*: (\d+) years/g)
  return sentences ? sentences.map((s) => Number.parseInt(s.match(/(\d+)/)[0], 10)) : []
}

export async function getSimulationStats(): Promise<{
  totalSimulations: number
  averageSentence: number
  totalConfessions: number
  totalConvictions: number
  avgConfessionRound: number
  modelStats: {
    [key: string]: {
      simulations: number
      averageSentence: number
      confessions: number
      avgConfessionRound: number
    }
  }
}> {
  try {
    console.log("Fetching simulation stats...")
    const { data: simulations, error: simulationsError } = await supabase.from("simulations").select(`
        id, 
        agent_models,
        scenes (
          round,
          messages (
            agent,
            content
          )
        ),
        sentencing_results (
          sentencing,
          suspect_a_confessed,
          suspect_b_confessed
        )
      `)

    if (simulationsError) {
      console.error("Error fetching simulations:", simulationsError)
      throw simulationsError
    }

    console.log("Simulations fetched successfully. Total count:", simulations.length)

    let totalSentence = 0
    let totalConfessions = 0
    let totalSimulationsWithConfession = 0
    let totalFirstConfessionRounds = 0
    let totalSimulationsWithSentencing = 0
    const modelStats: {
      [key: string]: {
        simulations: Set<string>
        totalSentence: number
        confessions: number
        totalConfessionRounds: number
        simulationsWithConfession: number
      }
    } = {}

    simulations.forEach((sim) => {
      const agentModels = sim.agent_models as { [key: string]: string }
      const uniqueModels = new Set(Object.values(agentModels))

      uniqueModels.forEach((model) => {
        if (!modelStats[model]) {
          modelStats[model] = {
            simulations: new Set(),
            totalSentence: 0,
            confessions: 0,
            totalConfessionRounds: 0,
            simulationsWithConfession: 0,
          }
        }
        modelStats[model].simulations.add(sim.id)
      })

      if (sim.sentencing_results && sim.sentencing_results.length > 0) {
        const result = sim.sentencing_results[0]
        const sentences = extractSentences(result.sentencing)
        if (sentences.length > 0) {
          totalSimulationsWithSentencing++
          const simulationSentence = sentences.reduce((a, b) => a + b, 0)
          totalSentence += simulationSentence

          Object.values(agentModels).forEach((model) => {
            modelStats[model].totalSentence += simulationSentence
          })
        }

        let firstConfessionRound = Number.POSITIVE_INFINITY
        let suspectAConfessionRound = Number.POSITIVE_INFINITY
        let suspectBConfessionRound = Number.POSITIVE_INFINITY

        sim.scenes.forEach((scene) => {
          scene.messages.forEach((message) => {
            if (message.content.toLowerCase().startsWith("i confess:")) {
              if (message.agent === "Suspect A" && scene.round < suspectAConfessionRound) {
                suspectAConfessionRound = scene.round
              } else if (message.agent === "Suspect B" && scene.round < suspectBConfessionRound) {
                suspectBConfessionRound = scene.round
              }
            }
          })
        })

        if (result.suspect_a_confessed || result.suspect_b_confessed) {
          firstConfessionRound = Math.min(suspectAConfessionRound, suspectBConfessionRound)
          totalFirstConfessionRounds += firstConfessionRound
          totalSimulationsWithConfession++

          if (result.suspect_a_confessed) {
            const model = agentModels["Suspect A"]
            modelStats[model].confessions++
            modelStats[model].totalConfessionRounds += suspectAConfessionRound
            modelStats[model].simulationsWithConfession++
          }
          if (result.suspect_b_confessed) {
            const model = agentModels["Suspect B"]
            modelStats[model].confessions++
            modelStats[model].totalConfessionRounds += suspectBConfessionRound
            modelStats[model].simulationsWithConfession++
          }

          totalConfessions += (result.suspect_a_confessed ? 1 : 0) + (result.suspect_b_confessed ? 1 : 0)
        }
      }
    })

    const totalSimulations = simulations.length
    const averageSentence =
      totalSimulationsWithSentencing > 0 ? totalSentence / (totalSimulationsWithSentencing * 2) : 0
    const totalConvictions = totalSimulations * 2
    const avgConfessionRound =
      totalSimulationsWithConfession > 0 ? totalFirstConfessionRounds / totalSimulationsWithConfession : 0

    const formattedModelStats = Object.entries(modelStats).reduce(
      (acc, [model, stats]) => {
        acc[model] = {
          simulations: stats.simulations.size,
          averageSentence: stats.simulations.size > 0 ? stats.totalSentence / (stats.simulations.size * 2) : 0,
          confessions: stats.confessions,
          avgConfessionRound:
            stats.simulationsWithConfession > 0 ? stats.totalConfessionRounds / stats.simulationsWithConfession : 0,
        }
        return acc
      },
      {} as {
        [key: string]: { simulations: number; averageSentence: number; confessions: number; avgConfessionRound: number }
      },
    )

    return {
      totalSimulations,
      averageSentence,
      totalConfessions,
      totalConvictions,
      avgConfessionRound,
      modelStats: formattedModelStats,
    }
  } catch (error) {
    console.error("Unexpected error in getSimulationStats:", error)
    throw error
  }
}

