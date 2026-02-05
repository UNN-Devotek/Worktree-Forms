
import React, { useState, useEffect } from 'react';

interface NotificationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
    const [preferences, setPreferences] = useState({
        emailMentions: true,
        pushAssignments: true,
        dailyDigest: false,
    });

    // Load from LocalStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('user_notification_prefs');
        if (stored) {
            try {
                setPreferences(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse notification prefs", e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('user_notification_prefs', JSON.stringify(preferences));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-96 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Notification Preferences</h2>
                
                <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Email me when mentioned (@)</span>
                        <input 
                            type="checkbox" 
                            checked={preferences.emailMentions}
                            onChange={(e) => setPreferences(p => ({ ...p, emailMentions: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Browser Push for Assignments</span>
                        <input 
                            type="checkbox" 
                            checked={preferences.pushAssignments}
                            onChange={(e) => setPreferences(p => ({ ...p, pushAssignments: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Receive Daily Digest</span>
                        <input 
                            type="checkbox" 
                            checked={preferences.dailyDigest}
                            onChange={(e) => setPreferences(p => ({ ...p, dailyDigest: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </label>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
};
