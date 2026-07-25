/**
 * English overlays for the small and medium domain datasets, keyed by existing IDs.
 * The Japanese source files are never modified.
 *
 * Terminology is kept deliberately specific: shipment release rather than "approval",
 * line stop rather than "downtime", first-pass yield rather than "efficiency". Where the
 * Japanese text draws a boundary around safety, quality assurance, shipment, or line
 * stop, the English keeps that boundary rather than softening it.
 */

export interface ScenarioEn {
  stakeholder: string;
  concern: string;
  reason: string;
  goodResponse: string;
  poorResponse: string;
  aiTalentTrap: string;
  agreedGoal: string;
  nextQuestions: string[];
}

export const scenariosEn: Record<string, ScenarioEn> = {
  "sc-plant-manager": {
    stakeholder: "Plant manager",
    concern: "Will it disrupt the floor, and will it affect safety or quality?",
    reason:
      "They are accountable for safety, quality, delivery, and cost across the whole plant.",
    goodResponse:
      "We start by searching past trouble reports and organising information during abnormalities, not with control or shipment release. The final call on safety and quality stays with the existing accountable owner by design.",
    poorResponse: "AI can make everything more efficient.",
    aiTalentTrap:
      "Leading with plant-wide optimisation and automation, and only later addressing the safety, quality, and delivery accountability that the plant manager carries.",
    agreedGoal:
      "Start with organising information and shortening first response during abnormalities — not control or shipment release — and agree on a scope that supports the accountable owner's decision.",
    nextQuestions: [
      "Which decision time do you want to shorten first: first response to a stoppage, quality confirmation, or delivery impact?",
      "Who is the accountable owner who makes the final call after seeing the AI output?",
      "When there is safety or quality impact, which existing process does it return to?",
    ],
  },
  "sc-qa": {
    stakeholder: "Quality assurance",
    concern: "If the AI's basis is unclear, we cannot answer an audit.",
    reason: "Quality assurance carries the accountability and the evidence trail.",
    goodResponse:
      "AI does not decide shipment release; it organises inspection results, past defects, and corrective actions. The final judgement and the record stay in the existing quality-assurance process.",
    poorResponse: "Just trust the AI's judgement.",
    aiTalentTrap:
      "Emphasising accuracy and output quality while giving too little weight to audit evidence, approvals, and version control.",
    agreedGoal:
      "Place AI as an evidence-organising role that makes inspection results, past defects, and corrective actions easier to find — not as a substitute for the quality-assurance judgement.",
    nextQuestions: [
      "Which sources, versions, and approvers must remain on record for an audit?",
      "Who confirms information bearing on shipment release after the AI produces it?",
      "When a candidate is presented incorrectly, where is the correction recorded?",
    ],
  },
  "sc-production-engineering": {
    stakeholder: "Production engineering",
    concern: "Does it understand our process conditions and equipment constraints?",
    reason: "They are accountable for process design and stable volume production.",
    goodResponse:
      "After confirming process conditions, equipment capability, and standard work, AI is used to organise improvement candidates and candidate causes of abnormalities. Decisions on process changes follow the existing process.",
    poorResponse: "We will determine the optimal conditions automatically from the data.",
    aiTalentTrap:
      "Leading with data optimisation without asking enough about process conditions, equipment constraints, and the change-approval process.",
    agreedGoal:
      "Place AI in the role of organising candidate causes, improvement options, and validation criteria — not deciding process conditions automatically.",
    nextQuestions: [
      "What approval process is required to change a process condition?",
      "Are there equipment constraints or standard work the model does not see?",
      "When validating a candidate, is the KPI yield, OEE, or process capability?",
    ],
  },
  "sc-maintenance": {
    stakeholder: "Maintenance",
    concern: "Will false alarms increase the inspection load?",
    reason: "Maintenance resources are limited, and a stoppage decision carries real consequences.",
    goodResponse:
      "Predictive maintenance is not there to generate more alarms; it helps prioritise the equipment with the highest stoppage risk. Recording false alarms and reviewing thresholds are part of the operating design.",
    poorResponse: "AI will prevent failures.",
    aiTalentTrap:
      "Talking only about failure-prediction performance, without accounting for the inspection load created by false alarms or the weight of a stoppage decision.",
    agreedGoal:
      "Place AI as maintenance support that organises inspection priority, early signs, and past recovery cases — not as a guarantee against failure.",
    nextQuestions: [
      "Which costs more in shop-floor workload and stoppage loss: a missed failure or a false alarm?",
      "Who performs the first check after an alarm, and who decides on inspection?",
      "Through which routine are thresholds reviewed and false alarms recorded?",
    ],
  },
  "sc-it-dx": {
    stakeholder: "IT / information systems",
    concern: "Security, access control, and the impact on existing systems are the concern.",
    reason:
      "They are accountable for system operations, security, access control, and integration with the existing environment.",
    goodResponse:
      "We define the connection method, data scope, access control, logging, and support model early. For OT, we start with read-only access.",
    poorResponse: "It's only a PoC, so we will think about security later.",
    aiTalentTrap:
      "Prioritising PoC speed, so that access control, logging, existing-system impact, and OT connection conditions are left to a later phase.",
    agreedGoal:
      "Define the connection method, data scope, access control, logging, and support ownership at least minimally from the PoC stage.",
    nextQuestions: [
      "Which data may the PoC access, and which is off limits?",
      "What access control, logging, and support model are needed for regular operation?",
      "Can OT access be separated into read-only access and possible write access?",
    ],
  },
  "sc-line-leader": {
    stakeholder: "Line team leader",
    concern: "It will add work, and it will not fit how the floor actually operates.",
    reason:
      "Team leaders run daily operations and the first response when something goes wrong.",
    goodResponse:
      "Rather than adding data entry, we design it to cut time spent searching and time spent confirming during abnormalities. We trial it inside the existing handover and procedures.",
    poorResponse: "The floor will get used to it.",
    aiTalentTrap:
      "Treating adoption as something the floor should absorb, without first checking the daily work flow or the data-entry burden.",
    agreedGoal:
      "Trial it on a path that reduces search time, confirmation time, and handover load — not one that adds new data-entry load.",
    nextQuestions: [
      "What information does the floor currently spend the most time looking for?",
      "Where does it fit most naturally: the existing handover, the daily report, or the abnormality procedure?",
      "How will you determine why users stop using it: data-entry burden, lack of trust, or the user flow?",
    ],
  },
  "sc-operator": {
    stakeholder: "Operator",
    concern: "Am I being monitored?",
    reason: "If AI looks like an appraisal tool, it will not get used.",
    goodResponse:
      "The purpose is not individual appraisal; it is to make procedure checks and reference material easier to reach when you are stuck. It is there to reduce the time spent uncertain.",
    poorResponse: "We will use AI to see which operators are good.",
    aiTalentTrap:
      "Focusing on what can be analysed from behavioural data, while giving too little weight to the fear of being monitored and to fairness.",
    agreedGoal:
      "Position it as support for procedure checks, training, and reference when stuck — not as individual appraisal.",
    nextQuestions: [
      "Does the stated purpose shown to operators read as support rather than appraisal?",
      "If individual data is handled, are the viewing rights and the purpose of use explicit?",
      "To let operators use it without concern, what will you state is *not* recorded?",
    ],
  },
  "sc-executive": {
    stakeholder: "Executive management",
    concern: "Will it deliver a return, and can it scale to other sites?",
    reason: "They allocate capital and weigh risk from a company-wide view.",
    goodResponse:
      "First we confirm KPI improvement in a limited area, then organise the data, procedures, and operations that can be made common. On that basis we judge whether to roll it out.",
    poorResponse: "It has a future, so we should invest heavily.",
    aiTalentTrap:
      "Talking about technical promise while leaving the KPIs, rollout conditions, and risks that an investment decision needs undefined.",
    agreedGoal:
      "Confirm KPI improvement and operational feasibility in a limited area, and separate what can be made common from what needs site-by-site validation.",
    nextQuestions: [
      "For the investment decision, is the KPI time saved, defect rate, downtime, or training duration?",
      "On rollout, which data, procedures, and training material can be made common?",
      "Before the next investment decision, which risks should be closed out?",
    ],
  },
};

export interface FrictionEn {
  term: string;
  plain: string;
  aiSideMeaning: string;
  manufacturingRisk: string;
  alignmentDefinition: string;
  expertQuestion: string;
}

export const frictionsEn: Record<string, FrictionEn> = {
  accuracy: {
    term: "Accuracy",
    plain: "How often the AI's prediction or classification is right.",
    aiSideMeaning:
      "Tends to be read as a model evaluation metric — accuracy, F1, AUC, recall.",
    manufacturingRisk:
      "On the floor the weighting changes depending on whether a miss leads to a defect escape, or a false positive adds inspection load.",
    alignmentDefinition:
      "Agree on it as an evaluation that separates misses, false positives, confirmation effort, and quality impact — not as a single accuracy figure.",
    expertQuestion:
      "For this use, which matters more — a miss or a false positive? How does an error that leads to a defect escape show up in the evaluation metric?",
  },
  "data-exists": {
    term: "We have the data",
    plain: "Records, tables, forms, or sensor values exist.",
    aiSideMeaning:
      "Tends to be heard as: usable input data exists for training, search, or analysis.",
    manufacturingRisk:
      "Without timestamps, lots, process steps, equipment, and inspection results linked together, it is weak for cause analysis or decision support.",
    alignmentDefinition:
      "Separate data that exists from data usable for the AI purpose, and confirm join keys, granularity, gaps, and update frequency.",
    expertQuestion:
      "Is this data linked through to lot, process step, timestamp, and quality result? If not, which key needs to be established first?",
  },
  automation: {
    term: "Automation",
    plain:
      "Replacing part of a person's work or judgement with a machine or a system.",
    aiSideMeaning:
      "Tends to be described as one continuum from suggesting candidates through automatic judgement to automatic execution.",
    manufacturingRisk:
      "Conflating quality judgement, shipment release, line stop and restart, and equipment control collapses the responsibility boundary.",
    alignmentDefinition:
      "Separate suggesting candidates, decision support, automatic judgement, and automatic execution into stages, and agree where the human approval gate stays.",
    expertQuestion:
      "How far does automation go here — suggesting candidates, automatic judgement, or automatic execution? Where do the approval points touching safety and quality remain?",
  },
  "poc-success": {
    term: "PoC success",
    plain:
      "A limited-scope trial has confirmed the effect or the feasibility.",
    aiSideMeaning:
      "Tends to be treated as success once model accuracy or the demo behaves well.",
    manufacturingRisk:
      "Regular operation additionally needs access rights, logging, operational accountability, data refresh, adoption on the floor, and audit readiness.",
    alignmentDefinition:
      "Define PoC success to include KPI improvement, the situations of use, the responsibility split, and validation of the conditions for regular operation — not accuracy alone.",
    expertQuestion:
      "Is this PoC only validating accuracy, or does its scope also include regular operation, access rights, logging, the accountable owner, and the KPI?",
  },
  "real-time": {
    term: "Real time",
    plain:
      "Acquiring and processing information close to the moment the situation changes.",
    aiSideMeaning: "Tends to be described as processing speed in seconds or milliseconds.",
    manufacturingRisk:
      "The time granularity actually needed differs greatly with the process cycle, the safety margin, and how the person confirming works.",
    alignmentDefinition:
      "Decide first within how many seconds the information is meaningful for the decision, and which decision it serves.",
    expertQuestion:
      "What real-time requirement does this use actually have, in seconds? Is that interval meaningful against the process cycle and the safety confirmation?",
  },
  "root-cause": {
    term: "Root cause",
    plain: "The underlying cause that produced the problem.",
    aiSideMeaning:
      "Strongly correlated features or estimated causes tend to be described as close to root cause.",
    manufacturingRisk:
      "Without checking equipment conditions, materials, work, engineering changes, and inspection variation on the floor, it leads to the wrong countermeasure.",
    alignmentDefinition:
      "Place AI in the role of organising candidate causes and the order of checks, not confirming root cause.",
    expertQuestion:
      "Does the model output a confirmed root cause or candidate causes? How will you design the order of checks on the floor?",
  },
};

export interface DialogueEn {
  phase: string;
  weakQuestion: string;
  strongQuestion: string;
  whyItWorks: string;
}

export const dialoguesEn: Record<string, DialogueEn> = {
  purpose: {
    phase: "Framing the problem",
    weakQuestion: "What can this AI do?",
    strongQuestion:
      "Whose work decision is this AI meant to improve, and against which KPI?",
    whyItWorks:
      "Turns technical possibility back into the business problem, the work, and the KPI a consultant can act on.",
  },
  data: {
    phase: "Checking the data",
    weakQuestion: "Can we do AI with this data?",
    strongQuestion:
      "Is this data linked through to timestamp, lot, process step, equipment, and quality result? Where are the gaps and the variation in recording granularity?",
    whyItWorks:
      "Establishes the data-connection preconditions that come before the model, and keeps a PoC from being over-trusted.",
  },
  metric: {
    phase: "Designing the evaluation",
    weakQuestion: "What is the accuracy?",
    strongQuestion:
      "Which is heavier in the work — a miss or a false positive? How do defect escapes and inspection load show up in the evaluation metric?",
    whyItWorks:
      "Converts AI metrics into shop-floor loss, quality risk, and operating load.",
  },
  operation: {
    phase: "Designing the operation",
    weakQuestion: "Can we use it in production?",
    strongQuestion:
      "Who looks at the AI output, when, on which screen, and inside which existing procedure do they confirm, correct, and record it?",
    whyItWorks:
      "Moves the conversation from accuracy validation to adoption, accountability, and the improvement cycle.",
  },
  authority: {
    phase: "Responsibility boundary",
    weakQuestion: "Can we automate it with AI?",
    strongQuestion:
      "Can you separate what AI produces, what AI does not decide, who holds final decision authority, and what record is kept for an audit?",
    whyItWorks:
      "Even with an advanced technical proposal, it returns safety, quality, and shipment release to people and the process.",
  },
};

export interface AuthorityEn {
  area: string;
  aiRole: string;
  humanRole: string;
  evidenceToLeave: string;
}

export const authorityEn: Record<string, AuthorityEn> = {
  safety: {
    area: "Safety decisions",
    aiRole:
      "Presents past cases, hazard sources, points to check, and similar near-miss reports.",
    humanRole:
      "Whether work may proceed, whether to evacuate, and whether to restart are decided by the accountable owner and the existing safety process.",
    evidenceToLeave:
      "The procedures referenced, who confirmed, the time of the decision, and the record of the corrective or stop instruction.",
  },
  quality: {
    area: "Quality and shipment release",
    aiRole:
      "Organises inspection results, past defects, corrective actions, and similar lots.",
    humanRole:
      "The quality-assurance judgement, shipment release, and the explanation to the customer stay in the quality-assurance process.",
    evidenceToLeave:
      "Inspection values, acceptance criteria, the approver, the version, and the basis for the shipment-release decision.",
  },
  "line-stop": {
    area: "Line stop and restart",
    aiRole:
      "Presents equipment state, abnormality trends, the affected scope, and past recovery cases.",
    humanRole:
      "The decision to stop or restart, direction on the floor, and safety confirmation are carried out by the accountable owner.",
    evidenceToLeave:
      "Alarms, the recovery procedure, the checklist, the owner's decision, and the conditions for restart.",
  },
  "equipment-control": {
    area: "Equipment control",
    aiRole:
      "Starts from reading, monitoring, anomaly detection, and suggesting candidate conditions.",
    humanRole:
      "Any write access to a PLC or DCS, control change, or emergency action requires an explicit approval process.",
    evidenceToLeave:
      "Access rights, logs, change approval, the rollback procedure, and the emergency-stop response.",
  },
  "production-plan": {
    area: "Production plan changes",
    aiRole:
      "Organises material delays, capacity, inventory, delivery impact, and alternatives.",
    humanRole:
      "Plan changes, customer coordination, and balancing load on the floor stay with production control and management.",
    evidenceToLeave:
      "Alternatives, constraints, the KPIs affected, the approver, and the contact and coordination history.",
  },
};

export interface DrillEn {
  title: string;
  thirtySecondAnswer: string;
  threeMinuteAnswer: string;
  keywords: string[];
  caution: string;
}

export const drillsEn: Record<string, DrillEn> = {
  "ex-erp-mes": {
    title: "The difference between ERP and MES",
    thirtySecondAnswer:
      "ERP is the enterprise-wide system that manages orders, accounting, inventory, and costing. MES is the plant-level execution system that manages work orders, production records, process steps, and lots.",
    threeMinuteAnswer:
      "ERP sits close to management, the business, procurement, inventory, and accounting. MES handles what was made, at which process step, as which lot, on which equipment. In an AI initiative, looking only at ERP hides second-by-second and step-by-step change on the floor; looking only at MES makes the relationship to orders, inventory, and cost hard to see. To explain a delivery delay or a quality problem, you need to connect ERP's plan and inventory information with MES's actuals and lot information. In practice item IDs, timestamps, and lots are often not linked — and that is the thing to check before starting an AI initiative.",
    keywords: ["Management and planning", "Plant execution", "Granularity gap", "Lot", "Inventory"],
    caution: "Do not claim ERP alone reveals shop-floor causes.",
  },
  "ex-mes-mom": {
    title: "The difference between MES and MOM",
    thirtySecondAnswer:
      "MES is the system that manages manufacturing execution. MOM is the broader framing that also covers production, quality, maintenance, and inventory across plant operations.",
    threeMinuteAnswer:
      "MES sits at the centre of manufacturing execution: work orders, actuals collection, process progress, lot management. MOM is broader — a way of framing plant operations that takes in quality, maintenance, inventory, and performance management as well as production. In an AI initiative, a MOM approach connects not only MES data but also QMS quality information, CMMS maintenance history, and SCADA equipment state, in order to support decisions across the plant. Because the scope MOM covers differs by company and system landscape, confirm in conversation what the other side means by it.",
    keywords: ["Manufacturing execution", "Plant operations", "Quality", "Maintenance", "Scope difference"],
    caution: "Do not push MOM as a fixed definition.",
  },
  "ex-plm-qms": {
    title: "How PLM and QMS relate",
    thirtySecondAnswer:
      "PLM handles design, BOM, and change management; QMS handles quality, audits, and corrective actions. In an AI initiative both matter, because you need to trace how an engineering change affected a quality problem.",
    threeMinuteAnswer:
      "PLM manages product design information, BOMs, specification changes, and engineering changes. QMS manages defects, audits, corrective actions, and quality records. In manufacturing, a quality problem can originate not only in shop-floor work but in an engineering change, a material change, or a process change. If you are doing quality analysis, you need to connect QMS defect information with PLM engineering-change history and BOM changes. The important framing is that AI does not settle the quality judgement — it organises the material that design, manufacturing, and quality use to confirm it.",
    keywords: ["Engineering change", "BOM", "Defects", "Corrective action", "Evidence"],
    caution: "Do not say AI settles the quality judgement.",
  },
  "ex-it-ot": {
    title: "The difference between IT and OT",
    thirtySecondAnswer:
      "IT is the domain handling business information; OT is the domain handling equipment and control. In OT, safety and continuity of operation matter especially.",
    threeMinuteAnswer:
      "IT covers ERP, reporting, databases, accounts, and business systems. OT is the technology domain that actually runs the plant: PLC, SCADA, DCS, equipment, lines. In an AI initiative, analysing IT data is comparatively straightforward, but connecting to OT requires careful review of equipment stoppage, safety, and quality impact. Writes to PLC or DCS and automatic operation carry high risk in particular, so it is realistic to begin with reading, monitoring, anomaly detection, and presenting decision inputs. Make access rights, logging, the connection method, and the human confirmation step explicit.",
    keywords: ["Business information", "Equipment control", "Availability", "Read-only", "Access rights"],
    caution: "Do not treat OT as an extension of ordinary business-system integration.",
  },
  "ex-pe-pc": {
    title: "The difference between production engineering and production control",
    thirtySecondAnswer:
      "Production engineering owns how it is made; production control owns what is made, when, and how much.",
    threeMinuteAnswer:
      "Production engineering covers process design, equipment introduction, processing conditions, production ramp-up, and process improvement — building a process that can make the product consistently. Production control builds the production plan while watching demand, inventory, delivery dates, equipment load, and labour, and coordinates changes. In an AI initiative, for production engineering, frame it as anomaly analysis and improvement support grounded in process conditions and equipment constraints; for production control, frame it as organising the impact of plan changes when materials are delayed or equipment stops. Both are involved, but they watch different KPIs and hold different accountability.",
    keywords: ["How it is made", "What is made when", "Process conditions", "Delivery", "Inventory"],
    caution: "Do not treat the two functions as having the same concern.",
  },
  "ex-qa-qc": {
    title: "The difference between quality assurance and quality control",
    thirtySecondAnswer:
      "Quality assurance is accountable for customer guarantees, audits, and shipped quality; quality control performs in-process inspection, measurement, and analysis.",
    threeMinuteAnswer:
      "Quality control measures and analyses quality in process, watching defect rate, ppm, first-pass yield, and control charts. Quality assurance holds accountability for the quality guarantee to the customer, audits, shipment release, recurrence prevention, and the quality system. In an AI initiative, describe it to quality control as defect-cause analysis and anomaly detection, and to quality assurance as evidence organisation and recurrence-prevention support. Avoid any wording that puts shipment release or the final quality-assurance judgement on AI alone; human confirmation and approval are the premise.",
    keywords: ["Customer guarantee", "Audit", "In-process quality", "ppm", "Approval"],
    caution: "Avoid wording that moves quality-assurance accountability to AI.",
  },
  "ex-poc-prod": {
    title: "Why a PoC does not reach regular operation",
    thirtySecondAnswer:
      "Even with high accuracy, it is hard to reach regular operation unless the KPI, the operation, the accountability, security, and integration with existing systems are in place.",
    threeMinuteAnswer:
      "A PoC can produce good results on limited data. In regular operation, though, the questions are: who uses it, when, does it conflict with the existing procedure, how is data refreshed, who confirms when the answer is wrong, how are logs kept, and can IT/DX and quality assurance approve it. A PoC may also load data by hand where regular operation needs integration with ERP, MES, QMS, or SCADA. Design the PoC to validate fit to the work, the KPI, the operation, and the responsibility split — not accuracy alone.",
    keywords: ["KPI", "Situations of use", "Operational accountability", "Logging", "Production conditions"],
    caution: "Do not equate PoC success with success in regular operation.",
  },
  "ex-ot-security": {
    title: "Why OT security matters",
    thirtySecondAnswer:
      "Because OT directly controls equipment and production lines, a problem leads not only to an information leak but to equipment stoppage and to safety and quality impact.",
    threeMinuteAnswer:
      "IT security centres on protecting information; OT security centres on keeping equipment running safely. When AI is connected to PLC, SCADA, or DCS, an incorrect connection or operation can lead to equipment stoppage, a line stop, quality defects, or a safety risk. It is therefore realistic for AI to begin with reading equipment data, monitoring state, and presenting anomaly trends. If writes or automatic operation are involved, the connection method, access rights, logging, human approval, and emergency response all need to be designed.",
    keywords: ["Equipment stoppage", "Safety", "Quality", "Read-only", "Logging"],
    caution: "Avoid explanations that treat control systems lightly.",
  },
  "ex-scale": {
    title: "Why rolling out across plants is hard",
    thirtySecondAnswer:
      "Because equipment, forms, standard work, data fields, and local shop-floor vocabulary differ by plant, it cannot simply be copied.",
    threeMinuteAnswer:
      "Even where AI works at one plant, another may differ in process names, equipment configuration, standard work instructions, forms, data granularity, and lot management. At overseas sites the language and local practice change too. So a rollout needs to separate what can be made common — knowledge search, training support — from what needs site-by-site validation, such as equipment control and process optimisation. Rather than standardising company-wide from the start, organise the common part, the differences, the KPI, and the operating model, and proceed in stages.",
    keywords: ["Plant differences", "Form differences", "Local practice", "Common part", "Site validation"],
    caution: "Do not claim it rolls out unchanged.",
  },
  "ex-first-area": {
    title: "Which AI area to target first",
    thirtySecondAnswer:
      "Realistically, start where AI supports human judgement: shop-floor knowledge search, past-trouble search, making standard work instructions conversational, and maintenance-history search.",
    threeMinuteAnswer:
      "For an initial deployment, uses that cut the time the floor spends searching, speed up first response to an abnormality, support training for newer staff, and make past trouble easier to find are easier to land than automation touching safety, quality, or equipment control directly. They conflict less with existing procedures, and the KPIs are easy to watch: search time, self-resolution rate, reduced enquiries, first-response time, MTTR. Once that works, extending to quality analysis, predictive maintenance, and plan-change support is realistic. What matters is placing AI as the role that organises the material for a shop-floor decision.",
    keywords: ["Knowledge search", "Past trouble", "Training support", "MTTR", "Organising material"],
    caution: "Do not steer toward safety or shipment-release decisions at the start.",
  },
};
