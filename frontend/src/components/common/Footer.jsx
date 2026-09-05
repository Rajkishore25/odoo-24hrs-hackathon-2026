import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} PeoplePay360. All rights reserved.
        </footer>
    );
};

export default Footer;