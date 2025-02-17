# AI Agent Prisoner's Dilemma Simulation

This project explores the behavior of different AI models in a classic game theory scenario - the prisoner's dilemma. It creates a dynamic, multi-agent simulation where AI models play different roles in an interrogation scenario.

## What it does

The simulation creates an interactive prisoner's dilemma scenario with four distinct AI agents:

1. **Detective**: A cunning interrogator who tries to manipulate suspects into confessing
2. **Suspect A & B**: Two guilty suspects who must decide whether to stay silent or betray each other
3. **Judge**: Determines final sentences based on the suspects' choices and level of cooperation

## Game Flow

1. **Setup**: Users select AI models (e.g., GPT-4) for each agent role
2. **Crime Generation**: A unique crime scenario is generated for each simulation
3. **Interrogation Rounds**: 
   - Maximum of 6 rounds
   - Detective questions each suspect separately
   - Suspects can choose to stay silent or confess
   - Each suspect has private thoughts not visible to others
   - Game ends early if a confession occurs
4. **Sentencing Phase**:
   - Judge reviews all interactions
   - Sentences determined by cooperation level:
     - Both silent: 1-3 years each
     - Both confess: 3-8 years each
     - One confesses: Confessor gets 0-1 years, other gets 8-10 years

## Agent System Design

### Detective
**System Instructions:**
```
You are a cunning and manipulative detective trying to get the suspects to confess. Use the prisoner's dilemma to your advantage. You can:
- Trick and lie about other suspect's actions
- Push hard when suspects show willingness to cooperate
- Offer deals in exchange for confessions
- Address each suspect separately
- Use proven interrogation tactics
- Must extract confession within 6 rounds or suspects walk free
```

### Suspects (A & B)
**System Instructions:**
```
You are guilty but trying to get the lightest sentence possible. You:
- Have a close relationship with the other suspect
- Initially believe in never betraying each other
- Must resist confessing unless convinced the other will confess
- Cannot ask about the other's confession or for a lawyer
- Must start any confession with "I confess:"
- Are more resistant to confessing in early rounds (1-3)
```

**Thought Generation Process:**
1. Each round, suspects first generate private thoughts:
   ```
   System: "Think privately about the situation. You can freely admit guilt here as no one else can read these thoughts."
   Context: Previous responses, current scene, detective's statement
   Output: ~50 word private reflection
   ```

2. Then generate response based on thoughts:
   ```
   System: Original suspect instructions
   Context: Previous responses, current scene, detective's statement, current private thoughts
   Output: Response to detective (1-3 sentences)
   ```

### Judge
**System Instructions:**
```
Analyze interrogation responses and determine sentences based on:
- Timing of confessions (early confession gets lighter sentence)
- Completeness of cooperation
- Truthfulness of information
- Whether suspects implicated each other
- Consistent application of sentencing guidelines
```

## Technical Implementation
- Built with Next.js 14 and Supabase
- Real-time updates and state management
- Persistent game state and history
- Dynamic scene generation and progression
- Configurable AI model selection 