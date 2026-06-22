import { Suspense } from "react";
import DuelClient from "./DuelClient";
export const runtime = "nodejs";
export default function DuelPage() {
  return (
    <Suspense>
      <DuelClient />
    </Suspense>
  );
}
