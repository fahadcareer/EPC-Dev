import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveUsers = ({ users = [] }) => {
    // Limit to 5 users, show "+X" for the rest
    const displayUsers = users.slice(0, 5);
    const extraCount = users.length - 5;

    return (
        <div className="flex -space-x-2 overflow-hidden items-center">
            <AnimatePresence>
                {displayUsers.map((user, index) => (
                    <motion.div
                        key={user.id || user.email || index}
                        initial={{ opacity: 0, scale: 0.5, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: -10 }}
                        className="relative group"
                        title={user.name}
                    >
                        <div
                            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-md cursor-pointer overflow-hidden"
                            style={{ backgroundColor: user.color || '#3b82f6' }}
                        >
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>
                            )}
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                            {user.name}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {extraCount > 0 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-md ml-1">
                    +{extraCount}
                </div>
            )}
        </div>
    );
};

export default ActiveUsers;
