import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const session = await locals.getSession();

    if (!session) {
        throw redirect(303, '/');
    }

    return {
        profile: {
            email: session.user.email,
            displayName: session.user.user_metadata.display_name || ''
        }
    };
};

export const actions: Actions = {
    updateProfile: async ({ request, locals }) => {
        const formData = await request.formData();
        const displayName = formData.get('displayName') as string;

        const { error } = await locals.supabase.auth.updateUser({
            data: { display_name: displayName }
        });

        if (error) {
            return fail(500, {
                message: 'Could not update profile',
                success: false,
                error: error.message
            });
        }

        return {
            success: true,
            message: 'Profile updated successfully'
        };
    },

    updatePassword: async ({ request, locals }) => {
        const formData = await request.formData();
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            return fail(400, {
                message: 'Passwords do not match',
                success: false,
                error: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return fail(400, {
                message: 'Password must be at least 6 characters',
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        const { error } = await locals.supabase.auth.updateUser({
            password: password
        });

        if (error) {
            return fail(500, {
                message: 'Could not update password',
                success: false,
                error: error.message
            });
        }

        return {
            success: true,
            message: 'Password updated successfully'
        };
    }
};
