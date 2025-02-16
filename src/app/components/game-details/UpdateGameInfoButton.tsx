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
      className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
      disabled={updating}
    >
      {updating ? "🔄 Ενημέρωση..." : "🔄 Get Info & Update"}
    </button>
  );
}
