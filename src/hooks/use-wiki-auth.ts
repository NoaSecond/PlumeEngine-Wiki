import { useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import authService from '../services/auth-service';
import { getConfigService } from '../services/config-service';
import logger from '../utils/logger';

export const useWikiAuth = () => {
    const configService = getConfigService();
    const [user, setUser] = useState<User | null>(null);
    const [guestPermissions, setGuestPermissions] = useState<string[]>([]);
    const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
    const [authLoading, setAuthLoading] = useState<boolean>(true);

    // Check authentication status
    const checkAuth = useCallback(async () => {
        try {
            setAuthLoading(true);
            // Test connectivity first
            const response = await Promise.race([
                fetch(configService.getApiUrl('/auth/verify'), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('wiki_token') || 'test'}`
                    }
                }),
                new Promise<Response>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout backend')), 3000)
                )
            ]);

            if (response.status === 401 || response.status === 403) {
                logger.warn('🔒 Session expired or invalid, forced logout');
                localStorage.removeItem('wiki_token');
                setUser(null);
            }

            setIsBackendConnected(true);

            const currentUser = await authService.checkAuth();
            if (currentUser) {
                setUser(currentUser);
                logger.info('👤 User connected:', currentUser.username);
            }
        } catch (error) {
            setIsBackendConnected(false);
            logger.warn('⚠️ Backend connection or auth failed:', error instanceof Error ? error.message : String(error));
        } finally {
            setAuthLoading(false);
        }
    }, [configService]);

    // Fetch guest permissions
    useEffect(() => {
        const fetchGuestPermissions = async () => {
            try {
                const response = await fetch(configService.getApiUrl('/auth/guest-permissions'));
                const data = await response.json();
                if (data.success) {
                    setGuestPermissions(data.permissions);
                }
            } catch (error) {
                logger.error('Error fetching guest permissions:', error instanceof Error ? error.message : String(error));
            }
        };

        if (isBackendConnected) {
            fetchGuestPermissions();
        }
    }, [isBackendConnected, configService]);

    // Permission helpers
    const isAdmin = useCallback((): boolean => {
        return user?.isAdmin === true || user?.isAdmin === 1;
    }, [user]);

    const canContribute = useCallback((): boolean => {
        return user !== null;
    }, [user]);

    const hasPermission = useCallback((permission: string): boolean => {
        if (isAdmin()) return true;
        if (user) {
            return user.permissions?.includes(permission) || false;
        }
        return guestPermissions.includes(permission);
    }, [user, guestPermissions, isAdmin]);

    // User actions
    const logout = useCallback(async () => {
        try {
            await authService.logout();
            setUser(null);
            logger.info('👋 User logged out');
        } catch (error) {
            logger.error('❌ Error logging out', error instanceof Error ? error.message : String(error));
        }
    }, []);

    const updateUser = useCallback(async (userData: Partial<User>) => {
        try {
            if (!user) throw new Error('No user connected');

            const updatedUser = { ...user, ...userData };
            setUser(updatedUser); // Optimistic update

            const token = localStorage.getItem('wiki_token');
            if (!token) throw new Error('Missing authentication token');

            const response = await fetch(configService.getApiUrl('/auth/profile'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setUser(user); // Revert
                throw new Error(data.message || 'Error updating profile');
            }

            setUser(data.user);
            logger.info('✅ User profile updated successfully');
        } catch (error) {
            logger.error('❌ Error updating profile', error instanceof Error ? error.message : String(error));
            if (user) setUser(user); // Revert
            throw error;
        }
    }, [user, configService]);

    return {
        user,
        setUser,
        guestPermissions,
        isBackendConnected,
        setIsBackendConnected,
        authLoading,
        checkAuth,
        isAdmin,
        canContribute,
        hasPermission,
        logout,
        updateUser
    };
};
