import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App"; // The main dashboard component
import InventoryScreen from "./InventoryScreen"; // Inventory screen component
import SalesScreen from "./SalesScreen"; // Sales screen component

const RouterSetup = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/inventory" element={<InventoryScreen />} />
                <Route path="/sales" element={<SalesScreen />} />
            </Routes>
        </Router>
    );
};

export default RouterSetup;
