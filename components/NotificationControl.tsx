import React, { useState, useEffect, useCallback } from 'react';
import * as notificationService from '../services/notificationService';
import * as audioService from '../services/audioService';
import { BellIcon } from './icons/BellIcon';
import { BellOffIcon } from './icons/BellOffIcon';

interface NotificationControlProps {
    playSound: (player: () => void) => void;
}

export const NotificationControl: React.FC<NotificationControlProps> = ({ playSound }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        setPermission(notificationService.getPermissionState());
    }, []);

    const handleRequestPermission = useCallback(async () => {
        playSound(audioService.playClick);
        const newPermission = await notificationService.requestPermission();
        setPermission(newPermission);
    }, [playSound]);

    const getStatusTextAndIcon = () => {
        switch(permission) {
            case 'granted':
                return { text: 'เปิดใช้งาน', icon: <BellIcon className="w-4 h-4" />, disabled: true, title: "การแจ้งเตือนเปิดใช้งานอยู่" };
            case 'denied':
                return { text: 'ถูกบล็อก', icon: <BellOffIcon className="w-4 h-4" />, disabled: true, title: "โปรดเปิดการแจ้งเตือนในการตั้งค่าเบราว์เซอร์" };
            case 'default':
            default:
                 return { text: 'เปิดการแจ้งเตือน', icon: <BellOffIcon className="w-4 h-4" />, disabled: false, title: "คลิกเพื่อเปิดใช้งานการแจ้งเตือน" };
        }
    }
    
    const { text, icon, disabled, title } = getStatusTextAndIcon();

    return (
        <button
            onClick={handleRequestPermission}
            onMouseEnter={() => !disabled && playSound(audioService.playHover)}
            disabled={disabled}
            title={title}
            className="flex items-center gap-2 text-[10px] text-brand-light/50 hover:text-brand-yellow disabled:hover:text-brand-light/50 disabled:cursor-not-allowed transition-colors"
        >
            {icon}
            <span>การแจ้งเตือน: {text}</span>
        </button>
    );
};