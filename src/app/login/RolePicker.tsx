// Stub route so the navbar account icon resolves. Real auth lands in phase 3
// (plans/03-auth-role-gate.md).
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-title font-bold text-maroon">Log in</h1>
      <p className="mt-4 text-subheading text-gray">
        Authentication is not built yet — phase 3.
      </p>
    </div>
  );
}
