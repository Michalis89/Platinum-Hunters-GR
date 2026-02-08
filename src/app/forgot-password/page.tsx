import { redirect } from 'next/navigation';

type ForgotPasswordPageProps = {
  searchParams?: Promise<{ expired?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const target = new URLSearchParams({ forgot: 'true' });

  if (params?.expired === 'true') {
    target.set('expired', 'true');
  }

  redirect(`/pages/auth/login?${target.toString()}`);
}
