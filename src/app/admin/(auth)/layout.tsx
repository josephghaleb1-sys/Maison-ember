import { Flame } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-ember-600 text-white">
            <Flame className="size-6" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Maison Ember</h1>
          <p className="text-sm text-charcoal-300">Business dashboard</p>
        </div>
        <div className="rounded-xl border border-charcoal-800 bg-charcoal-900 p-6 shadow-xl sm:p-8">{children}</div>
      </div>
    </div>
  );
}
