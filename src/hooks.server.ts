import { createServerClient } from '@supabase/ssr'
import type { Handle } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/templates', '/customers']

export const handle: Handle = async ({ event, resolve }) => {
    console.log('🔒 [hooks] Processing request:', event.url.pathname)
    console.log('🔒 [hooks] All cookies:', event.cookies.getAll().map(c => c.name))

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

    // Get session helper - use getUser() for proper JWT validation
    event.locals.getSession = async () => {
        const { data: { user }, error } = await event.locals.supabase.auth.getUser()
        console.log('🔒 [hooks] getUser result:', { user: user?.email, error: error?.message })

        if (error || !user) {
            return null
        }

        // Also get the session for the full session object
        const { data: { session } } = await event.locals.supabase.auth.getSession()
        return session
    }

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        event.url.pathname.startsWith(route)
    )

    console.log('🔒 [hooks] Is protected route:', isProtectedRoute)

    if (isProtectedRoute) {
        const session = await event.locals.getSession()
        console.log('🔒 [hooks] Session exists:', !!session)

        if (!session) {
            console.log('🔒 [hooks] No session, redirecting to /')
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
