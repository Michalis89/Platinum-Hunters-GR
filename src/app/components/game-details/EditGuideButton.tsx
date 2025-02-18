import Link from "next/link";

interface EditGuideButtonProps {
  readonly gameId: number;
}

export default function EditGuideButton({ gameId }: EditGuideButtonProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="text-center mt-6">
      <Link
        href={`/pages/edit-guide/${gameId}`}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-lg transition"
      >
        ✏️ Επεξεργασία Guide
      </Link>
    </div>
  );
}
