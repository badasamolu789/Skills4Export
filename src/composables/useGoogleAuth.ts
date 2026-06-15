const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let googleScriptLoadingPromise: Promise<void> | null = null
let googleScriptLoaded = false

declare global {
    interface Window {
        google?: {
            accounts?: {
                id?: {
                    initialize: (options: {
                        client_id: string
                        callback: (response: { credential?: string }) => void
                        cancel_on_tap_outside?: boolean
                        context?: 'signin' | 'signup'
                    }) => void
                    prompt: (notification?: {
                        isNotDisplayed: boolean
                        isSkippedMoment: boolean
                        isDismissedMoment: boolean
                        momentType: string
                    }) => void
                    disableAutoSelect: () => void
                }
            }
        }
    }
}

const getGoogleClientId = () => import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''

const loadGoogleIdentityScript = async (): Promise<void> => {
    if (typeof window === 'undefined') {
        throw new Error('Google sign-in can only run in a browser.')
    }

    if (googleScriptLoaded) {
        return
    }

    if (googleScriptLoadingPromise) {
        return googleScriptLoadingPromise
    }

    googleScriptLoadingPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
        )

        if (existingScript) {
            if (window.google?.accounts?.id) {
                googleScriptLoaded = true
                resolve()
                return
            }

            existingScript.addEventListener('load', () => {
                googleScriptLoaded = true
                resolve()
            })
            existingScript.addEventListener('error', () => reject(new Error('Failed to load the Google Identity Services script.')))
            return
        }

        const script = document.createElement('script')
        script.src = GOOGLE_IDENTITY_SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = () => {
            googleScriptLoaded = true
            resolve()
        }
        script.onerror = () => reject(new Error('Failed to load the Google Identity Services script.'))
        document.head.appendChild(script)
    })

    return googleScriptLoadingPromise
}

export const isGoogleClientConfigured = () => Boolean(getGoogleClientId())

export const requestGoogleIdToken = async (
    context: 'signin' | 'signup' = 'signin',
): Promise<string> => {
    if (typeof window === 'undefined') {
        throw new Error('Google sign-in can only be used in the browser.')
    }

    const clientId = getGoogleClientId()
    if (!clientId) {
        throw new Error('Missing Google client ID. Add VITE_GOOGLE_CLIENT_ID to your environment.')
    }

    await loadGoogleIdentityScript()

    const accountsId = window.google?.accounts?.id
    if (!accountsId?.initialize || !accountsId?.prompt) {
        throw new Error('Google Identity Services is unavailable in this browser.')
    }

    return new Promise((resolve, reject) => {
        let resolvedOrRejected = false

        const finish = (value: string) => {
            if (!resolvedOrRejected) {
                resolvedOrRejected = true
                resolve(value)
            }
        }

        const fail = (error: Error) => {
            if (!resolvedOrRejected) {
                resolvedOrRejected = true
                reject(error)
            }
        }

        accountsId.initialize({
            client_id: clientId,
            callback: (response) => {
                if (response?.credential) {
                    finish(response.credential)
                    return
                }

                fail(new Error('Google did not return a credential.'))
            },
            cancel_on_tap_outside: false,
            context,
        })

        try {
            accountsId.prompt()
        } catch (error) {
            fail(
                error instanceof Error
                    ? error
                    : new Error('Google sign-in could not be started. Please try again.'),
            )
        }
    })
}
