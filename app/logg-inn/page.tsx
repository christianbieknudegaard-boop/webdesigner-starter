import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentSeller } from "@/lib/auth";

export const metadata = {
  title: "Logg inn",
};

export default async function LoginPage() {
  if (await getCurrentSeller()) redirect("/profil");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold text-brand-dark">Logg inn</h1>
      <p className="mt-2 text-muted">
        Velkommen tilbake! Logg inn for å legge ut bøker og følge salgene
        dine.
      </p>
      <AuthForm mode="login" />
    </div>
  );
}
