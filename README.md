# elit-claude-project

CLI สำหรับติดตั้ง Claude agents ลงใน repo ใด ๆ พร้อมระบบ multi-agent ที่ช่วยวางแผน ออกแบบ พัฒนา ทดสอบ และ deploy อัตโนมัติ

## ติดตั้ง

```bash
# เข้าไปใน repo ที่ต้องการ setup
cd my-project

# รัน setup (ติดตั้งแบบไม่ต้อง install)
npx create elit-claude-project@latest .
```

ผลลัพธ์ที่ได้:

```
.claude/
├── agents/          11 agent definitions
├── skills/          50 skill references
├── memory/          11 agent memory folders
└── plans/           plan storage
```

## วิธีใช้งาน

### Step 1: Sync repo ให้เป็นข้อมูลล่าสุด

ก่อนเริ่มงานทุกครั้ง ให้ sync ข้อมูล repo ให้ agent ทุกตัวรับรู้โค้ดปัจจุบัน

```
> สั่ง agent codebase-sync ให้ sync repo ให้เป็นข้อมูลล่าสุด
```

codebase-sync จะอ่านโค้ดทั้ง repo แล้วเขียน memory ให้ agent ทุกตัว เช่น:
- backend-engineer จะรู้ว่ามี endpoint อะไรบ้างแล้ว
- frontend-engineer จะรู้ว่ามี component อะไรบ้างแล้ว
- qa-tester จะรู้ว่ามี test อะไรแล้ว และขาดอะไร

---

### Step 2: เล่า idea ให้ PM agent

เล่าสิ่งที่อยากทำให้ PM agent จะวางแผนให้

```
> ช่วยวางแผนสร้างระบบ quotation ที่มี CRUD, status flow (draft → sent → approved → rejected), และ PDF export
```

PM agent จะ:
1. ถามคำถามกระจ่างถ้ามีอะไรไม่ชัดเจน
2. แตก task เป็นหัวข้อใหญ่ พร้อมระบุว่ามอบหมายให้ agent ไหน
3. บันทึก master plan ไว้ที่ `.claude/plans/`
4. ขอ confirm ก่อนเริ่มงาน

---

### Step 3: สั่ง software-architect ออกแบบ

PM วางแผนเสร็จแล้ว สั่ง architect อ่าน plan แล้วออกแบบ

```
> สั่ง agent software-architect เริ่มทำงานตาม plan ของ PM
```

software-architect จะ:
1. อ่าน master plan จาก `.claude/plans/`
2. อ่าน memory จาก codebase-sync ว่า repo ตอนนี้เป็นยังไง
3. ออกแบบ architecture — API contracts, component hierarchy, data model, auth model
4. สร้าง sub-task ของตัวเอง โดยยังคงหัวข้อใหญ่ของ PM ไว้
5. บันทึก design spec ไว้ที่ `.claude/plans/`

---

### Step 4: สั่ง backend + frontend เริ่มพัฒนา

Architect ออกแบบเสร็จแล้ว สั่ง engineer เริ่ม implement

```
> สั่ง agent backend-engineer เริ่มทำงานตาม design ของ architect
> สั่ง agent frontend-engineer เริ่มทำงานตาม design ของ architect
```

backend-engineer จะ:
1. อ่าน master plan จาก PM
2. อ่าน design spec จาก architect
3. สร้าง sub-task ของตัวเอง — schema → service → route → test
4. implement ตามลำดับ พร้อม security checklist
5. ส่ง API contract กลับให้ PM รู้

frontend-engineer จะ:
1. อ่าน master plan จาก PM
2. อ่าน design spec จาก architect + API contract จาก backend
3. สร้าง sub-task ของตัวเอง — shared components → pages → forms → routing
4. implement ตามลำดับ พร้อมทุก state (loading, error, empty, happy)
5. ส่ง component summary กลับให้ PM รู้

---

### Step 5: สั่ง QA ทดสอบ

Engineers implement เสร็จแล้ว สั่ง QA ตรวจสอบ

```
> สั่ง agent qa-tester เริ่มทดสอบงานที่ backend และ frontend เสร็จแล้ว
```

qa-tester จะ:
1. อ่าน master plan จาก PM
2. อ่าน implementation plans จาก backend + frontend
3. อ่านโค้ดจริงที่ engineer เขียน เพื่อเข้าใจว่าต้องเทสอะไร
4. สร้าง sub-task ตาม testing pyramid — unit 60% → integration 30% → e2e 10%
5. เขียน test และรัน
6. ถ้าเจอ bug → รายงาน PM → PM ส่งกลับให้ engineer แก้
7. ส่ง coverage summary กลับให้ PM

---

## ภาพรวม workflow

```
┌──────────────┐
│  User idea   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌─────────────────┐
│ codebase-sync │────▶│ update memory    │
│ (อ่าน repo)   │     │ ทุก agent       │
└──────────────┘     └─────────────────┘
       │
       ▼
┌──────────────┐     ┌─────────────────┐
│ project-     │────▶│ master plan      │
│ manager      │     │ .claude/plans/   │
│ (วางแผน)     │     └─────────────────┘
└──────────────┘
       │
       ▼
┌──────────────┐     ┌─────────────────┐
│ software-    │────▶│ design spec      │
│ architect    │     │ .claude/plans/   │
│ (ออกแบบ)     │     └─────────────────┘
└──────────────┘
       │
       ├──────────────┐
       ▼              ▼
┌──────────┐   ┌───────────┐
│ backend  │   │ frontend  │
│ engineer │   │ engineer  │
│ (server) │   │ (client)  │
└────┬─────┘   └─────┬─────┘
     │               │
     └───────┬───────┘
             ▼
      ┌──────────┐
      │ qa-tester│
      │ (ทดสอบ) │
      └────┬─────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌─────────┐ ┌──────────┐
│security │ │performance│
│ (audit) │ │ (optimize)│
└─────────┘ └──────────┘
     │            │
     └─────┬──────┘
           ▼
    ┌────────────┐     ┌─────────────────┐
    │ devops-    │────▶│ deployed         │
    │ platform   │     │ staging → prod   │
    └────────────┘     └─────────────────┘
           │
           ▼
    ┌────────────────┐
    │ package-library │
    │ (publish npm)   │
    └────────────────┘
```

## ทำซ้ำเมื่อไหร่

| เหตุการณ์ | สั่งอะไร |
|----------|---------|
| เริ่ม sprint ใหม่ | `codebase-sync` → `project-manager` |
| เพิ่ม feature ใหม่ | `project-manager` วางแผน → ตาม step 2-5 |
| repo เปลี่ยนแปลงมาก | `codebase-sync` sync ใหม่ |
| เจอ bug | `project-manager` → `qa-tester` → ส่งให้ engineer แก้ |
| ต้อง deploy | `devops-platform-engineer` |
| ต้อง publish | `package-library-maintainer` |

## Agent ทั้ง 11 ตัว

| Agent | หน้าที่ | ทำงานเมื่อ |
|-------|--------|-----------|
| project-manager | วางแผน มอบหมาย ติดตาม รายงาน | รับ idea จาก user |
| software-architect | ออกแบบ architecture, API contracts | PM วางแผนเสร็จ |
| backend-engineer | implement API, services, database | Architect ออกแบบเสร็จ |
| frontend-engineer | implement UI, components, pages | Architect + Backend เสร็จ |
| qa-tester | เขียน test, หา bug, verify | Backend + Frontend implement เสร็จ |
| performance-engineer | optimize ความเร็ว, bundle, queries | QA verify เสร็จ |
| security-engineer | audit ช่องโหว่, OWASP compliance | QA verify เสร็จ |
| devops-platform-engineer | setup CI/CD, Docker, deploy | Security + Performance เสร็จ |
| package-library-maintainer | version bump, publish npm | ทุกอย่างเสร็จ + QA pass |
| loop-orchestrator | จัดการ workflow ซับซ้อน, batch jobs | ต้องการ multi-step automation |
| codebase-sync | อ่าน repo, update memory ทุก agent | เริ่ม sprint ใหม่ หรือ repo เปลี่ยนมาก |

## Memory

แต่ละ agent มี memory ของตัวเองที่ `.claude/memory/{agent-name}/` เก็บ:
- `user-*.md` — การตั้งค่าของ user
- `feedback-*.md` — สิ่งที่ใช้ได้/ไม่ได้
- `project-*.md` — สถานะปัจจุบัน
- `reference-*.md` — ข้อมูลอ้างอิง

รัน `codebase-sync` เพื่อ refresh memory ทุก agent ให้ตรงกับ repo ปัจจุบัน
