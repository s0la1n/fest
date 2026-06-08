// app/buy-ticket/success/page.tsx
import { Suspense } from 'react';
import BuyTicketSuccessContent from './BuyTicketSuccessContent';
import PageLoader from '@/components/ui/PageLoader';
import '../buy-ticket.css'; // Или импортируйте стили здесь, если они общие

export default function BuyTicketSuccessPage() {
  return (
    <div className="ticket-page">
      <div className="ticket-container">
        <div className="ticket-card">
          <Suspense fallback={<PageLoader text="ЗАГРУЗКА..." />}>
            <BuyTicketSuccessContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}