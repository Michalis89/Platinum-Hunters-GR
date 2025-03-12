interface UpdateGameInfoButtonProps {
  readonly handleUpdateInfo: () => void;
  readonly updating: boolean;
  readonly gameDetails: {
    release_year?: number | null;
    developer?: string | null;
    publisher?: string | null;
  };
}

export default function UpdateGameInfoButton({
  handleUpdateInfo,
  updating,
  gameDetails,
}: UpdateGameInfoButtonProps) {
  const shouldShowButton =
    !gameDetails.release_year || !gameDetails.developer || !gameDetails.publisher;

  if (!shouldShowButton) return null;

  return (
    <button
      onClick={handleUpdateInfo}
      className="mt-6 w-full rounded-lg bg-blue-600 py-2 text-white transition hover:bg-blue-700"
      disabled={updating}
    >
      {updating ? '🔄 Ενημέρωση...' : '🔄 Get Info & Update'}
    </button>
  );
}
