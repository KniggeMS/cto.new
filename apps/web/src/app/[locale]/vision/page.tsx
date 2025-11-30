import { VisionSearch } from '@/components/ai/VisionSearch';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslations } from 'next-intl';

export default function VisionPage() {
    const t = useTranslations('vision');

    return (
        <PageShell title={t('pageTitle')} description={t('pageDescription')}>
            <VisionSearch />
        </PageShell>
    );
}
