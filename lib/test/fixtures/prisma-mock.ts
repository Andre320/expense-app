import { vi } from "vitest"

export type MockFn = ReturnType<typeof vi.fn>

export type MockModelMethods = {
  findMany?: MockFn
  findFirst?: MockFn
  findUnique?: MockFn
  findUniqueOrThrow?: MockFn
  findFirstOrThrow?: MockFn
  create?: MockFn
  update?: MockFn
  delete?: MockFn
  upsert?: MockFn
  count?: MockFn
  aggregate?: MockFn
  deleteMany?: MockFn
}

function defaultModel(): MockModelMethods {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    findUniqueOrThrow: vi.fn(),
    findFirstOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _max: {} }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  }
}

export type MockPrismaModels = Partial<{
  appSettings: MockModelMethods
  category: MockModelMethods
  transaction: MockModelMethods
  transactionTag: MockModelMethods
  tag: MockModelMethods
  incomeBonus: MockModelMethods
  savingsGoal: MockModelMethods
  savingsAccount: MockModelMethods
  savingsAccountMovement: MockModelMethods
  savingsGoalMovement: MockModelMethods
  knownStore: MockModelMethods
  rsuPlan: MockModelMethods
  rsuVest: MockModelMethods
  user: MockModelMethods
}>

export type MockPrismaClient = {
  $transaction: MockFn
} & Record<string, MockModelMethods | MockFn | undefined>

/** Minimal mock PrismaClient for service unit tests. */
export function createMockPrisma(models: MockPrismaModels = {}): MockPrismaClient {
  const client = {} as MockPrismaClient

  client.$transaction = vi.fn(async (arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: MockPrismaClient) => unknown)(client)
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg)
    }
    return arg
  }) as MockFn

  for (const [name, overrides] of Object.entries(models)) {
    client[name] = { ...defaultModel(), ...overrides }
  }

  return client
}

/** Attach a model with defaults if not already present. */
export function ensureModel(
  client: MockPrismaClient,
  name: keyof MockPrismaModels,
): MockModelMethods {
  if (!client[name as string]) {
    client[name as string] = defaultModel()
  }
  return client[name as string] as MockModelMethods
}
