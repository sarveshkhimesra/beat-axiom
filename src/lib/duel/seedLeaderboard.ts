export interface LeaderboardEntry {
  name: string;
  score: number;
  title: string;
}

const SEED_ENTRIES: LeaderboardEntry[] = [
  { name: "Rahul", score: 74, title: "Operator" },
  { name: "MM", score: 64, title: "Contender" },
  { name: "Roger", score: 57, title: "Contender" },
  { name: "Ankit S", score: 71, title: "Operator" },
  { name: "Priya M", score: 52, title: "Happy Ears" },
  { name: "Deepak", score: 68, title: "Contender" },
  { name: "Kavya R", score: 45, title: "Happy Ears" },
  { name: "Nikhil", score: 61, title: "Contender" },
  { name: "Shreya", score: 49, title: "Happy Ears" },
  { name: "Amit K", score: 55, title: "Contender" },
  { name: "Varun", score: 43, title: "Happy Ears" },
  { name: "Megha P", score: 66, title: "Contender" },
  { name: "Rohan J", score: 38, title: "Happy Ears" },
  { name: "Sana", score: 72, title: "Operator" },
  { name: "Karthik", score: 51, title: "Happy Ears" },
  { name: "Divya N", score: 47, title: "Happy Ears" },
  { name: "Arjun T", score: 63, title: "Contender" },
  { name: "Riya", score: 58, title: "Contender" },
  { name: "Harsh V", score: 41, title: "Happy Ears" },
  { name: "Tanvi", score: 69, title: "Contender" },
  { name: "Sahil", score: 33, title: "The Brochure" },
  { name: "Pooja R", score: 56, title: "Contender" },
  { name: "Gaurav", score: 44, title: "Happy Ears" },
  { name: "Neha S", score: 60, title: "Contender" },
  { name: "Vikrant", score: 37, title: "Happy Ears" },
  { name: "Aisha", score: 53, title: "Happy Ears" },
  { name: "Manish", score: 48, title: "Happy Ears" },
  { name: "Ritika", score: 65, title: "Contender" },
  { name: "Sumit P", score: 42, title: "Happy Ears" },
  { name: "Nidhi", score: 59, title: "Contender" },
  { name: "Pranav", score: 36, title: "Happy Ears" },
  { name: "Swati K", score: 54, title: "Contender" },
  { name: "Rajesh", score: 46, title: "Happy Ears" },
  { name: "Ishaan", score: 62, title: "Contender" },
  { name: "Aditi", score: 50, title: "Happy Ears" },
  { name: "Kunal M", score: 39, title: "Happy Ears" },
  { name: "Simran", score: 67, title: "Contender" },
  { name: "Akash", score: 35, title: "The Brochure" },
];

export function getSeedLeaderboard(): LeaderboardEntry[] {
  return [...SEED_ENTRIES].sort((a, b) => b.score - a.score);
}
