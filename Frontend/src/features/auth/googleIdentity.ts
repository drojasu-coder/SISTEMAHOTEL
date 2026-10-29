interface GoogleIdentityApi {
  initialize(options: {
    client_id: string; nonce: string; auto_select: false; ux_mode: 'popup';
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(element: HTMLElement, options: {
    type: 'standard'; theme: 'outline'; size: 'large'; text: 'continue_with';
    shape: 'rectangular'; locale: string; width: number;
  }): void;
}

declare global {
  interface Window { google?: { accounts: { id: GoogleIdentityApi } } }
}

let loading: Promise<GoogleIdentityApi> | undefined;
let loadingLocale: string | undefined;
let loadedLocale: string | undefined;
let loadedScript: HTMLScriptElement | undefined;

/** GIS also localizes its visible button from the script's hl parameter.
 * Serialize language changes so a late script cannot overwrite a newer language.
 */
export function loadGoogleIdentity(locale: string): Promise<GoogleIdentityApi> {
  const language = locale === 'en' ? 'en' : 'es';
  if (loading) {
    if (loadingLocale === language) return loading;
    return loading.catch(() => undefined).then(() => loadGoogleIdentity(language));
  }
  if (loadedLocale === language && window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  loadingLocale = language;
  loading = new Promise<GoogleIdentityApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://accounts.google.com/gsi/client?hl=${language}`;
    script.async = true;
    const fail = () => { clearTimeout(timer); script.remove(); reject(new Error('GOOGLE_SCRIPT_UNAVAILABLE')); };
    const timer = window.setTimeout(fail, 15000);
    script.onload = () => {
      clearTimeout(timer);
      if (window.google?.accounts.id) {
        loadedScript?.remove(); loadedScript = script; loadedLocale = language;
        resolve(window.google.accounts.id);
      }
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  }).finally(() => { loading = undefined; loadingLocale = undefined; });
  return loading;
}
