import { Redirect } from 'expo-router';
import { useUserStore } from '../stores/useUserStore';

export default function Index() {
    const profile = useUserStore((state) => state.profile);
    return <Redirect href={profile ? "/(tabs)" : "/onboarding"} />;
}
