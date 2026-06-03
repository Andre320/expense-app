/** Local setup: .env, Docker Postgres, deps, migrations, demo seed. */
import { execSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const envPath = path.join(root, ".env")
const envExamplePath = path.join(root, ".env.example")
const resetDb = process.argv.includes("--reset-db")

const PG18_VOLUME_CONFLICT =
  /Counter to that, there appears to be PostgreSQL data in|configured to store database data in a/i

function log(msg) {
  console.log(`[setup] ${msg}`)
}

function run(cmd, opts = {}) {
  log(cmd)
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true, ...opts })
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8", shell: true }).trim()
}

function commandExists(name) {
  try {
    if (process.platform === "win32") {
      execSync(`where ${name}`, { stdio: "ignore", shell: true })
    } else {
      execSync(`command -v ${name}`, { stdio: "ignore", shell: true })
    }
    return true
  } catch {
    return false
  }
}

function ensureEnv() {
  if (!existsSync(envPath)) {
    if (!existsSync(envExamplePath)) {
      throw new Error("Missing .env.example — cannot create .env")
    }
    copyFileSync(envExamplePath, envPath)
    log("Created .env from .env.example")
  }

  let content = readFileSync(envPath, "utf8")
  const hasSecret = /AUTH_SECRET\s*=\s*["']?[^\s"'#]+/.test(content)

  if (!hasSecret) {
    const secret = randomBytes(32).toString("base64")
    if (/^\s*AUTH_SECRET\s*=/m.test(content)) {
      content = content.replace(/^\s*AUTH_SECRET\s*=.*$/m, `AUTH_SECRET="${secret}"`)
    } else {
      content += `\nAUTH_SECRET="${secret}"\n`
    }
    writeFileSync(envPath, content, "utf8")
    log("Generated AUTH_SECRET in .env")
  }
}

const LOCAL_DATABASE_URL = "postgresql://expense:expense@localhost:5432/expense_app?schema=public"

function ensurePostgresDatabaseUrl() {
  let content = readFileSync(envPath, "utf8")
  const match = content.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\s#]+)/m)
  const url = match?.[1] ?? ""
  if (/^postgres(ql)?:\/\//i.test(url)) return

  log("DATABASE_URL is not Postgres — setting local Docker URL")
  if (/^\s*DATABASE_URL\s*=/m.test(content)) {
    content = content.replace(/^\s*DATABASE_URL\s*=.*$/m, `DATABASE_URL="${LOCAL_DATABASE_URL}"`)
  } else {
    content = `DATABASE_URL="${LOCAL_DATABASE_URL}"\n${content}`
  }
  writeFileSync(envPath, content, "utf8")
}

function postgresContainerRunning() {
  try {
    return runCapture("docker compose ps --status running -q postgres").length > 0
  } catch {
    return false
  }
}

function postgresLogsTail(lines = 40) {
  try {
    return runCapture(`docker compose logs postgres --tail ${lines}`)
  } catch {
    return ""
  }
}

function hasPg18VolumeConflict(logs) {
  return PG18_VOLUME_CONFLICT.test(logs)
}

function resetPostgresVolume() {
  log("Removing Docker volume and recreating Postgres")
  run("docker compose down -v")
}

async function startPostgres() {
  log("Ensuring Postgres is up (docker compose up -d)")
  try {
    run("docker compose up -d --wait")
    if (postgresContainerRunning()) return
  } catch {
    // --wait fails when the container exits; fall through to recovery
  }

  if (!postgresContainerRunning()) {
    const logs = postgresLogsTail()
    if (hasPg18VolumeConflict(logs)) {
      resetPostgresVolume()
      run("docker compose up -d --wait")
      if (postgresContainerRunning()) return
    }
    console.error(logs)
    throw new Error("Postgres container exited. Try: pnpm setup:reset")
  }
}

async function waitForPostgres(maxAttempts = 30) {
  for (let i = 1; i <= maxAttempts; i++) {
    if (!postgresContainerRunning()) {
      const logs = postgresLogsTail()
      if (hasPg18VolumeConflict(logs)) {
        resetPostgresVolume()
        run("docker compose up -d")
        await delay(3000)
        continue
      }
      console.error(logs)
      throw new Error("Postgres container is not running")
    }
    try {
      runCapture("docker compose exec -T postgres pg_isready -U expense -d expense_app")
      log("Postgres is ready")
      return
    } catch {
      if (i === maxAttempts) {
        console.error(postgresLogsTail())
        throw new Error("Postgres did not become ready in time")
      }
      log(`Waiting for Postgres (${i}/${maxAttempts})…`)
      await delay(2000)
    }
  }
}

function databaseInitialized() {
  try {
    const result = runCapture(
      "docker compose exec -T postgres psql -U expense -d expense_app -tAc \"SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations'\"",
    )
    return result === "1"
  } catch {
    return false
  }
}

async function main() {
  if (!commandExists("docker")) {
    throw new Error("Docker is required. Install Docker Desktop and try again.")
  }
  if (!commandExists("pnpm")) {
    throw new Error("pnpm is required. Install with: npm install -g pnpm")
  }

  ensureEnv()
  ensurePostgresDatabaseUrl()

  if (resetDb) {
    resetPostgresVolume()
  }

  await startPostgres()
  await waitForPostgres()

  if (!existsSync(path.join(root, "node_modules"))) {
    log("Installing dependencies")
    run("pnpm install")
  } else {
    log("node_modules present — skipping pnpm install")
  }

  if (!databaseInitialized()) {
    log("Applying migrations and seeding demo data")
    run("pnpm run db:setup")
  } else {
    log("Database already initialized — skipping db:setup")
  }

  console.log("")
  console.log("Ready. Start the app with:  pnpm dev")
  console.log("Demo login:  demo@example.com / demo-password-123")
  console.log("Open:  http://localhost:3000")
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
