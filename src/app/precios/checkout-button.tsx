"use client";

import { useTransition } from "react";
import { redirectToCheckout } from "./actions";

export function CheckoutButton({
  plan,
  cycle,
  enabled,
  label,
  variant = "ghost",
}: {
  plan: "esencial" | "profesional";
  cycle: "mensual" | "anual";
  enabled: boolean;
  label: string;
  variant?: "primary" | "ghost";
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await redirectToCheckout(formData);
    });
  }

  const baseCls =
    variant === "primary"
      ? "lg-cta-primary w-full justify-center"
      : "lg-cta-ghost w-full justify-center";

  if (!enabled) {
    return (
      <a
        href={`mailto:compras@grupoprodi.net?subject=Solicitud%20de%20suscripci%C3%B3n%20${plan}%20${cycle}`}
        className={baseCls}
      >
        {label}
      </a>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="cycle" value={cycle} />
      <button
        type="submit"
        disabled={pending}
        className={`${baseCls} disabled:opacity-60`}
      >
        {pending ? "Redirigiendo…" : label}
      </button>
    </form>
  );
}
