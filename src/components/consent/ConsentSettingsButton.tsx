"use client";
import { useConsent } from "./ConsentProvider";

export function ConsentSettingsButton() {
  const { status, reopen } = useConsent();
  if (status === "not-required") return <p className="text-sm text-fog">Werbung ist auf dieser Seite nicht aktiviert.</p>;
  return (
    <button type="button" className="btn btn-secondary self-start" onClick={reopen}>
      Werbeeinstellung ändern ({status === "granted" ? "erlaubt" : status === "denied" ? "nicht erlaubt" : "nicht gewählt"})
    </button>
  );
}
