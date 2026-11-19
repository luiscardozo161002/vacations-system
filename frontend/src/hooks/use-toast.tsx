import { toast } from 'sonner';
import { Icon } from '../components/atoms/Icon';

const showToast = (message: string) => toast(message, { icon: <Icon name="check" /> });

export const useToast = () => showToast;
