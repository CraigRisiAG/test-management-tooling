# Agile Hierarchy Structure

This document describes the complete agile hierarchy implemented in the test management tooling platform.

## Hierarchy Overview

```
Portfolio Objectives (Business Strategy, Multi-year)
  ↓
Goals (Strategic Initiatives, 1-3 quarters)
  ↓
Features (Large Deliverables, 1-3 sprints)
  ↓
Epics (Story Collections, 1-2 sprints)
  ↓
Stories (User Stories, 1-2 weeks)
  ↓
Tasks (Implementation Tasks, hours/days)
  ↓
Tests (Test Cases linked to stories)
```

## Entity Definitions

### 1. Portfolio Objective

**Purpose**: Highest-level strategic goal aligned with business strategy  
**Timeframe**: Multi-year (1-3 years)  
**Owner**: Executive leadership  

**Properties**:
- `id`: Unique identifier
- `name`: Portfolio objective name
- `description`: Detailed description
- `status`: draft | active | on-track | at-risk | completed | cancelled
- `owner`: Responsible executive
- `startDate`: Start date
- `targetDate`: Target completion date
- `keyResults`: Array of measurable key results (OKR style)
- `linkedGoals`: Array of goal IDs that contribute to this objective
- `metrics`: Progress tracking (total goals, completed goals, progress %)
- `tags`: Classification tags

**Example**:
```json
{
  "id": "PORTFOLIO-001",
  "name": "Digital Transformation Initiative",
  "description": "Transform customer experience through modernization",
  "status": "active",
  "owner": "CTO",
  "startDate": "2026-01-01",
  "targetDate": "2028-12-31",
  "keyResults": [
    {
      "description": "Increase customer satisfaction score",
      "targetValue": 90,
      "currentValue": 75,
      "unit": "%"
    }
  ],
  "linkedGoals": ["GOAL-001", "GOAL-002"],
  "metrics": {
    "totalGoals": 5,
    "completedGoals": 2,
    "progressPercentage": 40
  }
}
```

### 2. Goal

**Purpose**: Strategic initiative contributing to portfolio objectives  
**Timeframe**: 1-3 quarters  
**Owner**: Product/Engineering leadership  

**Properties**:
- `id`: Unique identifier
- `portfolioObjectiveId`: Parent portfolio objective (optional)
- `name`: Goal name
- `description`: Detailed description
- `status`: draft | planned | in-progress | completed | cancelled
- `priority`: low | medium | high | critical
- `owner`: Responsible leader
- `startDate`: Start date
- `targetDate`: Target completion date
- `linkedFeatures`: Array of feature IDs
- `successCriteria`: Array of success criteria
- `metrics`: Progress tracking

**Example**:
```json
{
  "id": "GOAL-001",
  "portfolioObjectiveId": "PORTFOLIO-001",
  "name": "Modernize Payment Processing",
  "description": "Upgrade payment system for better performance",
  "status": "in-progress",
  "priority": "high",
  "owner": "VP Engineering",
  "startDate": "2026-01-01",
  "targetDate": "2026-06-30",
  "linkedFeatures": ["FEATURE-001", "FEATURE-002"],
  "successCriteria": [
    "Process 1000 transactions/sec",
    "99.99% uptime",
    "Sub-second response time"
  ],
  "metrics": {
    "totalFeatures": 3,
    "completedFeatures": 1,
    "progressPercentage": 33
  }
}
```

### 3. Feature

**Purpose**: Large body of work delivering significant business value  
**Timeframe**: 1-3 sprints  
**Owner**: Product Manager  

**Properties**:
- `id`: Unique identifier
- `goalId`: Parent goal (optional)
- `name`: Feature name
- `description`: Detailed description
- `status`: backlog | planned | in-progress | testing | done | cancelled
- `priority`: low | medium | high | critical
- `owner`: Product Manager
- `startDate`: Start date (optional)
- `targetDate`: Target completion date (optional)
- `linkedEpics`: Array of epic IDs
- `acceptanceCriteria`: Array of acceptance criteria
- `businessValue`: 1-100 scale
- `effort`: Story points or effort estimate
- `testCoverageTarget`: Target test coverage percentage
- `metrics`: Progress tracking including test coverage

**Example**:
```json
{
  "id": "FEATURE-001",
  "goalId": "GOAL-001",
  "name": "Credit Card Payment Integration",
  "description": "Integrate with Stripe for credit card processing",
  "status": "in-progress",
  "priority": "high",
  "owner": "Product Manager A",
  "targetDate": "2026-03-15",
  "linkedEpics": ["EPIC-001", "EPIC-002"],
  "acceptanceCriteria": [
    "Support Visa, MasterCard, Amex",
    "PCI DSS compliant",
    "Handle 3D Secure authentication"
  ],
  "businessValue": 90,
  "effort": 55,
  "testCoverageTarget": 85,
  "metrics": {
    "totalEpics": 2,
    "completedEpics": 1,
    "totalStories": 12,
    "completedStories": 7,
    "progressPercentage": 58,
    "testCoveragePercentage": 78
  }
}
```

### 4. Epic

**Purpose**: Collection of related user stories  
**Timeframe**: 1-2 sprints  
**Owner**: Tech Lead / Scrum Master  

**Properties**:
- `id`: Unique identifier
- `featureId`: Parent feature (optional)
- `boardId`: Agile board this epic belongs to
- `name`: Epic name
- `description`: Detailed description
- `status`: backlog | planned | in-progress | testing | done | cancelled
- `priority`: low | medium | high | critical
- `owner`: Tech Lead
- `startDate`: Start date (optional)
- `targetDate`: Target completion date (optional)
- `linkedStories`: Array of story IDs
- `acceptanceCriteria`: Array of acceptance criteria
- `estimate`: Total story points
- `metrics`: Progress tracking
- `tags`: Classification tags

**Example**:
```json
{
  "id": "EPIC-001",
  "featureId": "FEATURE-001",
  "boardId": "BOARD-001",
  "name": "Stripe Payment Gateway Integration",
  "description": "Core integration with Stripe API",
  "status": "in-progress",
  "priority": "high",
  "owner": "Tech Lead A",
  "targetDate": "2026-02-28",
  "linkedStories": ["STORY-001", "STORY-002", "STORY-003"],
  "acceptanceCriteria": [
    "All Stripe API endpoints integrated",
    "Error handling implemented",
    "Unit tests with 90% coverage"
  ],
  "estimate": 34,
  "metrics": {
    "totalStories": 8,
    "completedStories": 5,
    "totalStoryPoints": 34,
    "completedStoryPoints": 21,
    "progressPercentage": 62,
    "testCoveragePercentage": 85
  }
}
```

### 5. Story

**Purpose**: User story representing a unit of work  
**Timeframe**: 1-2 weeks  
**Owner**: Developer  

**Properties**:
- `id`: Unique identifier
- `boardId`: Agile board
- `sprintId`: Sprint (if assigned)
- `epicId`: Parent epic (optional)
- `title`: Story title
- `description`: User story description
- `type`: feature | bug | chore | spike
- `status`: backlog | todo | in-progress | review | testing | done
- `priority`: low | medium | high | critical
- `estimate`: Story points
- `assignee`: Developer assigned
- `reporter`: Story creator
- `tags`: Classification tags
- `acceptanceCriteria`: Array of acceptance criteria
- `tasks`: Array of implementation tasks
- `testLinks`: Linked test cases
- `repositoryLinks`: Linked code commits/branches
- `comments`: Discussion comments

**Example**:
```json
{
  "id": "STORY-001",
  "boardId": "BOARD-001",
  "sprintId": "SPRINT-005",
  "epicId": "EPIC-001",
  "title": "As a user, I want to save my payment method",
  "description": "Allow users to securely save credit cards for future use",
  "type": "feature",
  "status": "in-progress",
  "priority": "high",
  "estimate": 5,
  "assignee": "dev@example.com",
  "reporter": "pm@example.com",
  "acceptanceCriteria": [
    "User can save card during checkout",
    "Card details are tokenized via Stripe",
    "User can view and delete saved cards"
  ],
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Implement card tokenization",
      "status": "done"
    }
  ],
  "testLinks": [
    {
      "id": "TEST-LINK-001",
      "testId": "TEST-001",
      "testName": "Payment Method Save Flow",
      "testType": "e2e",
      "status": "passing"
    }
  ]
}
```

### 6. Task

**Purpose**: Individual implementation task within a story  
**Timeframe**: Hours to 1-2 days  
**Owner**: Developer  

**Properties**:
- `id`: Unique identifier
- `storyId`: Parent story
- `title`: Task title
- `description`: Task description (optional)
- `status`: todo | in-progress | blocked | done
- `assignee`: Developer (optional)
- `estimatedHours`: Effort estimate
- `completedAt`: Completion timestamp

## Data Relationships

### Parent-Child Relationships

```
Portfolio
  ├── portfolioObjectiveId ← Goal.portfolioObjectiveId
  └── linkedGoals: [Goal.id, ...]

Goal
  ├── goalId ← Feature.goalId
  └── linkedFeatures: [Feature.id, ...]

Feature
  ├── featureId ← Epic.featureId
  └── linkedEpics: [Epic.id, ...]

Epic
  ├── epicId ← Story.epicId
  └── linkedStories: [Story.id, ...]

Story
  ├── storyId ← Task.storyId
  └── tasks: [Task, ...]
```

### Querying the Hierarchy

#### Get all children of a Portfolio:
```typescript
const goals = await AgileHierarchyModule.listGoals({ 
  portfolioObjectiveId: 'PORTFOLIO-001' 
});

for (const goal of goals) {
  const features = await AgileHierarchyModule.listFeatures({ 
    goalId: goal.id 
  });
  // ... continue down the hierarchy
}
```

#### Get complete lineage for a Story:
```typescript
const story = /* fetch story */;
const hierarchy = await AgileHierarchyModule.getStoryHierarchy(story);

console.log(hierarchy.portfolioObjective); // Portfolio objective
console.log(hierarchy.goal);               // Goal
console.log(hierarchy.feature);            // Feature
console.log(hierarchy.epic);               // Epic
console.log(hierarchy.story);              // Story
console.log(hierarchy.tasks);              // Tasks
console.log(hierarchy.tests);              // Test links
```

## DynamoDB Storage Schema

All entities are stored in a single DynamoDB table with the following structure:

### Primary Key Pattern:
- **PK**: `{TYPE}#{ID}` (e.g., `PORTFOLIO#PORTFOLIO-001`)
- **SK**: `METADATA`

### Global Secondary Index (GSI1 - TypeIndex):
- **GSI1PK**: `{TYPE}` (e.g., `PORTFOLIO`)
- **GSI1SK**: `{ID}` (e.g., `PORTFOLIO-001`)

### Example Item:
```json
{
  "PK": "PORTFOLIO#PORTFOLIO-001",
  "SK": "METADATA",
  "Type": "PORTFOLIO",
  "GSI1PK": "PORTFOLIO",
  "GSI1SK": "PORTFOLIO-001",
  "id": "PORTFOLIO-001",
  "name": "Digital Transformation",
  "status": "active",
  "linkedGoals": ["GOAL-001", "GOAL-002"],
  // ... other attributes
}
```

### Query Patterns:

1. **Get item by ID:**
   ```
   PK = PORTFOLIO#PORTFOLIO-001 AND SK = METADATA
   ```

2. **List all items of a type:**
   ```
   GSI1PK = PORTFOLIO (using TypeIndex)
   ```

3. **Query children by parent:**
   ```
   GSI1PK = GOAL AND filterExpression: portfolioObjectiveId = :portfolioId
   ```

## API Methods

### AgileHierarchyModule

#### Portfolio Operations:
- `createPortfolio(data)` - Create new portfolio objective
- `getPortfolio(id)` - Get portfolio by ID
- `listPortfolios(filter?)` - List all portfolios with optional filter
- `updatePortfolio(id, updates)` - Update portfolio

#### Goal Operations:
- `createGoal(data)` - Create new goal (auto-links to parent)
- `getGoal(id)` - Get goal by ID
- `listGoals(filter?)` - List goals by portfolio or status

#### Feature Operations:
- `createFeature(data)` - Create new feature (auto-links to parent)
- `getFeature(id)` - Get feature by ID
- `listFeatures(filter?)` - List features by goal or status

#### Epic Operations:
- `createEpic(data)` - Create new epic (auto-links to parent)
- `getEpic(id)` - Get epic by ID
- `listEpics(filter?)` - List epics by feature, board, or status

#### Hierarchy Operations:
- `getStoryHierarchy(story)` - Get complete hierarchy view for a story
- `getCompleteMetrics()` - Get metrics across all hierarchy levels

### DynamoDBClient

#### Hierarchy-Specific Methods:
- `queryByParent(childType, parentField, parentId)` - Query children by parent
- `getAgileHierarchy(portfolioId?, goalId?, featureId?, epicId?)` - Get hierarchy tree
- `getStoryLineage(storyId)` - Get complete lineage for a story

## Usage Examples

### Creating a Complete Hierarchy:

```typescript
// 1. Create Portfolio Objective
const portfolio = await AgileHierarchyModule.createPortfolio({
  name: 'Digital Transformation',
  description: 'Modernize our technology stack',
  status: 'active',
  owner: 'CTO',
  startDate: new Date('2026-01-01'),
  targetDate: new Date('2028-12-31'),
  keyResults: [],
  linkedGoals: [],
  metrics: {
    totalGoals: 0,
    completedGoals: 0,
    progressPercentage: 0
  },
  tags: ['strategic', 'technology']
});

// 2. Create Goal under Portfolio
const goal = await AgileHierarchyModule.createGoal({
  portfolioObjectiveId: portfolio.id,
  name: 'Payment System Modernization',
  description: 'Upgrade payment processing',
  status: 'planned',
  priority: 'high',
  owner: 'VP Engineering',
  startDate: new Date('2026-01-01'),
  targetDate: new Date('2026-06-30'),
  linkedFeatures: [],
  successCriteria: ['1000 TPS', '99.99% uptime'],
  metrics: {
    totalFeatures: 0,
    completedFeatures: 0,
    progressPercentage: 0,
    blockers: 0
  },
  tags: ['payments']
});

// 3. Create Feature under Goal
const feature = await AgileHierarchyModule.createFeature({
  goalId: goal.id,
  name: 'Stripe Integration',
  description: 'Integrate Stripe payment gateway',
  status: 'planned',
  priority: 'high',
  owner: 'Product Manager',
  linkedEpics: [],
  acceptanceCriteria: ['PCI compliant', 'Support major cards'],
  businessValue: 90,
  effort: 55,
  metrics: {
    totalEpics: 0,
    completedEpics: 0,
    totalStories: 0,
    completedStories: 0,
    totalStoryPoints: 0,
    completedStoryPoints: 0,
    progressPercentage: 0,
    testCoveragePercentage: 0,
    blockers: 0
  },
  tags: ['payments', 'integration']
});

// 4. Create Epic under Feature
const epic = await AgileHierarchyModule.createEpic({
  featureId: feature.id,
  boardId: 'BOARD-001',
  name: 'Payment Gateway Core',
  description: 'Core Stripe API integration',
  status: 'planned',
  priority: 'high',
  owner: 'Tech Lead',
  linkedStories: [],
  acceptanceCriteria: ['All API endpoints', 'Error handling'],
  estimate: 34,
  metrics: {
    totalStories: 0,
    completedStories: 0,
    totalStoryPoints: 0,
    completedStoryPoints: 0,
    progressPercentage: 0,
    testCoveragePercentage: 0,
    blockers: 0
  },
  tags: ['api', 'integration']
});

// 5. Create Story under Epic (using existing AgileModule)
// Stories are linked via epicId field
```

### Querying the Hierarchy:

```typescript
// Get all features for a goal
const features = await AgileHierarchyModule.listFeatures({ 
  goalId: 'GOAL-001' 
});

// Get all epics for a feature
const epics = await AgileHierarchyModule.listEpics({ 
  featureId: 'FEATURE-001' 
});

// Get complete hierarchy for a story
const story = { /* story data */ };
const fullHierarchy = await AgileHierarchyModule.getStoryHierarchy(story);

console.log('Portfolio:', fullHierarchy.portfolioObjective?.name);
console.log('Goal:', fullHierarchy.goal?.name);
console.log('Feature:', fullHierarchy.feature?.name);
console.log('Epic:', fullHierarchy.epic?.name);
console.log('Story:', fullHierarchy.story.title);
```

### Getting Metrics:

```typescript
const metrics = await AgileHierarchyModule.getCompleteMetrics();

console.log('Portfolio Objectives:', metrics.portfolio);
console.log('Goals:', metrics.goals);
console.log('Features:', metrics.features);
console.log('Epics:', metrics.epics);
console.log('Stories:', metrics.stories);
```

## Benefits of This Structure

1. **Complete Traceability**: Track work from strategic objectives down to individual tasks
2. **Clear Ownership**: Each level has defined owners and responsibilities
3. **Progress Tracking**: Metrics at every level for visibility
4. **Flexible Relationships**: Items can exist independently or be linked to parents
5. **Test Coverage**: Track test coverage from feature level down to stories
6. **DynamoDB Optimized**: Single-table design for efficient queries
7. **Scalable**: Hierarchy supports organizations of any size

## Next Steps

1. Integrate with existing AgileModule for story management
2. Add UI components to visualize the hierarchy
3. Implement progress roll-up calculations
4. Add automated reporting across hierarchy levels
5. Integrate with project management tools (Jira, Azure DevOps)
