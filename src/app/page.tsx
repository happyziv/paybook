import { Dashboard } from "@/components/Dashboard";
import { PinGate } from "@/components/PinGate";
import { SetupForm } from "@/components/SetupForm";
import { hasValidSession } from "@/lib/auth";
import { getCurrentMonthKey } from "@/lib/month";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const isAuthed = await hasValidSession();

  if (!isAuthed) {
    return <PinGate />;
  }

  const repository = getRepository();
  const household = await repository.getHousehold();

  if (!household) {
    return <SetupForm />;
  }

  const month = getCurrentMonthKey();
  const data = await repository.getMonthlyData(month);

  return <Dashboard initialData={data} />;
}
