// Navigation.js
import React from "react";
import { Link } from "react-router-dom";

const Navigation = () => {
    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-2">
                <div className="flex space-x-4">
                    <Link to="/" className="px-3 py-2 rounded-md hover:bg-gray-100">
                        Dashboard
                    </Link>
                    <Link to="/inventory" className="px-3 py-2 rounded-md hover:bg-gray-100">
                        Inventory
                    </Link>
                    <Link to="/sales" className="px-3 py-2 rounded-md hover:bg-gray-100">
                        Sales
                    </Link>
                    <Link to="/report" className="px-3 py-2 rounded-md hover:bg-gray-100">
                        Report
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
