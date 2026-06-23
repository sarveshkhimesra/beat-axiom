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
  { name: "Rahul", score: 72, title: titleFor(72) },
  { name: "Sana", score: 67, title: titleFor(67) },
  { name: "MM", score: 64, title: titleFor(64) },
  { name: "Roger", score: 57, title: titleFor(57) },
  { name: "Ankit S", score: 61, title: titleFor(61) },
  { name: "Tanvi", score: 53, title: titleFor(53) },
  { name: "Deepak", score: 48, title: titleFor(48) },
  { name: "Nikhil", score: 66, title: titleFor(66) },
  { name: "Megha P", score: 31, title: titleFor(31) },
  { name: "Riya", score: 59, title: titleFor(59) },
  { name: "Arjun T", score: 14, title: titleFor(14) },
  { name: "Priya M", score: 43, title: titleFor(43) },
  { name: "Neha S", score: 55, title: titleFor(55) },
  { name: "Kavya R", score: 8, title: titleFor(8) },
  { name: "Karthik", score: 62, title: titleFor(62) },
  { name: "Amit K", score: 37, title: titleFor(37) },
  { name: "Pooja R", score: 25, title: titleFor(25) },
  { name: "Varun", score: 51, title: titleFor(51) },
  { name: "Harsh V", score: 3, title: titleFor(3) },
  { name: "Divya N", score: 46, title: titleFor(46) },
  { name: "Gaurav", score: 19, title: titleFor(19) },
  { name: "Rohan J", score: 58, title: titleFor(58) },
  { name: "Manish", score: 34, title: titleFor(34) },
  { name: "Sahil", score: 11, title: titleFor(11) },
  { name: "Vikrant", score: 41, title: titleFor(41) },
  { name: "Aditi", score: 63, title: titleFor(63) },
  { name: "Sumit P", score: 7, title: titleFor(7) },
  { name: "Rajesh", score: 28, title: titleFor(28) },
  { name: "Pranav", score: 50, title: titleFor(50) },
  { name: "Kunal M", score: 16, title: titleFor(16) },
  { name: "Ishaan", score: 39, title: titleFor(39) },
  { name: "Simran", score: 56, title: titleFor(56) },
  { name: "Ritika", score: 22, title: titleFor(22) },
  { name: "Nidhi", score: 45, title: titleFor(45) },
  { name: "Swati K", score: 33, title: titleFor(33) },
  { name: "Aisha", score: 5, title: titleFor(5) },
  { name: "Shreya", score: 70, title: titleFor(70) },
  { name: "Akash", score: 0, title: titleFor(0) },
];

export function getSeedLeaderboard(): LeaderboardEntry[] {
  return [...SEED_ENTRIES].sort((a, b) => b.score - a.score);
}
