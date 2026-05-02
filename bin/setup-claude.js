#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TEMPLATE_DIR = join(__dirname, '..', 'claude')

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
]

const cyan = '\x1b[36m'
const green = '\x1b[32m'
const yellow = '\x1b[33m'
const red = '\x1b[31m'
const bold = '\x1b[1m'
const reset = '\x1b[0m'

const log = (msg) => console.log(msg)
const ok = (msg) => log(`${green}  ✓${reset} ${msg}`)
const skip = (msg) => log(`${yellow}  -${reset} ${msg}`)
const fail = (msg) => log(`${red}  ✗${reset} ${msg}`)
const header = (msg) => log(`\n${bold}${cyan}${msg}${reset}`)

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function askConfirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(`${yellow}${question} [y/N]${reset} `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

function printHelp() {
  log(`${bold}create-elit-claude-project${reset} — Setup Claude agents in any repository`)
  log('')
  log(`${bold}Usage:${reset}`)
  log('  npx create elit-claude-project@latest <target> [target2 ...]')
  log('  npx create elit-claude-project@latest .                    # current directory')
  log('  npx create elit-claude-project@latest ../my-repo           # another repo')
  log('  npx create elit-claude-project@latest ../a ../b ../c       # multiple repos')
  log('')
  log(`${bold}Options:${reset}`)
  log('  -h, --help     Show this help')
  log('  -v, --version  Show version')
  log('')
  log(`${bold}What it creates:${reset}`)
  log('  .claude/agents/    11 agent definitions')
  log('  .claude/skills/    50 skill references')
  log('  .claude/memory/    11 agent memory folders')
  log('  .claude/plans/     plan storage')
  log('')
  log(`${bold}Agents:${reset}`)
  for (const a of AGENTS) log(`  ${a}`)
}

async function setup(targetPath) {
  const target = resolve(targetPath)
  const claudeDir = join(target, '.claude')

  log(`\n${bold}Claude Agents Setup${reset}`)
  log(`Target: ${target}\n`)

  if (!existsSync(target)) {
    fail(`Target directory does not exist: ${target}`)
    process.exit(1)
  }

  if (existsSync(claudeDir)) {
    const yes = await askConfirm(`.claude/ already exists at ${target}. Overwrite agents?`)
    if (!yes) { log('Cancelled.'); return }
  }

  // Agents
  header('Agents')
  const agentsDir = join(claudeDir, 'agents')
  ensureDir(agentsDir)
  let agentsCopied = 0
  for (const agent of AGENTS) {
    const src = join(TEMPLATE_DIR, 'agents', `${agent}.md`)
    const dest = join(agentsDir, `${agent}.md`)
    if (!existsSync(src)) { skip(`${agent}.md — not found`); continue }
    writeFileSync(dest, readFileSync(src))
    ok(`${agent}.md`)
    agentsCopied++
  }

  // Skills
  header('Skills')
  const skillsSrcDir = join(TEMPLATE_DIR, 'skills')
  const skillsDir = join(claudeDir, 'skills')
  ensureDir(skillsDir)
  let skillsCopied = 0
  if (existsSync(skillsSrcDir)) {
    for (const file of readdirSync(skillsSrcDir).filter(f => f.endsWith('.md'))) {
      writeFileSync(join(skillsDir, file), readFileSync(join(skillsSrcDir, file)))
      ok(file)
      skillsCopied++
    }
  }
  if (skillsCopied === 0) skip('No skill templates — folder created')

  // Memory
  header('Memory')
  const memoryDir = join(claudeDir, 'memory')
  ensureDir(memoryDir)
  for (const agent of AGENTS) {
    ensureDir(join(memoryDir, agent))
    ok(`memory/${agent}/`)
  }

  // Plans
  header('Plans')
  ensureDir(join(claudeDir, 'plans'))
  ok('plans/')

  // Summary
  header('Summary')
  log(`  Agents:  ${agentsCopied}/${AGENTS.length}`)
  log(`  Skills:  ${skillsCopied}`)
  log(`  Memory:  ${AGENTS.length} folders`)
  log(`  Plans:   ready`)
  log(`\n  ${bold}Location:${reset} ${claudeDir}`)
  log(`\n${green}${bold}Setup complete!${reset}\n`)
}

// --- CLI ---
const args = process.argv.slice(2)

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printHelp()
  process.exit(0)
}

if (args[0] === '--version' || args[0] === '-v') {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
  log(pkg.version)
  process.exit(0)
}

for (const target of args) {
  await setup(target)
}
