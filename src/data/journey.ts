// Education and experience for the About page timeline, from LinkedIn.
// Dates are "YYYY-MM". The page sorts entries by start date, newest first.
export type JourneyEntry = {
  name: string;
  logo: string;
  role: string;
  start: string;
  end: string;
  details?: string;
  highlights?: string[];
};

export const journey: JourneyEntry[] = [
  {
    name: "Singapore Management University",
    logo: "/logos/smu.png",
    role: "Bachelor of Science (Information Systems), Computer Science and Business Management",
    start: "2026-08",
    end: "2030-08",
  },
  {
    name: "Workato",
    logo: "/logos/workato.png",
    role: "Business Technology Intern",
    details: "Internship · Singapore · Hybrid",
    start: "2023-02",
    end: "2024-02",
    highlights: [
      "Built an end-to-end laptop asset management automation (JAMF, Snowflake, Jira) for onboarding and off-boarding, giving BT and HR visibility into laptop status.",
    ],
  },
  {
    name: "Ngee Ann Polytechnic",
    logo: "/logos/ngee-ann-poly.png",
    role: "Diploma in Information Technology",
    start: "2021-04",
    end: "2024-02",
    highlights: [
      "Director’s List (AY2021/22)",
      "Workato Hackathon Winner (2023)",
      "Co-Facilitator, Workato Automation Workshop for Polytechnic Peers (2023)",
      "Shopee Code League (2022)",
      "Minor in Foreign Languages (Korean)",
    ],
  },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-08" -> "Aug 2026". Fixed English names so server and browser agree. */
export function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

export function sortedJourney(entries: readonly JourneyEntry[] = journey) {
  return [...entries].sort((a, b) => b.start.localeCompare(a.start));
}
