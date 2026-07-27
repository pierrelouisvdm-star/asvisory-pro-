import { useEffect } from 'react';

// Compatibility shim: Amplifi's spec calls the launch endpoint at
// `/amplifi/v1/auth/launch?token=...`, but our Kubernetes ingress reserves
// `/api/*` for backend routes and sends everything else to the React app —
// so a raw `/amplifi/v1/...` URL would land on our 404. This component
// intercepts that path, preserves the query string, and hard-redirects the
// browser to `/api/amplifi/v1/...` where the FastAPI handler actually lives.
//
// One-line handler so Amplifi (and anyone else consuming the spec verbatim)
// gets a working URL without us leaking the internal ingress detail.
export const AmplifiRedirect = () => {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    // Strip a possible leading /amplifi and rebuild under /api/amplifi.
    const target = `/api${pathname}${search}${hash}`;
    window.location.replace(target);
  }, []);

  // Minimal visible fallback in case the JS redirect is delayed.
  return (
    <div
      className="min-h-screen bg-navy-950 flex items-center justify-center text-slate-400 text-sm"
      data-testid="amplifi-redirect"
    >
      Redirecting…
    </div>
  );
};

export default AmplifiRedirect;
