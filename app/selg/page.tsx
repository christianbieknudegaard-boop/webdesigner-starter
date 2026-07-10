import SellForm from "@/components/SellForm";

export const metadata = {
  title: "Selg en bok",
};

export default function SellPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-dark">Selg en bok</h1>
      <p className="mt-2 text-muted">
        Legg ut boken din på under ett minutt. Det er gratis å legge ut – vi
        tar først et lite gebyr når boken er solgt.
      </p>
      <SellForm />
    </div>
  );
}
