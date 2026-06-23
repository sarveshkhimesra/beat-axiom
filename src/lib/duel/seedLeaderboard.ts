export interface LeaderboardEntry {
  name: string;
  score: number;
  title: string;
}

function titleFor(score: number): string {
  if (score >= 85) return "Closer";
  if (score >= 70) return "Operator";
  if (score >= 55) return "Contender";
  if (score >= 35) return "Happy Ears";
  if (score >= 15) return "The Brochure";
  return "Ghost";
}

const SEED_ENTRIES: LeaderboardEntry[] = [
  { name: "Rahul", score: 74, title: titleFor(74) },
  { name: "MM", score: 64, title: titleFor(64) },
  { name: "Roger", score: 57, title: titleFor(57) },
  { name: "Sana", score: 72, title: titleFor(72) },
  { name: "Ankit S", score: 69, title: titleFor(69) },
  { name: "Tanvi", score: 67, title: titleFor(67) },
  { name: "Deepak", score: 63, title: titleFor(63) },
  { name: "Nikhil", score: 60, title: titleFor(60) },
  { name: "Megha P", score: 58, title: titleFor(58) },
  { name: "Riya", score: 55, title: titleFor(55) },
  { name: "Arjun T", score: 52, title: titleFor(52) },
  { name: "Priya M", score: 49, title: titleFor(49) },
  { name: "Neha S", score: 47, title: titleFor(47) },
  { name: "Kavya R", score: 44, title: titleFor(44) },
  { name: "Karthik", score: 42, title: titleFor(42) },
  { name: "Amit K", score: 39, title: titleFor(39) },
  { name: "Pooja R", score: 37, title: titleFor(37) },
  { name: "Varun", score: 35, title: titleFor(35) },
  { name: "Harsh V", score: 32, title: titleFor(32) },
  { name: "Divya N", score: 29, title: titleFor(29) },
  { name: "Gaurav", score: 27, title: titleFor(27) },
  { name: "Rohan J", score: 24, title: titleFor(24) },
  { name: "Manish", score: 22, title: titleFor(22) },
  { name: "Sahil", score: 19, title: titleFor(19) },
  { name: "Vikrant", score: 17, title: titleFor(17) },
  { name: "Aditi", score: 15, title: titleFor(15) },
  { name: "Sumit P", score: 12, title: titleFor(12) },
  { name: "Rajesh", score: 10, title: titleFor(10) },
  { name: "Pranav", score: 8, title: titleFor(8) },
  { name: "Kunal M", score: 6, title: titleFor(6) },
  { name: "Ishaan", score: 4, title: titleFor(4) },
  { name: "Simran", score: 71, title: titleFor(71) },
  { name: "Ritika", score: 66, title: titleFor(66) },
  { name: "Nidhi", score: 53, title: titleFor(53) },
  { name: "Swati K", score: 46, title: titleFor(46) },
  { name: "Aisha", score: 33, title: titleFor(33) },
  { name: "Shreya", score: 21, title: titleFor(21) },
  { name: "Akash", score: 2, title: titleFor(2) },
];

export function getSeedLeaderboard(): LeaderboardEntry[] {
  return [...SEED_ENTRIES].sort((a, b) => b.score - a.score);
}
