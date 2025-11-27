import LoginForm from '@/app/components/auth/LoginForm';
import { PageWrapper } from '@/app/components/layout/PageWrapper';

export const metadata = {
  title: 'Σύνδεση | Platinum Hunters GR',
  description: 'Συνδεθείτε στο Platinum Hunters GR',
};

export default function LoginPage() {
  return (
    <PageWrapper>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </PageWrapper>
  );
}
