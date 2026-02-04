import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
    const session = await locals.getSession()

    return {
        session,
        pathname: url.pathname
    }
}
