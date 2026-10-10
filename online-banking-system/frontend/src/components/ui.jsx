import { twMerge } from 'tailwind-merge';

export function Card({ children, className = '' }) {
  return <div className={twMerge('bg-white rounded-xl border border-gray-200 shadow-sm p-6', className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-navy">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
      {message}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={twMerge('px-4 py-2.5 rounded-lg bg-navy text-white font-medium text-sm hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={twMerge('px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors', className)}
      {...props}
    >
      {children}
    </button>
  );
}
