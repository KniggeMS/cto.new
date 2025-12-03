import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { AppLayout } from "@/components/AppLayout";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

// Force rebuild

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Infocus App",
    description: "Cross-platform media tracking",
};

export default async function RootLayout({
    children,
    params: { locale }
}: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <body className={inter.className}>
                <NextIntlClientProvider messages={messages}>
                    <AppLayout>
                        {children}
                    </AppLayout>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
