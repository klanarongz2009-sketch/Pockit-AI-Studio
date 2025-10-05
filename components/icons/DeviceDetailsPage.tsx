import React, { useState, useEffect } from 'react';
import { PageWrapper, PageHeader } from '../PageComponents';
import { LoadingSpinner } from '../LoadingSpinner';

interface DeviceDetailsPageProps {
    onClose: () => void;
}

interface DeviceInfo {
    [category: string]: { [key: string]: string | number };
}

export const DeviceDetailsPage: React.FC<DeviceDetailsPageProps> = ({ onClose }) => {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getInfo = async () => {
            const info: DeviceInfo = {
                "Browser & OS": {
                    "User Agent": navigator.userAgent,
                    "Platform": navigator.platform,
                    "Language": navigator.language,
                    "Online": navigator.onLine ? 'Yes' : 'No',
                    "Cookies Enabled": navigator.cookieEnabled ? 'Yes' : 'No',
                },
                "Hardware": {
                    "CPU Cores": navigator.hardwareConcurrency,
                    "Device Memory (GB, approx.)": (navigator as any).deviceMemory || 'N/A',
                },
                "Screen": {
                    "Resolution": `${window.screen.width}x${window.screen.height}`,
                    "Available Resolution": `${window.screen.availWidth}x${window.screen.availHeight}`,
                    "Color Depth": `${window.screen.colorDepth}-bit`,
                    "Pixel Depth": `${window.screen.pixelDepth}-bit`,
                }
            };

            if (navigator.storage && navigator.storage.estimate) {
                try {
                    const estimate = await navigator.storage.estimate();
                    info["Storage (Browser)"] = {
                        "Usage": `${((estimate.usage || 0) / 1024 / 1024).toFixed(2)} MB`,
                        "Quota": `${((estimate.quota || 0) / 1024 / 1024).toFixed(2)} MB`,
                    };
                } catch (e) {
                    info["Storage (Browser)"] = { "Error": "Could not retrieve storage info." };
                }
            }

            setDeviceInfo(info);
            setIsLoading(false);
        };
        getInfo();
    }, []);

    const renderInfo = () => {
        if (isLoading) {
            return <LoadingSpinner text="Analyzing device..." />;
        }
        if (!deviceInfo) {
            return <p>Could not retrieve device information.</p>;
        }
        return (
            <div className="space-y-4">
                {Object.entries(deviceInfo).map(([category, details]) => (
                    <div key={category}>
                        <h3 className="font-press-start text-brand-cyan mb-2">{category}</h3>
                        <div className="bg-black/20 p-2 border border-brand-light/20">
                            {Object.entries(details).map(([key, value]) => (
                                <div key={key} className="flex text-xs border-b border-brand-light/10 py-1">
                                    <span className="w-2/5 text-brand-light/80 break-words">{key}:</span>
                                    <span className="w-3/5 text-brand-light break-words">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <PageWrapper>
            <PageHeader title="Device Spy" onBack={onClose} />
            <main id="main-content" className="w-full max-w-2xl flex-grow overflow-y-auto font-sans pr-2 space-y-6">
                {renderInfo()}
            </main>
        </PageWrapper>
    );
};