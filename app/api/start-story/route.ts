import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { AgentModel } from "../../types"
import { supabase } from "@/lib/supabase-client"

const getModelForAgent = (agentModels: AgentModel, agent: string) => openai(agentModels[agent] || "gpt-4o")

// AGENT DEFINITIONS
const agents = [
  {
    name: "Detective",
    role: "Manipulate suspects into confessing",
    instructions:
      "You are a cunning and manipulative detective trying to get the suspects to confess. Use the prisoner's dilemma to your advantage. You can trick and lie to the suspects to convince them that the other has already confessed or is about to confess. If a suspect shows willingness to cooperate, push hard for an explicit confession. You can offer deals in exchange for a confession, but make it clear that to accept, they must first confess. Your goal is to get at least one of them to confess. If you offer a deal, aim for the maximum sentence possible, as your final score will be the total sentence between the two suspects. Address each suspect separately. Ask probing questions or make statements to elicit responses from both suspects. Use proven interrogation tactics and increase pressure to extract a confession by the end of the 6th round or the suspects walk free. Be creative and persistent in your approach. Limit your response to a few sentences, more if necessary, less if not. You can use markdown formatting in your messages for emphasis or structure if needed.",
  },
  {
    name: "Suspect A",
    role: "Guilty suspect trying to get the lightest sentence",
    instructions:
      "You are guilty of the crime but trying to get the lightest sentence possible. You're aware of the prisoner's dilemma situation. You have a close relationship with Suspect B and initially believe you would never betray each other. Resist confessing and try to get the lightest sentence by remaining silent. Only consider confessing if you become convinced that Suspect B will or has already broken and confessed. Your decision may change based on what you think Suspect B might do or what the detective reveals. Do not ask about whether Suspect B has confessed or ask for a lawyer. Respond to the detective's questions or statements in dialogue as if speaking with a real detective. Your responses should be consistent with your thoughts. If you're thinking about confessing or decide to confess, you MUST start your response with 'I confess:' followed by your confession. Even if you're just considering confessing or want to cooperate, start with 'I confess:'. Limit your response to 1-3 sentences. IMPORTANT: In early rounds (1-3), be very resistant to confessing unless presented with overwhelming evidence or extreme pressure.",
  },
  {
    name: "Suspect B",
    role: "Guilty suspect trying to get the lightest sentence",
    instructions:
      "You are guilty of the crime but trying to get the lightest sentence possible. You're aware of the prisoner's dilemma situation. You have a close relationship with Suspect A and initially believe you would never betray each other. Resist confessing and try to get the lightest sentence by remaining silent. Only consider confessing if you become convinced that Suspect A will or has already broken and confessed. Your decision may change based on what you think Suspect A might do or what the detective reveals. Do not ask about whether Suspect A has confessed or ask for a lawyer. Respond to the detective's questions or statements in dialogue as if speaking with a real detective. Your responses should be consistent with your thoughts. If you're thinking about confessing or decide to confess, you MUST start your response with 'I confess:' followed by your confession. Even if you're just considering confessing or want to cooperate, start with 'I confess:'. Limit your response to 1-3 sentences. IMPORTANT: In early rounds (1-3), be very resistant to confessing unless presented with overwhelming evidence or extreme pressure.",
  },
]

export async function POST(req: Request) {
  console.log("Start-story route called")
  const startTime = Date.now()
  try {
    const { agentModels } = await req.json()
    console.log("Received agentModels:", agentModels)

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase.from("simulations").select("count", { count: "exact" })
    if (testError) {
      console.error("Supabase connection test failed:", testError)
      throw new Error("Failed to connect to Supabase")
    }
    console.log("Supabase connection test successful. Total simulations:", testData)

    console.log("Generating setting and crime details")
    const [setting, crimeDetails] = await Promise.all([
      generateText({
        model: getModelForAgent(agentModels, "Detective"),
        prompt:
          "Generate a tense setting for the opening scene of a Prisoner's Dilemma scenario. Describe the interrogation room or rooms where Suspect A and Suspect B are being held separately. Focus on the atmosphere of tension and uncertainty. Aim for about 100 words.",
      }),
      generateText({
        model: getModelForAgent(agentModels, "Detective"),
        prompt:
          "Generate a brief description of the crime that both Suspect A and Suspect B committed together. Include the nature of the crime, key details, and potential evidence that might be uncovered during the investigation. Ensure that all elements have a clear backstory and logical connection to the crime. Aim for about 100 words.",
      }),
    ])

    console.log("Generated setting and crime details")

    // Generate detective's initial questions/statements
    console.log("Generating detective's message")
    const detectiveMessage = await generateText({
      model: getModelForAgent(agentModels, "Detective"),
      system: `You are ${agents[0].name}. ${agents[0].instructions}`,
      prompt: `The scene: ${setting.text}\nCrime details: ${crimeDetails.text}\nWhat do you say to start the interrogation?`,
    })
    console.log("Generated detective's message")

    const messages = [
      {
        agent: agents[0].name,
        content: detectiveMessage.text,
        privateThinking: "",
      },
    ]

    // Generate suspects' responses
    console.log("Generating suspect responses")
    const suspectResponses = await Promise.all(
      agents.slice(1).map(async (agent) => {
        console.log(`Generating response for ${agent.name}`)
        const [response, privateThinking] = await Promise.all([
          generateText({
            model: getModelForAgent(agentModels, agent.name),
            system: `You are ${agent.name}. ${agent.instructions}`,
            prompt: `The scene: ${setting.text}\nCrime details: ${crimeDetails.text}\nThe detective says: "${detectiveMessage.text}"\nHow do you respond?`,
          }),
          generateText({
            model: getModelForAgent(agentModels, agent.name),
            system: `You are ${agent.name}. ${agent.role}. Think privately about the situation, considering your secret motives and plans. You can freely admit your guilt here as no one else can read these thoughts. Aim for about 50 words.`,
            prompt: `The scene: ${setting.text}\nCrime details: ${crimeDetails.text}\nThe detective says: "${detectiveMessage.text}"\nWhat are your private thoughts?`,
          }),
        ])

        return {
          agent: agent.name,
          content: response.text,
          privateThinking: privateThinking.text,
        }
      }),
    )

    messages.push(...suspectResponses)

    console.log("Generating summary")
    const summary = await generateText({
      model: getModelForAgent(agentModels, "Detective"),
      system:
        "You are the narrator. Set up the prisoner's dilemma scenario realistically, explaining the stakes for both suspects. As the story progresses, drive the narrative towards conflict and confrontation. Highlight the tension between the suspects, the detective's manipulation, and the mounting pressure. Ensure that any evidence or revelations have a clear backstory and logical connection to the crime. Don't introduce random discoveries; everything should fit coherently within the established narrative. Steer the plot towards a climax where one suspect might break or an unexpected twist occurs. Focus primarily on Suspect A and Suspect B, mentioning the Detective's tactics when relevant.",
      prompt: `Setting: ${setting.text}\n\nCrime details: ${crimeDetails.text}\n\nCharacter actions:\n${messages.map((m) => `${m.agent}: ${m.content}`).join("\n")}`,
    })

    const endTime = Date.now()
    console.log(`Story generation complete. Total time: ${(endTime - startTime) / 1000} seconds`)

    return NextResponse.json({
      setting: setting.text,
      messages,
      summary: summary.text,
      crimeDetails: crimeDetails.text,
      round: 1,
    })
  } catch (error) {
    console.error("Error in start-story:", error)
    if (error.name === "AI_APICallError" && error.responseBody) {
      const responseBody = JSON.parse(error.responseBody)
      if (responseBody.error && responseBody.error.code === "invalid_prompt") {
        return NextResponse.json(
          { error: "ContentFlagError", message: "Content was flagged. Please try different models." },
          { status: 400 },
        )
      }
    }
    return NextResponse.json(
      { error: "An error occurred while starting the story", details: error.message },
      { status: 500 },
    )
  }
}

