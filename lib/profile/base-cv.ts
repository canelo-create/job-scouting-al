/**
 * Structured base CV for Andres Lince — source of truth for adaptation.
 * Extracted from CV_Andres_Lince_2026.docx on 2026-04-23.
 *
 * All facts here are canonical. Adapted CVs may REORDER, REPHRASE, or SELECT
 * bullets for a target role — never invent new facts or inflate metrics.
 */

export type CvContact = {
  full_name: string;
  headline: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  linkedin: string;
  website?: string;
  citizenship: string;
  work_authorization: string;
};

export type CvExperience = {
  role: string;
  company: string;
  company_context: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
  keywords: string[];
};

export type CvEducation = {
  degree: string;
  institution: string;
  location: string;
  start: string;
  end: string;
  bullets?: string[];
};

export type CvSkills = {
  project_management: string[];
  ai_automation: string[];
  business_strategy: string[];
  data_reporting: string[];
  languages: { name: string; level: string }[];
  international_markets: string[];
};

export type BaseCV = {
  contact: CvContact;
  summary: string;
  experience: CvExperience[];
  education: CvEducation[];
  skills: CvSkills;
  version: string;
  updated_at: string;
};

export const BASE_CV: BaseCV = {
  version: "2026.04.23",
  updated_at: "2026-04-23",
  contact: {
    full_name: "Andres Lince Garcia",
    headline:
      "Strategy & Project Management | AI Implementation & Automation | International Markets & Startups",
    city: "Madrid",
    country: "Spain",
    phone: "+57 317 431 9218",
    email: "andreslince@student.ie.edu",
    linkedin: "linkedin.com/in/andreslincegarcia",
    citizenship: "Spanish & Colombian",
    work_authorization: "EU work authorization · Open to opportunities in Spain and Colombia",
  },
  summary:
    "Bilingual Project and Marketing Manager with 3+ years of international experience leading cross-functional product and strategy initiatives across EMEA, USA, and LATAM for one of Latin America's leading FMCG multinationals (exporting to 80+ countries). Proven track record managing 35+ end-to-end projects, coordinating up to 8 internal areas simultaneously including R&D, regulatory, design, production, supply chain, finance, and commercial, delivering first measurable results within 6 months. Currently completing an International MBA at IE Business School (Madrid) with a concentration in Entrepreneurship. Actively building hands-on expertise in AI agents, LLMs, and workflow automation applied to real business use cases. Targeting roles in strategy, project management, consulting, or AI implementation at consulting firms, tech companies, or high-growth startups.",
  experience: [
    {
      role: "Marketing & Project Management Coordinator — EMEA Region",
      company: "Colombina S.A.",
      company_context:
        "Colombian FMCG multinational · ~USD 800M revenue · Confectionery leader exporting to 80+ countries",
      location: "Cali, Colombia",
      start: "2024-01",
      end: "2025-06",
      bullets: [
        "Led 35+ cross-functional product projects end-to-end across EMEA markets, coordinating 6–8 internal areas simultaneously (R&D, regulatory, packaging design, production, supply chain, finance, and commercial).",
        "Managed full product adaptation lifecycle per market: flavor and format localization, ingredient reformulation, multilingual packaging redesign, regulatory and labeling compliance, and financial viability analysis.",
        "Supported market entry into 3 new territories (Saudi Arabia, Oman, Qatar) by developing 15 locally adapted products within the first 6 months, incorporating cultural, regulatory, and consumer insights.",
        "Built and presented 34+ commercial performance reports (sell-in/sell-out, pricing benchmarks, demand forecasting, trend analysis) to senior leadership and finance teams, driving strategic resource allocation decisions.",
        "Ensured minimum 12% EBITDA margin across 35+ active SKUs through value-chain analysis, pricing optimization, and cost structure reviews in collaboration with finance and commercial teams.",
        "Managed external stakeholder relationships across EMEA distributors, clients, and regulatory bodies for product requirements, brand activations, and compliance needs.",
      ],
      keywords: [
        "cross-functional",
        "project management",
        "EMEA",
        "go-to-market",
        "product launch",
        "regulatory",
        "EBITDA",
        "pricing",
        "stakeholder management",
        "market entry",
      ],
    },
    {
      role: "International Markets Project Analyst — USA Region",
      company: "Colombina S.A.",
      company_context:
        "Colombian FMCG multinational · International business unit focused on the US market",
      location: "Cali, Colombia",
      start: "2022-06",
      end: "2024-01",
      bullets: [
        "Developed and launched 20+ B2B product projects tailored for major US retailers (Walmart, Costco, Amazon) and Latin specialty distributors, adapting products to local consumer preferences, retailer specs, and commercial requirements.",
        "Exceeded EBITDA targets in the majority of managed projects through pricing strategy, product mix optimization, and cost efficiency, delivering up to 27% above target margin on key initiatives.",
        "Co-created and launched 3 exclusive e-commerce products and a new brand (Chewzme) for the US digital market, managing end-to-end execution from concept to commercial launch.",
        "Managed inventory planning, pricing strategy, and product availability for 200+ SKUs across B2B and B2C channels, maintaining 90%+ availability rate.",
        "Operated bilingually (English/Spanish) across internal teams in Colombia and external partners in the US, ensuring seamless cross-cultural project execution.",
      ],
      keywords: [
        "B2B",
        "retailers",
        "Walmart",
        "Costco",
        "Amazon",
        "pricing",
        "EBITDA",
        "e-commerce",
        "brand launch",
        "bilingual",
      ],
    },
    {
      role: "Financial Planning Intern",
      company: "Colombina S.A.",
      company_context: "Colombian FMCG multinational",
      location: "Cali, Colombia",
      start: "2021-11",
      end: "2022-06",
      bullets: [
        "Produced 100+ commercial and financial reports analyzing sell-in/sell-out, pricing, and SKU rotation for 200+ products, delivering data-driven insights to sales and distribution leadership.",
        "Collaborated cross-functionally with sales, marketing, and logistics using Power BI, SAP TSOL, and Excel to integrate financial insights into commercial strategy.",
      ],
      keywords: ["financial analysis", "reporting", "Power BI", "SAP", "Excel", "cross-functional"],
    },
  ],
  education: [
    {
      degree: "International MBA (Concentration in Entrepreneurship)",
      institution: "IE Business School",
      location: "Madrid, Spain",
      start: "2025-09",
      end: "2026-07",
      bullets: [
        "Focus: Digital transformation, AI & innovation strategy, venture building, consulting, and startup ecosystems.",
        "Activities: Entrepreneurship Club, cross-industry case projects, international cohort.",
      ],
    },
    {
      degree: "Bachelor in Business Administration",
      institution: "Pontificia Universidad Javeriana Cali",
      location: "Cali, Colombia",
      start: "2017-08",
      end: "2022-07",
      bullets: ["Concentration in Entrepreneurship."],
    },
  ],
  skills: {
    project_management: [
      "End-to-end project lifecycle",
      "Cross-functional coordination",
      "Stakeholder management",
      "Agile",
      "KPI tracking",
      "Risk management",
    ],
    ai_automation: [
      "AI agents",
      "LLMs",
      "Workflow automation",
      "n8n",
      "Make",
      "Zapier",
      "Prompt engineering",
      "OpenAI & Anthropic API",
      "Telegram bot deployment",
    ],
    business_strategy: [
      "Go-to-market strategy",
      "Business case development",
      "Financial planning",
      "Pricing optimization",
      "EBITDA analysis",
      "Market entry",
      "B2B strategy",
    ],
    data_reporting: [
      "Power BI",
      "SAP TSOL",
      "Salesforce CRM",
      "Excel (advanced)",
      "Google Suite",
      "Data-driven decision making",
    ],
    languages: [
      { name: "Spanish", level: "native" },
      { name: "English", level: "professional / advanced" },
    ],
    international_markets: [
      "EMEA (Saudi Arabia, Qatar, Oman, North Africa, Europe)",
      "USA",
      "LATAM",
      "Cross-cultural team leadership",
    ],
  },
};
