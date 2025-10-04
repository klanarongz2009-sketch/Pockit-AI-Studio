import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCredits } from '../contexts/CreditContext';
import * as audioService from '../services/audioService';
import { SpinningWheel } from './SpinningWheel';

const REFILL_AMOUNT = 100;
const EMERGENCY_REFILL_AMOUNT = 25;

export const EarnCreditsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { addCredits } = useCredits();

    const handleStandardRefill = () => {
        audioService.playCreditAdd();
        addCredits(REFILL_AMOUNT);
    };

    const handleEmergencyRefill = () => {
        audioService.playCreditAdd();
        addCredits(EMERGENCY_REFILL_AMOUNT);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="รับเครดิตเพิ่ม">
            <div className="space-y-6 text-center font-sans">
                
                <div className="pt-6 border-t-2 border-brand-light/30">
                    <h3 className="font-press-start text-lg text-brand-lime">วงล้อมหาสนุก</h3>
                    <p className="mt-2 text-sm text-brand-light/80">
                        เสี่ยงโชค! หมุนวงล้อเพื่อลุ้นรับเครดิตมากมาย!
                    </p>
                    <div className="mt-4 flex justify-center">
                       <SpinningWheel />
                    </div>
                </div>

                <div>
                    <h3 className="font-press-start text-lg text-brand-lime">เติมเครดิตมาตรฐาน</h3>
                    <p className="mt-2 text-sm text-brand-light/80">
                        หากเครดิตใกล้หมด รับ <strong className="text-brand-lime">{REFILL_AMOUNT} เครดิต</strong> ฟรี!
                    </p>
                    <button
                        onClick={handleStandardRefill}
                        className="w-full mt-4 p-4 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                       รับเครดิต
                    </button>
                </div>

                <div className="pt-6 border-t-2 border-brand-light/30">
                    <h3 className="font-press-start text-lg text-brand-lime">เติมเครดิตฉุกเฉิน</h3>
                    <p className="mt-2 text-sm text-brand-light/80">
                        เติมพลังด่วน! รับ <strong className="text-brand-lime">{EMERGENCY_REFILL_AMOUNT} เครดิต</strong>
                    </p>
                    <button
                        onClick={handleEmergencyRefill}
                        className="w-full mt-4 p-4 bg-brand-lime text-black border-4 border-brand-light shadow-pixel text-base font-press-start transition-all hover:bg-brand-yellow active:shadow-pixel-active active:translate-y-[2px] active:translate-x-[2px]"
                    >
                       รับเครดิตฉุกเฉิน
                    </button>
                </div>
            </div>
        </Modal>
    );
};