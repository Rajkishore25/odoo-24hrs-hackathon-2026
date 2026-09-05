import React, { useState } from 'react';

const Tabs = ({ tabs, defaultTab, onChange, className = '' }) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        if (onChange) onChange(tabId);
    };

    return (
        <div className={className}>
            <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => handleTabChange(tab.id)}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                activeTab === tab.id
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-500'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className="pt-4">
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </div>
    );
};

export default Tabs;