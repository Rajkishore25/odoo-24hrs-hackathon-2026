import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const CheckInOut = ({ onCheckIn, onCheckOut }) => {
    const { user } = useAuth();
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    const handleCheckIn = async () => {
        await onCheckIn();
        setIsCheckedIn(true);
    };

    const handleCheckOut = async () => {
        await onCheckOut();
        setIsCheckedIn(false);
    };

    if (user?.role !== 'EMPLOYEE') {
        return null;
    }

    return (
        <div className="flex gap-3">
            {!isCheckedIn ? (
                <button
                    onClick={handleCheckIn}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    Check In
                </button>
            ) : (
                <button
                    onClick={handleCheckOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Check Out
                </button>
            )}
        </div>
    );
};

export default CheckInOut;