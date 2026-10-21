import SeriesForm from "@/components/admin/SeriesForm";

export const dynamic = "force-dynamic";

export default function NewSeriesPage() {
  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Nouvelle série</h2>
      <SeriesForm />
    </div>
  );
}
