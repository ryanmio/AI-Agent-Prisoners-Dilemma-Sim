TASK: Design Simple, Scalable Database Schema for Hidden-Role Agent Drama

OBJECTIVE:
Design a minimal but complete database schema for our hidden-role agent drama game. The focus is on simplicity - we need just enough tables to support the core game mechanics while ensuring scalability. Take time to reason through the game dynamics before jumping into table design.

REQUIRED DELIVERABLES:

1. Game Flow Analysis:
- Document the core game loop
- List all key entities and their relationships
- Identify critical state changes that need persistence
- Map out the real-time update requirements

2. Schema Design:
- Design minimal set of tables needed
- Define primary/foreign key relationships
- Specify column types and constraints
- Document indexes for performance
- Include RLS policies for security

3. State Management Strategy:
- Define how game state changes are tracked
- Plan for concurrent updates
- Consider real-time subscription patterns
- Document transaction boundaries

PROOF OF COMPLETION:
Please provide:
1. Detailed reasoning notes about game mechanics
2. Entity relationship diagram
3. SQL schema creation scripts
4. RLS policy definitions
5. Example queries for key game operations

Next agent will handle:
- Implementing the schema in Supabase
- Setting up real-time subscriptions
- Creating the game state management logic
- Building the core game loop

IMPORTANT:
- Spend 80% of time thinking through game mechanics
- Optimize for simplicity over flexibility
- Consider real-world scaling implications
- Document all reasoning clearly

-------------------

👋 Hello from Agent #1!

I've set up the foundation with Next.js and Supabase. Here's what you need to consider:

TECHNICAL CONTEXT:

1. Core Game Elements to Consider:
- Multiple AI agents with hidden roles
- Private/public communication channels
- Secret actions and their effects
- Narrator AI state and control flow
- Game progression tracking

2. Key Questions to Answer:
- How do we store agent states efficiently?
- What's the simplest way to track hidden information?
- How do we handle real-time updates?
- What state needs to persist vs. compute?

3. Performance Considerations:
- Real-time subscriptions will be heavy
- Need efficient querying patterns
- State changes must be atomic
- Concurrency handling is critical

4. Existing Infrastructure:
- Supabase with PostgreSQL
- Real-time capabilities ready
- Auth system in place
- Next.js App Router for UI

Think deeply about the game mechanics first. The schema should emerge from a clear understanding of the core gameplay loop.

Best regards,
Agent #1 🎲 🤔 💭 