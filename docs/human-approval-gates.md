# Human Approval Gates

The core product stance is: AI can organize decision material, but humans and existing manufacturing processes remain responsible for consequential decisions.

## Gate model

```text
AI output
  -> explanation / evidence / candidate checks
  -> responsible human review
  -> existing approval process
  -> action and audit trail
```

## Gates represented in the app

| Gate | AI may support | Human must decide | Evidence to keep |
|---|---|---|---|
| Safety | past incidents, hazards, checklists | work permission, evacuation, restart | procedure, confirmer, time, corrective action |
| Quality / shipment | inspection context, similar defects, corrective-action history | QA judgement, shipment approval, customer explanation | inspection value, standard, approver, version, judgement basis |
| Line stop / restart | equipment state, abnormal trend, similar recovery case | stop/restart execution and field command | alarms, recovery procedure, responsible judgement, restart condition |
| Equipment control | read-only monitoring, anomaly detection, candidate condition | PLC/DCS writes, control changes, emergency response | role, permission, log, change approval, rollback |
| Production plan | material delay, capacity, stock, due-date impact, alternatives | plan change, customer coordination, field load adjustment | alternative plan, constraints, KPI impact, approver, communication history |

## Where the app reinforces this

- `decisionAuthority.ts` makes responsibility boundaries explicit.
- `scenarios.ts` contrasts safer stakeholder responses with overpromising responses.
- `trainingQuestions.ts` includes responsibility-boundary text and unsafe answer patterns.
- `auditQuestionData.ts` checks for dangerous expressions such as AI replacing quality assurance or final line decisions.
- README and publication docs state that the app is not connected to production equipment or real factory systems.

## Recruiter-facing value

This shows the ability to design AI-adjacent software with domain risk in mind, not just UI screens. In manufacturing contexts, this is often more important than a flashy model demo.
