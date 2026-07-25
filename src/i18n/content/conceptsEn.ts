import type { ConceptDiagram } from "../../types";

/**
 * English overlay for `src/data/concepts.ts`, keyed by the existing concept `id`.
 *
 * The Japanese source file is not touched: IDs, booths, domains, and the Japanese
 * wording all stay exactly as they are. Only the display strings are supplied here.
 *
 * `whyImportant`, `thirtySecond`, and `miniQuestion` are not listed because the
 * Japanese data derives them from templates; `localizeConcept` applies the equivalent
 * English templates instead of duplicating 39 generated sentences.
 */
export interface ConceptContentEn {
  title: string;
  oneLine: string;
  departments: string[];
  kpis: string[];
  aiTouchpoint: string;
  caution: string;
  juniorSummary?: string;
  conceptDiagram?: ConceptDiagram;
  usageScene?: string[];
  exampleScene?: string[];
  aiConnection?: string;
}

export const conceptsEn: Record<string, ConceptContentEn> = {
  erp: {
    title: "ERP",
    oneLine:
      "The core system managing company-wide orders, accounting, inventory, and costing.",
    departments: ["Head office", "Business unit", "Production control", "Procurement"],
    kpis: ["On-time delivery rate", "Inventory turnover", "Cost variance"],
    aiTouchpoint: "Organises demand, inventory, costing, and the impact of plan changes.",
    caution: "Usually holds no second-by-second shop-floor data or equipment state.",
    juniorSummary:
      "The company-wide ledger: money, materials, and orders all read from one place.",
    conceptDiagram: {
      inputs: ["Sales orders", "Purchasing", "Inventory", "Costing", "Accounting"],
      hub: "ERP",
      outputs: ["Shared across the company"],
      note: "Pulls scattered records into one place so everyone works from the same numbers.",
    },
    usageScene: [
      "Connecting an order sales took to purchasing, inventory, and accounting",
      "Reviewing material availability, cost, and revenue together",
    ],
    exampleScene: [
      "Checking inventory and purchasing status to see whether a new order can be met",
      "Reviewing revenue, cost, and inventory together at month end",
    ],
    aiConnection:
      "ERP data underpins demand forecasting, cost-variance analysis, and inventory optimisation.",
  },
  mes: {
    title: "MES",
    oneLine:
      "The manufacturing execution system managing work orders, production records, process steps, and lots inside the plant.",
    departments: ["Manufacturing", "Production control", "Production engineering"],
    kpis: ["Production reporting accuracy", "First-pass yield", "Downtime"],
    aiTouchpoint:
      "Organises the relationship between production records, stoppages, and quality results.",
    caution:
      "Without links to ERP and equipment data, the wider impact is hard to see.",
    juniorSummary: "Shows what is being made, where, and how much, right now.",
    conceptDiagram: {
      inputs: ["Work orders", "Process steps", "Actuals", "Lots"],
      hub: "MES",
      outputs: ["Plant progress made visible"],
      note: "Records what is happening on the floor as it happens, and makes it visible.",
    },
    usageScene: [
      "Finding out which process step a product has reached",
      "Tracing production records and lot information",
    ],
    exampleScene: [
      "Answering “which line is this product on right now?”",
      "Confirming who made a lot, when, and at which process step",
    ],
    aiConnection:
      "MES data suits anomaly detection, process improvement, delay prediction, and traceability analysis.",
  },
  mom: {
    title: "MOM",
    oneLine:
      "A way of framing plant operations that spans production, quality, maintenance, and inventory.",
    departments: ["Plant manager", "Manufacturing", "Quality", "Maintenance"],
    kpis: ["OEE", "Defect rate", "MTTR"],
    aiTouchpoint:
      "Connects plant-wide state and organises decision inputs across functions.",
    caution: "The scope this term covers varies by company and system landscape.",
    juniorSummary: "The plant-wide control-room view of operations.",
    conceptDiagram: {
      inputs: ["Production", "Quality", "Maintenance", "Inventory"],
      hub: "MOM",
      outputs: ["Plant operations as a whole"],
      note: "A view that connects the whole plant rather than one slice of it.",
    },
    usageScene: [
      "Looking at the plant as a whole, including quality and maintenance, not just production",
      "Connecting plant operations laterally across functions",
    ],
    exampleScene: [
      "Examining whether a production delay came from equipment failure or a quality problem",
      "A plant manager reviewing production, quality, and maintenance together",
    ],
    aiConnection:
      "The MOM framing helps scope AI work to plant operations as a whole rather than to one part of the floor.",
  },
  plm: {
    title: "PLM",
    oneLine:
      "Manages product lifecycle information: drawings, specifications, BOMs, and engineering changes.",
    departments: ["Design engineering", "Production engineering", "Quality assurance"],
    kpis: ["Engineering change lead time", "Change-induced defects"],
    aiTouchpoint:
      "Makes it easier to trace how an engineering change affected processes and quality.",
    caution:
      "Without links to production records and quality data, impact analysis stays weak.",
    juniorSummary: "Keeps everyone working from the current version of drawings and specs.",
    conceptDiagram: {
      inputs: ["Drawings", "Specifications", "BOM", "Engineering changes"],
      hub: "PLM",
      outputs: ["Current product information shared"],
      note: "Holds the correct product information in one place so no one guesses which version is current.",
    },
    usageScene: [
      "Communicating an engineering change correctly to the plant and to procurement",
      "Removing any doubt about which drawing is current",
    ],
    exampleScene: [
      "Preventing parts from being built to a superseded drawing",
      "Keeping the BOM and change details aligned between design and manufacturing",
    ],
    aiConnection:
      "PLM underpins engineering-change impact analysis and the flow of information between design, manufacturing, and quality.",
  },
  qms: {
    title: "QMS",
    oneLine:
      "Manages defects, audits, corrective actions, and quality records.",
    departments: ["Quality assurance", "Quality control"],
    kpis: ["Defect escapes", "Recurrence rate", "Audit findings"],
    aiTouchpoint: "Organises similar defects, corrective actions, and audit evidence.",
    caution:
      "Shipment release and final quality-assurance judgements require human confirmation.",
    juniorSummary: "Records quality problems so the same failure does not repeat.",
    conceptDiagram: {
      inputs: ["Defects", "Audits", "Corrective actions", "Quality records"],
      hub: "QMS",
      outputs: ["Quality records and recurrence prevention"],
      note: "Keeps the problem and the response on record so the same mistake is not repeated.",
    },
    usageScene: [
      "Recording cause, response, and recurrence prevention when a defect occurs",
      "Showing an auditor how quality is controlled",
    ],
    exampleScene: [
      "Recording the investigation and corrective action for a defect",
      "Presenting quality records during an audit",
    ],
    aiConnection:
      "QMS data supports defect-cause search, recurrence-trend analysis, and audit preparation.",
  },
  scada: {
    title: "SCADA",
    oneLine: "Supervises equipment state and, where required, controls it.",
    departments: ["Manufacturing", "Maintenance", "Production engineering"],
    kpis: ["Downtime", "First-response time", "Incident count"],
    aiTouchpoint: "Organises anomaly trends from alarms and operating values.",
    caution:
      "Direct control or write access needs careful review of safety and quality impact.",
    juniorSummary: "The control-room screen that watches equipment from a distance.",
    conceptDiagram: {
      inputs: ["Equipment and sensors"],
      hub: "SCADA",
      outputs: ["Supervisory screens, alarms, limited control"],
      note: "Watch equipment from elsewhere and notice an abnormality immediately.",
    },
    usageScene: [
      "Monitoring temperature, pressure, flow, and running state",
      "Being alerted the moment something goes wrong",
    ],
    exampleScene: [
      "Watching equipment alarms from the control room",
      "Checking process state remotely",
    ],
    aiConnection:
      "SCADA data suits visualising anomaly trends and feeding maintenance-support models.",
  },
  plc: {
    title: "PLC",
    oneLine: "The device handling machine I/O signals and control logic.",
    departments: ["Maintenance", "Production engineering", "Manufacturing"],
    kpis: ["Equipment downtime", "Recovery time"],
    aiTouchpoint: "Used to acquire equipment data and spot early signs of trouble.",
    caution:
      "Avoid unverified writes or automatic operation; design a human confirmation step.",
    juniorSummary: "The small automatic brain that moves machinery in response to sensors.",
    conceptDiagram: {
      inputs: ["Sensor inputs"],
      hub: "PLC",
      outputs: ["Motors, valves, indicators"],
      note: "Decides “when this happens, move that” automatically and drives the machine.",
    },
    usageScene: [
      "Starting a conveyor when a sensor triggers",
      "Stopping equipment when a button is pressed",
    ],
    exampleScene: [
      "Equipment starts when a part arrives",
      "Equipment stops when a fault signal appears",
    ],
    aiConnection:
      "The PLC itself is not the AI; more often its equipment signals become the input to AI analysis.",
  },
  dcs: {
    title: "DCS",
    oneLine: "Supervises and controls a whole continuous process in a distributed way.",
    departments: ["Manufacturing", "Maintenance", "Production engineering"],
    kpis: ["Process stability", "Downtime", "Quality variation"],
    aiTouchpoint: "Organises early signs of process upsets and changes in conditions.",
    caution:
      "Direct intervention carries large safety and quality impact and needs staged validation.",
    juniorSummary:
      "Controls the plant as a whole, especially processes that run continuously.",
    conceptDiagram: {
      inputs: ["Step 1", "Step 2", "Step 3"],
      hub: "DCS",
      outputs: ["Whole continuous process supervised and controlled"],
      note: "Controls hard-to-stop continuous processes while watching the overall balance.",
    },
    usageScene: [
      "Overseeing continuously flowing processes in chemicals, food, or energy",
      "Controlling for overall balance rather than one section",
    ],
    exampleScene: [
      "Adjusting tank temperature and flow while watching the whole picture",
      "Supervising an entire plant from one place",
    ],
    aiConnection:
      "Data around the DCS can serve process optimisation and early anomaly detection, but wiring it to control needs caution.",
  },
  ot: {
    title: "OT",
    oneLine:
      "The technology domain behind plant equipment, control, supervision, and uptime.",
    departments: ["Manufacturing", "Maintenance", "Production engineering", "IT/DX"],
    kpis: ["Availability", "Downtime", "Safety indicators"],
    aiTouchpoint:
      "Connects to equipment-state visibility, monitoring support, and maintenance support.",
    caution:
      "Availability and safety come first; it cannot be treated the way IT is treated.",
    juniorSummary: "The world of equipment, control, and supervision that runs the plant.",
    conceptDiagram: {
      inputs: ["Equipment", "PLC", "SCADA", "Sensors", "Control room"],
      hub: "OT",
      outputs: [],
      note: "The side that actually runs the plant. A stoppage here stops production.",
    },
    usageScene: [
      "Keeping the plant running",
      "Controlling equipment safely",
      "Monitoring for abnormalities",
    ],
    exampleScene: [
      "Keeping line equipment running",
      "Working with control networks and supervisory systems",
    ],
    aiConnection:
      "OT matters for AI, but because a stoppage hits production directly it needs even more careful connectivity and security than IT.",
  },
  it: {
    title: "IT",
    oneLine:
      "The domain of business systems, data, access rights, reporting, and analytics platforms.",
    departments: ["IT/DX", "Head office", "All departments"],
    kpis: ["Uptime", "Incident count", "Adoption rate"],
    aiTouchpoint:
      "Provides the operating base for data integration, search, analytics, and generative AI.",
    caution:
      "Connecting to OT requires access control, logging, a connection design, and an outage plan.",
    juniorSummary:
      "The world of business systems behind information, reporting, permissions, and analysis.",
    conceptDiagram: {
      inputs: ["Orders", "Accounting", "Reporting", "Access rights", "Analytics platform"],
      hub: "IT",
      outputs: [],
      note: "The information side. The base for data, permissions, and analysis.",
    },
    usageScene: [
      "Running business systems",
      "Managing access rights",
      "Producing analysis and reports",
    ],
    exampleScene: [
      "Administering internal order-entry and accounting systems",
      "Operating BI and analytics platforms",
    ],
    aiConnection:
      "IT provides the data platform, access control, and logging that make AI usable safely.",
  },
  cmms: {
    title: "CMMS",
    oneLine:
      "The maintenance system managing inspections, failures, repairs, and work history.",
    departments: ["Maintenance"],
    kpis: ["MTBF", "MTTR", "Maintenance cost"],
    aiTouchpoint: "Used for recovery-procedure search and failure-trend analysis.",
    caution: "Coarse record granularity degrades both search and analysis.",
    juniorSummary: "The digital version of the maintenance notebook.",
    conceptDiagram: {
      inputs: ["Inspection plans", "Failure reports", "Repair history", "Part replacements"],
      hub: "CMMS",
      outputs: ["Maintenance work recorded and managed"],
      note: "Keeps a record of what was inspected or repaired and when, so it can be used next time.",
    },
    usageScene: [
      "Managing the inspection schedule",
      "Keeping failure and repair history",
    ],
    exampleScene: [
      "Checking whether this equipment has had the same failure before",
      "Confirming no inspection has been missed",
    ],
    aiConnection:
      "CMMS is the base for failure-trend analysis and maintenance knowledge search.",
  },
  eam: {
    title: "EAM",
    oneLine:
      "Enterprise asset management for the equipment register, assets, and maintenance plans.",
    departments: ["Maintenance", "Plant administration", "Head office"],
    kpis: ["Asset life", "Maintenance cost", "Downtime"],
    aiTouchpoint: "Organises asset lifecycle and maintenance priority.",
    caution:
      "It only earns its value once connected to shop-floor actuals and failure history.",
    juniorSummary: "Manages equipment as an asset over its full life.",
    conceptDiagram: {
      inputs: ["Equipment register", "Asset data", "Maintenance plans", "Replacement capex"],
      hub: "EAM",
      outputs: ["Long-term equipment management"],
      note: "Manages equipment on a long horizon — when it was bought, when it is replaced.",
    },
    usageScene: [
      "Deciding how many years to run equipment and when to replace it",
      "Viewing capital and maintenance spend over a long horizon",
    ],
    exampleScene: [
      "Judging when to replace ageing equipment",
      "Weighing maintenance cost against asset life together",
    ],
    aiConnection:
      "EAM supports analysis for replacement decisions and long-term maintenance strategy.",
  },
  wms: {
    title: "WMS",
    oneLine:
      "Manages warehouse receipts, issues, stocktaking, and locations.",
    departments: ["Logistics", "SCM", "Production control"],
    kpis: ["Stockout rate", "Inventory count discrepancy", "Logistics delays"],
    aiTouchpoint: "Organises stockouts, slow-moving stock, and inventory risk.",
    caution:
      "When quantities disagree with ERP or MES, the cause has to be established.",
    juniorSummary: "Tracks what is where in the warehouse.",
    conceptDiagram: {
      inputs: ["Receiving", "Put-away", "Stock", "Issuing"],
      hub: "WMS",
      outputs: ["Warehouse flow managed"],
      note: "Knows which rack holds what, so goods are found immediately.",
    },
    usageScene: [
      "Finding which rack holds a given item",
      "Managing the flow of receipts and issues",
    ],
    exampleScene: [
      "Locating goods to be shipped immediately",
      "Reducing stocktaking discrepancies",
    ],
    aiConnection:
      "WMS data informs inventory analysis, issue prioritisation, and warehouse routing improvements.",
  },
  aps: {
    title: "APS",
    oneLine:
      "Builds production plans and schedules that respect real constraints.",
    departments: ["Production control", "SCM"],
    kpis: ["On-time delivery rate", "Load levelling", "Inventory"],
    aiTouchpoint: "Organises plan-change options and their delivery impact.",
    caution:
      "Without shop-floor constraints reflected, the plan it produces cannot be executed.",
    juniorSummary:
      "Builds a realistic schedule while watching material, labour, and equipment constraints.",
    conceptDiagram: {
      inputs: ["Orders", "Equipment capacity", "Labour", "Materials"],
      hub: "APS",
      outputs: ["A realistic production schedule"],
      note: "Builds the plan against constraints, so the answer is one that can actually be run.",
    },
    usageScene: [
      "Deciding where to slot a rush order",
      "Scheduling around equipment capacity and material constraints",
    ],
    exampleScene: [
      "Seeing where pulling an order forward would create strain",
      "Planning around an equipment stoppage or a shortage",
    ],
    aiConnection:
      "APS pairs well with plan-change support and delivery-date prediction.",
  },
  scm: {
    title: "SCM",
    oneLine:
      "Management of the whole supply network: demand, supply, logistics, and inventory.",
    departments: ["SCM", "Procurement", "Production control"],
    kpis: ["On-time delivery rate", "Inventory turnover", "Logistics delays"],
    aiTouchpoint:
      "Organises material delays, supply risk, and the impact of alternatives.",
    caution:
      "Be explicit about how supplier information is handled and where responsibility sits.",
  },
  iiot: {
    title: "IIoT",
    oneLine: "Connects equipment and sensors to acquire industrial data.",
    departments: ["Production engineering", "Maintenance", "IT/DX"],
    kpis: ["Data capture rate", "Anomaly analysis time", "Downtime"],
    aiTouchpoint: "Uses sensor values to organise anomaly trends and equipment state.",
    caution:
      "Data volume, time synchronisation, security, and missing-data handling all become issues.",
    juniorSummary: "Connects equipment and sensors to collect plant data.",
    conceptDiagram: {
      inputs: ["Equipment A", "Equipment B", "Sensors"],
      hub: "IIoT",
      outputs: ["Data collection", "Visibility and analysis"],
      note: "Collects shop-floor data automatically and creates the entry point for analysis.",
    },
    usageScene: [
      "Collecting data from equipment automatically",
      "Making running-state or temperature data visible",
    ],
    exampleScene: [
      "Collecting temperature and vibration with sensors",
      "Making utilisation visible",
    ],
    aiConnection:
      "IIoT is often the entry point for collecting the shop-floor data an AI initiative needs.",
  },
  "digital-twin": {
    title: "Digital twin",
    oneLine:
      "Reproducing real equipment and processes digitally in order to examine impact.",
    departments: ["Production engineering", "Manufacturing", "Maintenance"],
    kpis: ["Ramp-up time", "Process capability", "Downtime"],
    aiTouchpoint:
      "Makes it easier to compare the impact of condition changes and abnormal situations.",
    caution:
      "Without managing the gap from reality, it is weak as a basis for decisions.",
  },
  "digital-thread": {
    title: "Digital thread",
    oneLine:
      "Connecting information from design through manufacturing, quality, and maintenance.",
    departments: ["Design engineering", "Production engineering", "Quality", "Manufacturing"],
    kpis: ["Traceability time", "Change-impact visibility", "Recurrence rate"],
    aiTouchpoint: "Supports tracing engineering changes and quality problems.",
    caution:
      "Without linked IDs, timestamps, lots, and process steps, nothing can be traced.",
  },
  "production-engineering": {
    title: "Production engineering",
    oneLine:
      "The function that designs processes, equipment, and conditions so volume production works.",
    departments: ["Production engineering", "Manufacturing", "Quality"],
    kpis: ["Process capability", "Yield", "OEE"],
    aiTouchpoint:
      "Organises the relationship between process conditions, defects, and stoppages.",
    caution:
      "Proposals that ignore equipment constraints or standard work do not get used on the floor.",
  },
  "production-control": {
    title: "Production control",
    oneLine:
      "The function deciding what to make, when, and how much, based on demand, inventory, and capacity.",
    departments: ["Production control", "SCM", "Manufacturing"],
    kpis: ["On-time delivery rate", "Inventory turnover", "Stockout rate"],
    aiTouchpoint:
      "Organises the impact of plan changes during material delays or equipment stoppages.",
    caution:
      "Keep it to presenting impact and alternatives, not to executing changes automatically.",
  },
  manufacturing: {
    title: "Manufacturing",
    oneLine:
      "The shop-floor function running daily production, work, and abnormality response.",
    departments: ["Manufacturing", "Team leaders", "Operators"],
    kpis: ["Output volume", "First-pass yield", "Downtime"],
    aiTouchpoint:
      "Supports procedure checks, first response to abnormalities, and past-case search.",
    caution: "If it looks like surveillance or appraisal, it will not take hold.",
  },
  "quality-assurance": {
    title: "Quality assurance",
    oneLine:
      "The function responsible for customer guarantees, audits, shipped quality, and recurrence prevention.",
    departments: ["Quality assurance", "Quality control", "Manufacturing"],
    kpis: ["Defect escapes", "Recurrence rate", "Audit findings"],
    aiTouchpoint:
      "Used for organising evidence, searching similar defects, and supporting recurrence prevention.",
    caution:
      "Do not shift decision responsibility to AI; keep the approval and the record.",
  },
  "quality-control": {
    title: "Quality control",
    oneLine:
      "The function measuring, inspecting, and analysing in-process quality to keep it stable.",
    departments: ["Quality control", "Manufacturing", "Production engineering"],
    kpis: ["Defect rate", "ppm", "First-pass yield"],
    aiTouchpoint:
      "Organises process variation, candidate defect causes, and inspection results.",
    caution:
      "Confirming root cause and releasing shipment require human confirmation against existing criteria.",
  },
  maintenance: {
    title: "Maintenance",
    oneLine:
      "The function that keeps equipment running and restores it quickly when it stops.",
    departments: ["Maintenance", "Manufacturing", "Production engineering"],
    kpis: ["MTBF", "MTTR", "Downtime"],
    aiTouchpoint:
      "Used for predictive maintenance, recovery-procedure search, and maintenance history.",
    caution:
      "Build false alarms and the resulting inspection load into the operating design.",
  },
  "it-dx": {
    title: "IT / DX",
    oneLine:
      "The function supporting systems, data, security, and standardisation.",
    departments: ["IT/DX", "Shop floor", "Quality"],
    kpis: ["Uptime", "Incident count", "Adoption rate"],
    aiTouchpoint:
      "Sets up data integration, access rights, logging, and the operating platform.",
    caution:
      "Involve the operational constraints of the floor, quality, and maintenance from the start.",
  },
  procurement: {
    title: "Procurement",
    oneLine:
      "The function securing materials and parts and coordinating with suppliers.",
    departments: ["Procurement", "SCM", "Production control"],
    kpis: ["Procurement lead time", "Stockout rate", "Price variance"],
    aiTouchpoint:
      "Organises the impact of procurement delays and alternative sourcing.",
    caution:
      "Confirm how far external information may be shared and where responsibility sits.",
  },
  "plant-manager": {
    title: "Plant manager",
    oneLine:
      "The role accountable for the whole plant across safety, quality, delivery, and cost.",
    departments: ["Plant manager", "All departments"],
    kpis: ["Safety", "Quality", "OEE", "Cost"],
    aiTouchpoint:
      "Brings stoppages, quality, delivery, and countermeasure status together as decision inputs.",
    caution: "Frame it on safety and quality first, not efficiency alone.",
  },
  safety: {
    title: "Safety",
    oneLine: "The overriding condition for protecting workers and equipment.",
    departments: ["Health and safety", "Manufacturing", "Maintenance"],
    kpis: ["Near-miss reports", "Accident rate", "Training completion rate"],
    aiTouchpoint: "Organises past cases and risk information.",
    caution: "Never place the final decision on whether work may proceed with AI.",
  },
  quality: {
    title: "Quality",
    oneLine:
      "The condition of meeting customer requirements and process criteria, and being able to account for it.",
    departments: ["Quality assurance", "Quality control", "Manufacturing"],
    kpis: ["Defect rate", "Defect escapes", "Recurrence rate"],
    aiTouchpoint: "Organises quality data, past defects, and corrective actions.",
    caution:
      "Assurance judgements and shipment release need confirmation by the accountable owner.",
  },
  audit: {
    title: "Audit",
    oneLine:
      "The work of being able to account for decision basis, evidence, approvals, and versions.",
    departments: ["Quality assurance", "IT/DX", "Administration"],
    kpis: ["Audit findings", "Evidence retrieval time"],
    aiTouchpoint: "Organises referenced documents, change history, and the basis for answers.",
    caution:
      "Be explicit whether AI output is reference material or a formal record.",
  },
  "ot-security": {
    title: "OT security",
    oneLine:
      "Security for keeping plant equipment and control systems running safely.",
    departments: ["IT/DX", "Maintenance", "Production engineering"],
    kpis: ["Downtime", "Incident count", "Safety indicators"],
    aiTouchpoint: "Bears on connection design, access rights, logging, and monitoring.",
    caution:
      "It is not only about protecting information — equipment stoppage and safety impact must be considered.",
  },
  poc: {
    title: "PoC",
    oneLine:
      "The stage that validates fit to the work, KPIs, operability, and risk within a limited scope.",
    departments: ["Shop floor", "IT/DX", "Quality", "Maintenance"],
    kpis: ["Adoption rate", "KPI improvement", "Incorrect-response rate"],
    aiTouchpoint:
      "Confirms the effect and operational feasibility of a decision-support theme.",
    caution:
      "Do not call it a success on accuracy alone; look at production conditions early.",
  },
  approval: {
    title: "Internal approval",
    oneLine:
      "The process of assembling purpose, cost, benefit, risk, and accountability to obtain approval.",
    departments: ["Plant manager", "Business unit", "IT/DX", "Quality"],
    kpis: ["Return on investment", "Risk indicators"],
    aiTouchpoint: "Organises validation results, the operating plan, and risk response.",
    caution:
      "Separate what is technically possible from what the company can actually operate.",
  },
  "production-rollout": {
    title: "Production rollout",
    oneLine:
      "The stage of putting sustainable operation, access rights, logging, and accountability in place.",
    departments: ["Plant manager", "IT/DX", "Quality", "Shop floor"],
    kpis: ["Adoption rate", "Incident count", "KPI improvement"],
    aiTouchpoint:
      "Supports operating procedures, enquiries, updates, and the improvement cycle.",
    caution: "Do not assume the PoC configuration carries over unchanged.",
  },
  "scale-out": {
    title: "Scale-out",
    oneLine:
      "Extending step by step to other lines, other plants, and overseas sites.",
    departments: ["Head office", "Plants", "Business unit", "SCM"],
    kpis: ["Rollout benefit", "Adoption rate", "Standardisation rate"],
    aiTouchpoint:
      "Supports shared knowledge, KPI templates, and organising the differences.",
    caution:
      "Do not copy across plants without accounting for local differences and local practice.",
  },
  "knowledge-search": {
    title: "Knowledge search",
    oneLine:
      "Making standards, past trouble reports, A3s, and maintenance history easier to find.",
    departments: ["Manufacturing", "Maintenance", "Quality"],
    kpis: ["Search time", "Self-resolution rate", "First-response time"],
    aiTouchpoint: "Lets people search scattered documents conversationally.",
    caution:
      "Version control of approved documents and showing the source both matter.",
  },
  "quality-analysis": {
    title: "Quality analysis",
    oneLine: "Organising candidate defect causes and similar past cases.",
    departments: ["Quality control", "Quality assurance", "Manufacturing"],
    kpis: ["Defect rate", "ppm", "Recurrence rate"],
    aiTouchpoint:
      "Looks across process conditions, inspection results, and past defects.",
    caution:
      "Confirming root cause and making the quality-assurance judgement stay with people.",
  },
  "predictive-maintenance": {
    title: "Predictive maintenance",
    oneLine:
      "Identifying signs of failure and candidate replacement timing to reduce stoppage risk.",
    departments: ["Maintenance", "Manufacturing", "Production engineering"],
    kpis: ["MTBF", "MTTR", "Downtime"],
    aiTouchpoint: "Organises priority from sensor values and maintenance history.",
    caution:
      "Assume false alarms, and design the confirmation flow and threshold review around them.",
  },
  "plan-change-support": {
    title: "Plan-change support",
    oneLine:
      "Organising alternatives and the affected scope when materials are delayed or equipment stops.",
    departments: ["Production control", "SCM", "Manufacturing"],
    kpis: ["On-time delivery rate", "Stockout rate", "Overtime hours"],
    aiTouchpoint:
      "Makes the delivery, inventory, and workload impact of a plan change visible.",
    caution:
      "Do not design it to execute automatically without checking shop-floor constraints.",
  },
};
