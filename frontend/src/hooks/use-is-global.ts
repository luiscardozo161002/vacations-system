import { config } from '../config';
import { useAuth } from '../contexts/auth-context';

export const useIsGlobal = (): boolean => useAuth().user?.role.role_code === config.roles.global;
