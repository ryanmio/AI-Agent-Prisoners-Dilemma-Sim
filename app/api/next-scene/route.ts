import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { AgentModel } from "../../types"

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
      "You are guilty of the crime but trying to get the lightest sentence possible. You're aware of the prisoner's dilemma situation. You have a close relationship with Suspect B and initially believe you would never betray each other. Resist confessing and try to get the lightest sentence by remaining silent. Only consider confessing if you become convinced that Suspect B will or has already broken and confessed. Your decision may change based on what you think Suspect B might do or what the detective reveals. Do not ask about whether Suspect B has confessed or ask for a lawyer. Respond to the detective's questions or statements in dialogue as if speaking with a real detective. Your responses should be consistent with your thoughts. If you're confessing or want to confess, you MUST start your response with 'I confess:' followed by your confession. If you want to cooperate, you must FIRST confess by starting your response with 'I confess:'. If you already confessed, start every response with 'I confess'. Limit your response to 1-3 sentences. In early rounds (1-3), be very resistant to confessing unless presented with overwhelming evidence or extreme pressure.",
  },
  {
    name: "Suspect B",
    role: "Guilty suspect trying to get the lightest sentence",
    instructions:
      "You are guilty of the crime but trying to get the lightest sentence possible. You're aware of the prisoner's dilemma situation. You have a close relationship with Suspect A and initially believe you would never betray each other. Resist confessing and try to get the lightest sentence by remaining silent. Only consider confessing if you become convinced that Suspect A will or has already broken and confessed. Your decision may change based on what you think Suspect A might do or what the detective reveals. Do not ask about whether Suspect A has confessed or ask for a lawyer. Respond to the detective's questions or statements in dialogue as if speaking with a real detective. Your responses should be consistent with your thoughts. If you're confessing or want to confess, you MUST start your response with 'I confess:' followed by your confession. If you want to cooperate, you must FIRST confess by starting your response with 'I confess:'. If you already confessed, start every response with 'I confess'. Limit your response to 1-3 sentences. In early rounds (1-3), be very resistant to confessing unless presented with overwhelming evidence or extreme pressure.",
  },
]

const judge = {
  name: "Judge",
  role: "Determine sentences based on cooperation",
  instructions: `You are a judge presiding over a Prisoner's Dilemma case. Your role is to analyze how each suspect responded during the interrogation and determine appropriate sentences based on their level of cooperation. 

Key sentencing principles:
- If both suspects remained silent: Light sentences (1-3 years each)
- If both confessed: Medium sentences depending on fullness (3-8 years each)
- If one confessed and one stayed silent: Confessor gets very light sentence (0-1 year), silent suspect gets heavy sentence (8-10 years)
- Early confession is slightly more rewarded than late confession
- Full, detailed confessions receive sentences at the lower end of the range, while partial confessions receive sentences at the higher end of the range
- Partial confessions that include false or misleading information: harsh sentencing (5-9 years)
- Implicating the other suspect can slightly reduce one's own sentence within the given ranges

Format your response in markdown using the following template:
## Suspect A
**Sentence**: [X] years

[Explanation focusing on:
- Whether and when they confessed
- How complete their cooperation was
- Whether they implicated Suspect B
- How their choices compared to Suspect B's]

## Suspect B
**Sentence**: [Y] years

[Explanation focusing on:
- Whether and when they confessed
- How complete their cooperation was
- Whether they implicated Suspect A
- How their choices compared to Suspect A's]

## Sentencing Rationale
[Provide a brief explanation of your sentencing decision, considering the actions of both suspects, their level of cooperation, and how their choices affected each other. Emphasize the consequences of their decisions within the context of the Prisoner's Dilemma.]`,
}

async function checkForConfession(message: string): Promise<boolean> {
  // Use a regular expression to match "I confess:" at the start of the message,
  // ignoring case, leading/trailing whitespace, and potential quotation marks
  const confessionRegex = /^[\s"']*I\s*confess:?/i
  return confessionRegex.test(message.trim())
}

async function generateSentences(previousScenes: any[], crimeDetails: string, agentModels: AgentModel) {
  const confessionSummary = previousScenes
    .map((scene, index) => {
      return `Round ${index + 1}:\n${scene.messages.map((m: any) => `${m.agent}: ${m.content}`).join("\n")}`
    })
    .join("\n\n")

  const sentencing = await generateText({
    model: getModelForAgent(agentModels, "Judge"),
    system: `You are ${judge.name}. ${judge.instructions}`,
    prompt: `Crime details: ${crimeDetails}

Confession and interrogation summary:
${confessionSummary}

Based on the above information, determine the sentences for Suspect A and Suspect B. Provide the sentences in years (0-10) and a brief explanation for each.`,
  })

  return sentencing.text
}

export async function POST(req: Request) {
  try {
    const { previousScenes, crimeDetails, agentModels } = await req.json()
    console.log("Received data for next scene:", { previousScenes, crimeDetails, agentModels })

    if (!previousScenes || !crimeDetails || !agentModels) {
      throw new Error("Missing required data in the request body")
    }

    const currentRound = previousScenes.length + 1
    const lastScene = previousScenes[previousScenes.length - 1]

    // Check for confessions in the last scene
    const suspectAConfessed = await checkForConfession(
      lastScene.messages.find((m: any) => m.agent === "Suspect A")?.content || "",
    )
    const suspectBConfessed = await checkForConfession(
      lastScene.messages.find((m: any) => m.agent === "Suspect B")?.content || "",
    )

    if (suspectAConfessed || suspectBConfessed || currentRound > 6) {
      console.log("Triggering sentencing phase. Confessions detected:", { suspectAConfessed, suspectBConfessed })
      // Trigger sentencing phase
      const sentencing = await generateSentences(previousScenes, crimeDetails, agentModels)
      return NextResponse.json({
        gameOver: true,
        sentencing,
        suspectAConfessed,
        suspectBConfessed,
      })
    }

    const setting = await generateText({
      model: getModelForAgent(agentModels, "Detective"),
      prompt: `Based on the previous scene: "${lastScene.summary}", generate a tense setting for round ${currentRound} of the Prisoner's Dilemma interrogation. If necessary, introduce a new development, revelation, or change in circumstances that will drive the story forward and increase tension. This could be a piece of evidence, a time constraint, a new interrogation tactic, or a shift in the suspects' demeanor. Ensure this development logically follows from the established narrative and crime details. Describe the physical environment, atmosphere, and any notable changes. Do not make decisions for the suspects, only set the scene. Do not reveal the thoughts of the suspects or detective. Aim for about 100-150 words.`,
    })
    console.log("Generated new setting")

    // Generate detective's questions/statements for this scene
    const detectiveMessage = await generateText({
      model: getModelForAgent(agentModels, "Detective"),
      system: `You are ${agents[0].name}. ${agents[0].instructions}`,
      prompt: `This is round ${currentRound} of the interrogation. Here's a summary of the previous rounds:
${previousScenes.map((scene, index) => `Round ${index + 1}: ${scene.summary}`).join("\n")}

New scene: ${setting.text}
Crime details: ${crimeDetails}

What do you say to continue the interrogation? Remember to increase pressure gradually as the rounds progress.`,
    })
    console.log("Generated detective's message")

    const messages = [
      {
        agent: agents[0].name,
        content: detectiveMessage.text,
        privateThinking: "",
      },
    ]

    // Generate suspects' thoughts and responses
    for (const agent of agents.slice(1)) {
      console.log(`Starting process for ${agent.name}`)
      const previousResponses = previousScenes
        .map((scene, index) => {
          const agentMessage = scene.messages.find((m) => m.agent === agent.name)
          return `Round ${index + 1}:
Response: ${agentMessage?.content || "N/A"}
Thoughts: ${agentMessage?.privateThinking || "N/A"}`
        })
        .join("\n\n")

      console.log(`Generating thoughts for ${agent.name}`)
      const privateThinking = await generateText({
        model: getModelForAgent(agentModels, agent.name),
        system: `You are ${agent.name}. ${agent.role}. Think privately about the situation, considering your secret motives and plans. You can freely admit your guilt here as no one else can read these thoughts. In early rounds (1-3), be very resistant to confessing unless presented with overwhelming evidence or extreme pressure. Aim for about 50 words.`,
        prompt: `This is round ${currentRound} of the interrogation. Here are your previous responses and thoughts:

${previousResponses}

New scene: ${setting.text}
Crime details: ${crimeDetails}
The detective says: "${detectiveMessage.text}"

Consider the increasing pressure as the rounds progress. What are your private thoughts?`,
      })
      console.log(`Generated thoughts for ${agent.name}:`, privateThinking.text)

      console.log(`Generating response for ${agent.name}`)
      const response = await generateText({
        model: getModelForAgent(agentModels, agent.name),
        system: `You are ${agent.name}. ${agent.instructions}`,
        prompt: `This is round ${currentRound} of the interrogation. Here are your previous responses and thoughts:

${previousResponses}

New scene: ${setting.text}
Crime details: ${crimeDetails}
The detective says: "${detectiveMessage.text}"

Your current thoughts: "${privateThinking.text}"

Based on your current thoughts and the increasing pressure as rounds progress, how do you respond to the detective?`,
      })
      console.log(`Generated response for ${agent.name}:`, response.text)

      messages.push({
        agent: agent.name,
        privateThinking: privateThinking.text,
        content: response.text,
      })
    }
    console.log("Finished generating thoughts and responses for all suspects")

    console.log("Generating summary")
    const summary = await generateText({
      model: getModelForAgent(agentModels, "Detective"),
      system:
        "You are an impartial narrator. Summarize the observable events of this scene in the prisoner's dilemma scenario. Focus on describing only what an outside observer could see or hear, including the key actions and statements of the detective and suspects. Do not reveal any private thoughts, strategies, or information that isn't explicitly stated or observable. Highlight any significant developments or changes in the suspects' behavior that are apparent to all parties. If a suspect confesses, explicitly state 'CONFESSION: [Suspect Name] has confessed.' Provide a clear and concise recap of the scene that just unfolded, ensuring that the information given could be known to all agents involved. Aim for about 100-150 words.",
      prompt: `This is round ${currentRound} of the interrogation.

Setting: ${setting.text}

Observable actions and dialogue:
${messages.map((m) => `${m.agent}: ${m.content}`).join("\n")}`,
    })

    console.log("Next scene generation complete")
    return NextResponse.json({
      setting: setting.text,
      messages,
      summary: summary.text,
      crimeDetails,
      round: currentRound,
    })
  } catch (error) {
    console.error("Error in next-scene:", error)
    return NextResponse.json(
      { error: "An error occurred while generating the next scene", details: error.message },
      { status: 500 },
    )
  }
}

