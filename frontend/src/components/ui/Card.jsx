
import React from 'react';

const Card = ({ children, className = '', title, subtitle, actions }) => {
    return (
        <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
            {(title || subtitle || actions) && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                        {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
                        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            <div className="p-4">{children}</div>
        </div>
    );
};

export default Card;