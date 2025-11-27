import RegisterForm from '@/app/components/auth/RegisterForm';
import { PageWrapper } from '@/app/components/layout/PageWrapper';

export const metadata = {
  title: 'Εγγραφή | Platinum Hunters GR',
  description: 'Δημιουργήστε λογαριασμό στο Platinum Hunters GR',
};

export default function RegisterPage() {
  return (
    <PageWrapper>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <RegisterForm />
        </div>
      </div>
    </PageWrapper>
  );
}
