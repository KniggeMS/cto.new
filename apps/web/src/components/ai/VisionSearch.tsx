'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { aiApi } from '@/lib/api/ai';
import { Upload, Image as ImageIcon, Loader2, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export function VisionSearch() {
    const t = useTranslations('vision');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('errors.fileTooLarge'));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIdentify = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);
        setResult(null);

        try {
            const response = await aiApi.identifyMovie(selectedImage);
            if (response.analysis) {
                setResult(response.analysis);
                toast.success(t('success.identified'));
            } else {
                toast.error(t('errors.noMatch'));
            }
        } catch (error) {
            console.error('Vision search error:', error);
            toast.error(t('errors.failed'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-primary-600" />
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-gray-600">{t('description')}</p>

                    {!selectedImage ? (
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer bg-gray-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 font-medium">{t('uploadPrompt')}</p>
                            <p className="text-sm text-gray-400 mt-2">{t('uploadSubtext')}</p>
                        </div>
                    ) : (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black/5">
                            <img
                                src={selectedImage}
                                alt="Selected"
                                className="max-h-[400px] w-full object-contain mx-auto"
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-800"
                                onClick={clearImage}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                    />

                    <div className="flex justify-end">
                        <Button
                            onClick={handleIdentify}
                            disabled={!selectedImage || isAnalyzing}
                            className="w-full sm:w-auto"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('analyzing')}
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    {t('identifyButton')}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {result && (
                <Card className="bg-primary-50 border-primary-100 animate-in fade-in slide-in-from-bottom-4">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-primary-900 mb-2">{t('resultTitle')}</h3>
                        <p className="text-primary-800 leading-relaxed">{result}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
