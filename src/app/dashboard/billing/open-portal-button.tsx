"use client";

import { useTransition } from "react";
import { Settings } from "lucide-react";
import { openCustomerPortal } from "./actions";

export function OpenPortalButton() {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await openCustomerPortal();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="lg-cta-primary disabled:opacity-60"
    >
      <Settings className="h-4 w-4" />
      {pending ? "Abriendo…" : "Gestionar suscripción"}
    </button>
  );
}
