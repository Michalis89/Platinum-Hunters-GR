import Link from 'next/link';

interface EditGuideButtonProps {
  readonly gameId: number;
}

export default function EditGuideButton({ gameId }: EditGuideButtonProps) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="mt-6 text-center">
      <Link
        href={`/pages/edit-guide/${gameId}`}
        className="rounded-lg bg-blue-600 px-4 py-3 text-lg transition hover:bg-blue-700"
      >
        ✏️ Επεξεργασία Guide
      </Link>
    </div>
  );
}
