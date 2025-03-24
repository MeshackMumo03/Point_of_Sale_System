import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { AlertCircle, Search } from "lucide-react";
import { collection, getDocs } from "@firebase/firestore";
import { db } from "./firebase";
import InventoryScreen from "./InventoryScreen";
import SalesScreen from "./SalesScreen";
import ReportsScreen from "./ReportsScreen";

// Navigation component with styled buttons
const Navigation = () => {
    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-2">
                <div className="flex space-x-4">
                    <Link
                        to="/"
                        className="px-3 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300"
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/inventory"
                        className="px-3 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 transition-colors duration-300"
                    >
                        Inventory
                    </Link>
                    <Link
                        to="/sales"
                        className="px-3 py-2 rounded-md text-white bg-yellow-500 hover:bg-yellow-600 transition-colors duration-300"
                    >
                        Sales
                    </Link>
                    <Link
                        to="/report"
                        className="px-3 py-2 rounded-md text-white bg-purple-500 hover:bg-purple-600 transition-colors duration-300"
                    >
                        Reports
                    </Link>
                </div>
            </div>
        </nav>
    );
};

// Main App component (Dashboard)
const App = () => {
    const [inventory, setInventory] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredInventory, setFilteredInventory] = useState([]);

    // Fetch inventory data
    useEffect(() => {
        fetchInventory();
    }, []);

    // Filter inventory based on search query
    useEffect(() => {
        if (searchQuery) {
            const filtered = inventory.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredInventory(filtered);
            setLowStockItems(filtered.filter((item) => item.stock <= 25));
        } else {
            setFilteredInventory(inventory);
            setLowStockItems(inventory.filter((item) => item.stock <= 25));
        }
    }, [searchQuery, inventory]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "inventory"));
            const items = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })).sort((a, b) => a.name.localeCompare(b.name));
            setInventory(items);
            setFilteredInventory(items);
            setLowStockItems(items.filter((item) => item.stock <= 25));
        } catch (error) {
            console.error("Error fetching inventory:", error);
        }
        setLoading(false);
    };

    return (
        <Router>
            <div className="p-6 space-y-6">
                <Navigation />
                
                <Routes>
                    <Route
                        path="/"
                        element={
                            <>
                                <div className="mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search inventory..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 pr-4 py-2 w-full border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Current Inventory</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {loading ? (
                                                    <p className="text-gray-500 text-center">Loading...</p>
                                                ) : filteredInventory.length > 0 ? (
                                                    filteredInventory.map((item) => (
                                                        <p key={item.id} className="flex justify-between">
                                                            <span>{item.name}</span>
                                                            <span className="font-medium">{item.stock} units</span>
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-500 text-center">No items found</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {lowStockItems.length > 0 && (
                                        <Card className="bg-yellow-50 border-yellow-200">
                                            <CardHeader className="flex flex-row items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                                                <CardTitle className="text-yellow-700">Low Stock Alert</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {lowStockItems.map((item) => (
                                                        <li key={item.id} className="flex justify-between">
                                                            <span>{item.name}</span>
                                                            <span className="text-yellow-700 font-medium">{item.stock} units remaining</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </>
                        }
                    />
                    
                    <Route path="/inventory" element={<InventoryScreen />} />
                    <Route path="/sales" element={<SalesScreen />} />
                    <Route path="/report" element={<ReportsScreen />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;