import PageHeader from '@/components/PageHeader';

export default function RestaurantPayments() {
  return (
    <div>
      <PageHeader title="Payments" subtitle="Settlement and commission tracking" />
      <div className="card p-10 text-center">
        <p className="text-base text-slate-500">Payment settlement details will appear here as reservations are completed.</p>
      </div>
    </div>
  );
}
