import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// --- Config ---
const AGENTS = [
  'project-manager',
  'software-architect',
  'backend-engineer',
  'frontend-engineer',
  'qa-tester',
  'performance-engineer',
  'security-engineer',
  'devops-platform-engineer',
  'package-library-maintainer',
  'loop-orchestrator',
  'codebase-sync',
] as const

const TEMPLATE_DIR = join(__dirname, '..', 'claude')

// --- Helpers ---
const cyan = '\x1b[36m'
const green = '\x1b[32m'
const yellow = '\x1b[33m'
const red = '\x1b[31m'
const bold = '\x1b[1m'
const reset = '\x1b[0m'

function log(msg: string) {
  console.log(msg)
}

function logSuccess(msg: string) {
  log(`${green}  ✓${reset} ${msg}`)
}

function logSkip(msg: string) {
  log(`${yellow}  -${reset} ${msg}`)
}

function logError(msg: string) {
  log(`${red}  ✗${reset} ${msg}`)
}

function logHeader(msg: string) {
  log(`\n${bold}${cyan}${msg}${reset}`)
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

async function askConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(`${yellow}${question} [y/N]${reset} `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

// --- Main ---
async function setup(targetPath: string) {
  const target = resolve(targetPath)
  const claudeDir = join(target, '.claude')

  log(`\n${bold}Claude Agents Setup${reset}`)
  log(`Target: ${target}\n`)

  // Check target exists
  if (!existsSync(target)) {
    logError(`Target directory does not exist: ${target}`)
    process.exit(1)
  }

  // Check if .claude already exists
  if (existsSync(claudeDir)) {
    const confirmed = await askConfirm(`.claude/ already exists at ${target}. Overwrite agents?`)
    if (!confirmed) {
      log('Cancelled.')
      return
    }
  }

  // --- Step 1: Copy agent templates ---
  logHeader('Agents')
  const agentsDir = join(claudeDir, 'agents')
  ensureDir(agentsDir)

  let agentsCopied = 0
  for (const agent of AGENTS) {
    const src = join(TEMPLATE_DIR, 'agents', `${agent}.md`)
    const dest = join(agentsDir, `${agent}.md`)

    if (!existsSync(src)) {
      logSkip(`${agent}.md — template not found, skipping`)
      continue
    }

    writeFileSync(dest, readFileSync(src))
    logSuccess(`${agent}.md`)
    agentsCopied++
  }

  // --- Step 2: Copy skill files ---
  logHeader('Skills')
  const skillsSrcDir = join(TEMPLATE_DIR, 'skills')
  const skillsDir = join(claudeDir, 'skills')
  ensureDir(skillsDir)

  let skillsCopied = 0
  if (existsSync(skillsSrcDir)) {
    const skillFiles = readdirSync(skillsSrcDir).filter((f) => f.endsWith('.md'))
    for (const file of skillFiles) {
      const src = join(skillsSrcDir, file)
      const dest = join(skillsDir, file)
      writeFileSync(dest, readFileSync(src))
      logSuccess(`${file}`)
      skillsCopied++
    }
  }

  if (skillsCopied === 0) {
    logSkip('No skill templates found — folder created for manual addition')
  }

  // --- Step 3: Create memory folders ---
  logHeader('Memory')
  const memoryDir = join(claudeDir, 'memory')
  ensureDir(memoryDir)

  for (const agent of AGENTS) {
    const dir = join(memoryDir, agent)
    ensureDir(dir)
    logSuccess(`memory/${agent}/`)
  }

  // --- Step 4: Create plans folder ---
  logHeader('Plans')
  const plansDir = join(claudeDir, 'plans')
  ensureDir(plansDir)
  logSuccess('plans/')

  // --- Summary ---
  logHeader('Summary')
  log(`  Agents:  ${agentsCopied}/${AGENTS.length}`)
  log(`  Skills:  ${skillsCopied}`)
  log(`  Memory:  ${AGENTS.length} agent folders`)
  log(`  Plans:   ready`)
  log(`\n  ${bold}Location:${reset} ${claudeDir}`)
  log(`\n${green}${bold}Setup complete!${reset}\n`)
}

// --- CLI ---
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    log(`${bold}Usage:${reset}`)
    log(`  npx tsx scripts/setup-claude.ts <target-path>`)
    log(`  npx tsx scripts/setup-claude.ts .           # current directory`)
    log(`  npx tsx scripts/setup-claude.ts ../my-repo  # another repo`)
    log('')
    log(`${bold}Options:${reset}`)
    log(`  --help, -h    Show this help`)
    process.exit(0)
  }

  if (args[0] === '--help' || args[0] === '-h') {
    log(`${bold}Claude Agents Setup${reset}`)
    log('')
    log('Sets up .claude/ directory with agents, memory, plans, and skills.')
    log('')
    log(`${bold}Usage:${reset}`)
    log(`  npx tsx scripts/setup-claude.ts <target-path> [<target-path-2> ...]`)
    log('')
    log(`${bold}Agents included:${reset}`)
    for (const agent of AGENTS) {
      log(`  - ${agent}`)
    }
    process.exit(0)
  }

  for (const target of args) {
    await setup(target)
  }
}

main().catch((err) => {
  logError(err.message)
  process.exit(1)
})
