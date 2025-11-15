import { AuthStackParamList } from '@/navigation/AuthStack';
import { AppTabsParamList } from '@/navigation/AppTabs';

export type RootStackParamList = {
  Auth: AuthStackParamList;
  App: AppTabsParamList;
};
