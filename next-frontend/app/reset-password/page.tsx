import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';
import PageLoader from '@/components/ui/PageLoader';
import './reset-password.css';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader text="ЗАГРУЗКА..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}