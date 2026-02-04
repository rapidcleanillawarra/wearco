import { createServerClient } from '@supabase/ssr'
import type { Handle } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/templates', '/customers']

export const handle: Handle = async ({ event, resolve }) => {
    // Create Supabase client with cookies
    event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return event.cookies.getAll()
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
                cookiesToSet.forEach(({ name, value, options }) =>
                    event.cookies.set(name, value, { ...options, path: '/' })
                )
            },
        },
    })

    // Get session helper
    event.locals.getSession = async () => {
        const {
            data: { session },
        } = await event.locals.supabase.auth.getSession()
        return session
    }

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        event.url.pathname.startsWith(route)
    )

    if (isProtectedRoute) {
        const session = await event.locals.getSession()
        if (!session) {
            throw redirect(303, '/')
        }
    }

    // Resolve the request
    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-api-version'
        },
    })
}
