export interface Message {
  id?: string
  agent: string
  content: string
  privateThinking?: string
}

export interface Scene {
  id?: string
  setting: string
  messages: Message[]
  summary: string
  round: number
}

export interface Simulation {
  id?: string
  scenes: Scene[]
  crimeDetails: string
  agentModels: AgentModel
}

export interface AgentModel {
  [key: string]: string
}

export interface SentencingResult {
  id?: string
  simulationId: string
  sentencing: string
  suspectAConfessed: boolean
  suspectBConfessed: boolean
}

