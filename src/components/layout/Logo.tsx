/** Mega Store wordmark, set in the same heavy grotesk as the storefront sign. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <span className="logo__mega">MEGA</span>
      <span className="logo__store">STORE</span>
    </span>
  );
}
