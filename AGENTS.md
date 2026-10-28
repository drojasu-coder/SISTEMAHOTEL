# SISTEMAHOTEL — Engineering & QA Rules

## Project mission

SISTEMAHOTEL is a hotel management backend being hardened through
aggressive integration, business-rule, financial, security and
concurrency QA.

Correctness is more important than making a test pass.

The project follows a RED -> FIX -> GREEN -> REGRESSION workflow.

---

# Golden rules

## 1. Never hide a real defect

Never modify, weaken, skip or delete a valid failing test merely to
make the suite green.

If a test exposes a real backend defect:

1. Preserve the test.
2. Reproduce the failure.
3. Record the expected result.
4. Record the actual result.
5. Identify the root cause.
6. Apply the smallest correct production fix.
7. Re-run the isolated test.
8. Run related regression tests.

---

## 2. Test database safety

Destructive or integration QA must run ONLY against:

hotel_test_db

Before running backend integration tests, confirm the output contains:

[QA DB GUARD] Base de datos detectada: hotel_test_db
[QA DB GUARD] ✅ Entorno de pruebas seguro

If another database is detected:

STOP IMMEDIATELY.

Never intentionally run destructive QA against development or
production databases.

---

## 3. Git safety

Never execute automatically:

- git push
- git push --force
- git reset --hard
- git clean -fd
- git checkout -- .
- git restore .
- force branch deletion

Do not create commits unless the user explicitly requests or approves it.

Before modifying production code always inspect:

git status
git diff

Preserve unrelated user changes.

---

## 4. Database safety

Never execute without explicit approval:

DROP DATABASE
DROP SCHEMA
TRUNCATE production/development data
destructive migrations
bulk DELETE outside the test database

Migrations must be reversible whenever reasonably possible.

---

# QA protocol

Every new potential bug should follow this sequence.

## RED phase

1. Inspect relevant controller, service, validation, model and route.
2. Formulate a concrete invariant.
3. Write a test that demonstrates the expected behavior.
4. Run only that test.
5. Confirm whether the backend violates the invariant.
6. If it fails, register a QA finding.
7. Do NOT fix production code yet when operating as a test-author.

## FIX phase

1. Read the failing test.
2. Read the relevant production path.
3. Identify the actual root cause.
4. Implement the smallest correct fix.
5. Do not weaken the test.

## GREEN phase

Run:

1. isolated failing test;
2. module test file;
3. TypeScript typecheck;
4. related module regression;
5. full backend regression at checkpoints.

---

# Current backend verification commands

From repository root:

TypeScript:

npm --prefix backend exec tsc -- --noEmit

Full backend tests:

npm --prefix backend test

Focused test file:

npm --prefix backend test -- tests/<module>/<file>.test.ts

Focused named test:

npm --prefix backend test -- tests/<module>/<file>.test.ts -t "<name>"

---

# Concurrency QA standard

Critical race-condition tests should normally use at least:

20 simultaneous requests

Use Promise.all where appropriate.

Concurrency tests must verify both:

1. HTTP responses
2. final persisted PostgreSQL state

Never consider a concurrency test complete based only on status codes.

Typical invariants:

- only one reservation wins a contested resource;
- capacity is never exceeded;
- the same reference is not duplicated;
- no double payment;
- no double refund;
- no lost update;
- no impossible state transition;
- no unexpected 500;
- database state remains serializable.

---

# API QA standards

Every important endpoint should eventually cover:

- happy path
- missing JWT
- invalid JWT where applicable
- role authorization
- ownership / IDOR
- invalid ID
- nonexistent ID
- missing fields
- extra fields
- invalid field types
- boundary values
- invalid state transitions
- business rules
- duplicate requests
- concurrency
- persistence verification

Malformed client input should normally result in controlled 4xx responses,
not 500 errors.

---

# Financial invariants

Financial values must be calculated or verified by the backend.

Never trust client-supplied:

- price
- total
- discount
- paid amount
- refund amount when derived
- financial state
- user ownership

Important invariants include:

net_paid = approved_payments - approved_refunds

net_paid must never become negative.

A reference with net approved money must not be silently recreated in a
new cart in a way that allows double charging.

A total refund may release a reference only when business rules permit it.

Financial mutations must be transaction-safe and concurrency-tested.

---

# Ownership and authorization

Never trust usuario_id provided by a client when ownership can be derived
from authentication.

Always test:

User A cannot read or modify User B resources.

Role restrictions must be enforced in both routing/middleware and service
logic where appropriate.

---

# Pricing

Prices and totals must originate from trusted backend data.

Tests may use fictitious QA prices in hotel_test_db.

Production logic must never contain special hard-coded prices solely to
make tests pass.

---

# Error handling

Expected validation and business-rule failures must return controlled
application errors.

Unexpected 500 responses during negative QA must be investigated.

Never expose sensitive stack traces, credentials or database details to
clients.

---

# Scope discipline

Do not perform broad refactors while correcting an isolated QA finding.

Prefer:

one reproduced bug
-> one focused fix
-> regression

Separate unrelated improvements into separate work.

---

# Reporting

Every confirmed defect should receive a QA identifier.

Format examples:

QA-CART-FUNC-001
QA-CART-CONC-001
QA-PAY-FIN-001
QA-AUTH-SEC-001

Record confirmed findings in:

qa/registry.yml

Never fabricate a finding.

---

# OpenCode agent responsibilities

qa-auditor:
read-only analysis.

qa-test-author:
may create or modify tests but must not fix production code.

qa-fixer:
may fix production code for an already reproduced defect but must not
weaken tests.

qa-regression:
runs verification only and does not modify source.

security-auditor:
read-only adversarial security review.

---

# Definition of done for a QA fix

A fix is not complete until:

- the defect was reproduced;
- a regression test exists;
- the isolated test passes;
- related tests pass;
- TypeScript passes;
- no unrelated behavior was intentionally changed;
- the QA registry is updated.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
- Para preguntas del Frontend usa el comando graphify query con tu pregunta entre comillas y la opción --graph Frontend/graphify-out/graph.json al final. El grafo de la raíz es solo del backend.