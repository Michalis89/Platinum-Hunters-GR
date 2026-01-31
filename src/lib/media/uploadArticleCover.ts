const API_PATH = '/api/uploads/article-cover';

export async function uploadArticleCoverImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(API_PATH, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data && typeof data.message === 'string'
        ? data.message
        : 'Αποτυχία ανέβασμα εικόνας. Δοκίμασε ξανά.';
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.url) {
    throw new Error('Δεν λάβαμε URL εικόνας από τον server.');
  }

  return data.url as string;
}
