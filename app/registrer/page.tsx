import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentSeller } from "@/lib/auth";

export const metadata = {
  title: "Opprett konto",
};

export default async function RegisterPage() {
  if (await getCurrentSeller()) redirect("/profil");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold text-brand-dark">Opprett konto</h1>
      <p className="mt-2 text-muted">
        Gratis og gjort på under ett minutt – så kan du legge ut din første
        bok med en gang.
      </p>
      <AuthForm mode="register" />
    </div>
  );
}
