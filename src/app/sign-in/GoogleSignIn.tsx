"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { SignInButton } from "./SignInButton";

/** The parts of Google Identity Services (accounts.google.com/gsi/client) this page uses. */
interface GoogleId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    hd?: string;
    context?: "signin" | "signup" | "use";
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    itp_support?: boolean;
    /** Use the browser's FedCM sign-in for the button, so returning users still get "Sign in as …" with third-party cookies blocked. */
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: {
    type: "standard" | "icon";
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    logo_alignment?: "left" | "center";
    width?: number;
  }): void;
}
declare global { interface Window { google?: { accounts?: { id?: GoogleId } } } }

/** Which client id Google's library was set up with on this page (it must only be initialised once). */
let initializedFor: string | null = null;

/** Google's button is at most 400px wide; the design's slot is 344px. */
const BUTTON_WIDTH = 344;

/**
 * "Sign in with Google", rendered by Google itself (developers.google.com/identity/gsi/web/guides/display-button).
 * Popup mode with a JavaScript callback: the ID token goes to /sign-in/google, which starts the session.
 * If Google's script can't load (blocked, offline), falls back to the redirect sign-in.
 */
export function GoogleSignIn({ clientId, hd, next }: { clientId: string; hd: string; next: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "busy" | "failed">("loading");
  const [error, setError] = useState<string | null>(null);

  const onCredential = useCallback(async ({ credential }: { credential: string }) => {
    setState("busy");
    setError(null);
    try {
      const res = await fetch("/sign-in/google", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credential, next }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Couldn't sign you in. Try again.");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign you in. Try again.");
      setState("ready");
    }
  }, [next]);

  // Google wants initialize() called once per page; the callback reads the latest handler through a ref.
  const handler = useRef(onCredential);
  useEffect(() => { handler.current = onCredential; }, [onCredential]);

  const render = useCallback(() => {
    const id = window.google?.accounts?.id;
    const el = slot.current;
    if (!id || !el) return;
    if (initializedFor !== clientId) {
      initializedFor = clientId;
      id.initialize({ client_id: clientId, callback: (r) => handler.current(r), hd, context: "signin", ux_mode: "popup", auto_select: false, itp_support: true, use_fedcm_for_button: true });
    }
    id.renderButton(el, {
      type: "standard", theme: "outline", size: "large", text: "signin_with", shape: "rectangular", logo_alignment: "left",
      width: Math.min(BUTTON_WIDTH, el.parentElement?.clientWidth || BUTTON_WIDTH),
    });
    setState((s) => (s === "loading" ? "ready" : s));
  }, [clientId, hd]);

  // The script stays loaded across client navigations; render straight away when it's already there.
  useEffect(() => { render(); }, [render]);

  return (
    <div className="login-google">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={render} onError={() => setState("failed")} />
      {state === "failed"
        ? <SignInButton next={next} />
        : <div ref={slot} className="login-google-btn" aria-busy={state !== "ready"} />}
      {state === "busy" && <p className="login-status" role="status">Signing you in…</p>}
      {error && <p className="signin-error" role="alert">{error}</p>}
    </div>
  );
}
