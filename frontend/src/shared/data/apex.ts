export type EvaluationCriterion = {
  id: string;
  code: string;
  name: string;
  role: string;
  subtitle: string;
  focus: string;
  description: string;
  weightage: string;
  pct: number;
  colorClass: string;
  borderClass: string;
  bgClass: string;
};

export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    id: "01",
    code: "CRITERION_01",
    name: "INNOVATION",
    role: "THE IDEA",
    subtitle: "Originality & Problem Solving",
    focus: "Originality • Problem Solving",
    description:
      "Fresh and creative ideas that address meaningful real-world problems with an innovative approach.",
    weightage: "30%",
    pct: 30,
    colorClass: "text-accent-1",
    borderClass: "border-accent-1/40",
    bgClass: "bg-accent-1/10",
  },
  {
    id: "02",
    code: "CRITERION_02",
    name: "EXECUTION",
    role: "THE BUILD",
    subtitle: "Technical Quality & Architecture",
    focus: "Technical Quality • Architecture",
    description:
      "Quality of implementation, technical depth, functionality, architecture, and effective use of technology.",
    weightage: "30%",
    pct: 30,
    colorClass: "text-accent-2",
    borderClass: "border-accent-2/40",
    bgClass: "bg-accent-2/10",
  },
  {
    id: "03",
    code: "CRITERION_03",
    name: "IMPACT",
    role: "THE SCOPE",
    subtitle: "Feasibility & Real-world Usefulness",
    focus: "Feasibility • Usefulness",
    description:
      "Real-world applicability, scalability, feasibility, usefulness, and potential impact of the solution.",
    weightage: "20%",
    pct: 20,
    colorClass: "text-accent-3",
    borderClass: "border-accent-3/40",
    bgClass: "bg-accent-3/10",
  },
  {
    id: "04",
    code: "CRITERION_04",
    name: "PRESENTATION",
    role: "THE PITCH",
    subtitle: "Clarity, Design & Delivery",
    focus: "Clarity • Design • Delivery",
    description:
      "Clear communication, product demonstration, storytelling, UI/UX quality, and overall pitch delivery.",
    weightage: "20%",
    pct: 20,
    colorClass: "text-accent-4",
    borderClass: "border-accent-4/40",
    bgClass: "bg-accent-4/10",
  },
];

export const ROADMAP = [
  {
    id: "PHASE 01",
    n: 1,
    title: "REGISTRATION",
    window: "OPEN NOW",
    text: "Teams register for APEX 1.0 (1–4 members per team) and pay the ₹199 entry fee.",
    active: true,
  },
  {
    id: "PHASE 02",
    n: 2,
    title: "ONLINE SUBMISSION ROUND",
    window: "20 DEC 2026",
    text: "Teams submit their project presentation (PPT/PDF, max 20 MB) explaining problem, solution, tech stack, and impact before 20 December 2026.",
    active: false,
  },
  {
    id: "PHASE 03",
    n: 3,
    title: "SHORTLISTED TEAMS ANNOUNCEMENT",
    window: "TBA",
    text: "Official announcement of shortlisted teams selected by the evaluation panel for the Grand Finale (to be announced after Round 1).",
    active: false,
  },
  {
    id: "PHASE 04",
    n: 4,
    title: "GRAND FINALE ARRIVAL",
    window: "TBA",
    text: "Shortlisted teams gather in Bhopal, Madhya Pradesh for the offline Grand Finale (date and exact venue to be announced for shortlisted teams).",
    active: false,
  },
  {
    id: "PHASE 05",
    n: 5,
    title: "PROTOTYPE BUILD & REFINE",
    window: "FINALE BUILD",
    text: "Teams build, refine, and polish their prototypes under the mentorship of industry experts.",
    active: false,
  },
  {
    id: "PHASE 06",
    n: 6,
    title: "FINAL PITCH & DEMO",
    window: "LIVE JURY",
    text: "Teams present their live demonstration and solution pitch to the distinguished judging panel.",
    active: false,
  },
  {
    id: "PHASE 07",
    n: 7,
    title: "RESULTS & AWARDS",
    window: "CEREMONY",
    text: "Winner announcements for 1st (₹15,000), 2nd (₹10,000), 3rd (₹5,000), and special track awards.",
    active: false,
  },
];

export const RULES = [
  { n: "01", title: "ORGANIZER", text: "APEX 1.0 is organized by The Innovation League, Bhopal. Official website: https://apexhack.online." },
  { n: "02", title: "TEAM SIZE", text: "Teams must consist of 1–4 members. Every team must designate exactly one team leader. One participant cannot belong to multiple teams." },
  { n: "03", title: "IMPORTANT DATES", text: "Online Submission Round: 20 December 2026. Shortlist Announcement: TBA (to be announced after Round 1). Grand Finale: TBA (Bhopal, Madhya Pradesh)." },
  { n: "04", title: "REGISTRATION FEE", text: "Round 1 registration fee is ₹199 per team. Registration is complete only after successful payment and submission of required details." },
  { n: "05", title: "SUBMISSION GUIDELINES", text: "Accepted formats: PPT and PDF (max 20 MB). Projects must be original, explaining problem, solution, tech stack, implementation, and potential impact." },
  { n: "06", title: "GRAND FINALE", text: "The Grand Finale will take place in Bhopal, Madhya Pradesh (date TBA). Physical participation is expected. Online presentation may be requested with prior organizer approval." },
  { n: "07", title: "TECHNOLOGY & TOOLS", text: "Teams may use any programming language, framework, or platform. AI tools are allowed provided participants understand and explain their solution." },
  { n: "08", title: "EVALUATION CRITERIA", text: "Projects are evaluated on Innovation & Originality, Problem Understanding, Technical Implementation, Practical Feasibility, User Experience & Design, Impact & Scalability, and Presentation & Demonstration." },
];

export const EVENT_DETAILS = {
  name: "APEX 1.0 National Hackathon",
  organizer: "The Innovation League, Bhopal",
  website: "https://apexhack.online",
  registrationFee: 199,
  currency: "INR",
  dates: {
    onlineSubmission: "20 December 2026",
    shortlistAnnouncement: "TBA (To be announced after Round 1)",
    grandFinale: "TBA",
    finaleVenue: "Bhopal, Madhya Pradesh (Date and exact venue to be announced for shortlisted teams)",
  },
  prizePool: {
    total: 30000,
    first: 15000,
    second: 10000,
    third: 5000,
  },
  teamSize: { min: 1, max: 4 },
  maxFileSizeMB: 20,
  acceptedFileFormats: ["PPT", "PDF"],
};

export const EVALUATION_CRITERIA_LIST = [
  "Innovation and originality",
  "Problem understanding",
  "Technical implementation",
  "Practical feasibility",
  "User experience and design",
  "Impact and scalability",
  "Presentation and demonstration",
];

export const PRIZES = [
  { amount: 15000, title: "1ST PRIZE — CHAMPION", sub: "First place winner" },
  { amount: 10000, title: "2ND PRIZE — RUNNER UP", sub: "Second place winner" },
  { amount: 5000, title: "3RD PRIZE — 2ND RUNNER UP", sub: "Third place winner" },
];

export const SPECIAL_AWARDS = [
  "BEST AI SOLUTION",
  "BEST UI/UX",
  "BEST SOCIAL IMPACT",
  "BEST BEGINNER TEAM",
  "MOST CREATIVE IDEA",
  "PEOPLE'S CHOICE",
];

export const FAQS = [
  {
    q: "What is APEX 1.0?",
    a: "APEX 1.0 is a premier national hackathon organized by The Innovation League, Bhopal. Official website: https://apexhack.online.",
  },
  {
    q: "Who can participate?",
    a: "Students from any recognized college, university, or institution can participate. Form a team of 1–4 members and register your solution.",
  },
  {
    q: "What is the team size?",
    a: "Teams must consist of 1–4 members (including the designated team leader). Single-member teams and multi-member teams up to 4 participants are welcome. One participant cannot belong to multiple teams.",
  },
  {
    q: "What are the key dates?",
    a: "Online Submission Round: 20 December 2026. Shortlisted Teams Announcement: TBA (to be announced after Round 1). Grand Finale: TBA in Bhopal, Madhya Pradesh.",
  },
  {
    q: "What is the registration fee?",
    a: "The registration fee is ₹199 per team. Registration is confirmed only upon successful payment and submission of required team and project details.",
  },
  {
    q: "What formats are accepted for submission?",
    a: "Accepted file formats are PPT and PDF with a maximum file size of 20 MB. Submissions must explain the problem statement, proposed solution, technology stack, implementation, and potential impact.",
  },
  {
    q: "What is the prize pool?",
    a: "The total prize pool is ₹30,000: First Prize is ₹15,000, Second Prize is ₹10,000, and Third Prize is ₹5,000.",
  },
  {
    q: "Is finale participation offline or online?",
    a: "Physical participation in Bhopal (date TBA) is expected for shortlisted teams. Online presentation may be requested with prior organizer approval, though it is not automatically guaranteed.",
  },
  {
    q: "What are the evaluation criteria?",
    a: "Projects are evaluated on Innovation & Originality, Problem Understanding, Technical Implementation, Practical Feasibility, User Experience & Design, Impact & Scalability, and Presentation & Demonstration.",
  },
  {
    q: "Are AI tools and open technologies permitted?",
    a: "Yes. Teams may use any programming language, framework, or platform. AI tools are allowed provided participants understand and explain every aspect of their solution.",
  },
];

export const SPONSOR_TIERS = [
  { tier: "TITLE SPONSOR", slots: 1 },
  { tier: "GOLD PARTNER", slots: 3 },
  { tier: "TECH PARTNER", slots: 4 },
  { tier: "COMMUNITY PARTNER", slots: 5 },
];

export const ORGANIZERS = [
  { name: "To Be Announced", role: "Organizing Team", initials: "TBA" },
  { name: "To Be Announced", role: "Organizing Team", initials: "TBA" },
  { name: "To Be Announced", role: "Organizing Team", initials: "TBA" },
  { name: "To Be Announced", role: "Organizing Team", initials: "TBA" },
  { name: "To Be Announced", role: "Organizing Team", initials: "TBA" },
];

export const MICROCOPY = [
  "One Idea. No Limits.",
  "Build. Innovate. Pitch. Win.",
  "Your best ideas belong here.",
];
