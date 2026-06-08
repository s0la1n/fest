// app/checkout/page.tsx
import { Suspense } from 'react';
import CheckoutContent from './CheckoutContent';
import PageLoader from '@/components/ui/PageLoader';
import './checkout.css';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoader text="ЗАГРУЗКА..." />}>
      <CheckoutContent />
    </Suspense>
  );
}