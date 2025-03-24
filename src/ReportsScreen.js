import React, { useState, useEffect } from "react";
import { collection, getDocs } from "@firebase/firestore";
import { db } from "./firebase";
import * as XLSX from "xlsx";

const ReportsScreen = () => {
    const [lowStockItems, setLowStockItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [previewReport, setPreviewReport] = useState(null);
    const [reportType, setReportType] = useState("daily");
    const [reportDate, setReportDate] = useState(""); // For daily report
    const [reportStartDate, setReportStartDate] = useState(""); // For other report types
    const [reportEndDate, setReportEndDate] = useState("");

    useEffect(() => {
        fetchLowStockItems();
        fetchInventory();
    }, []);

    const fetchLowStockItems = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "inventory"));
            const data = querySnapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((item) => item.stock <= 10)
                .sort((a, b) => a.name.localeCompare(b.name));
            setLowStockItems(data);
        } catch (error) {
            console.error("Error fetching low stock items:", error);
        }
    };

    const fetchInventory = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "inventory"));
            const data = querySnapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => a.name.localeCompare(b.name)); // Sort inventory alphabetically
            setInventory(data);
        } catch (error) {
            console.error("Error fetching inventory:", error);
        }
    };

    const fetchSales = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "sales"));
            const salesData = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                console.log("Raw Sale:", data); // Debugging log
                return { id: doc.id, ...data };
            });
            console.log("Fetched Sales:", salesData); // Debugging log
            return salesData;
        } catch (error) {
            console.error("Error fetching sales:", error);
            alert("Failed to fetch sales data. Please try again.");
            return [];
        }
    };

    const generateLowStockReport = () => {
        setPreviewReport({
            title: "Low Stock Report",
            content: lowStockItems.map(({ name, price, stock }) => ({
                Name: name,
                Price: `KSH ${price.toFixed(2)}`,
                "Stock Remaining": stock,
            })),
        });
    };

    const generateInventoryReport = () => {
        // Sort inventory data alphabetically for the report
        const sortedInventory = [...inventory].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
        setPreviewReport({
            title: "Inventory Report",
            content: sortedInventory.map(({ name, price, stock }) => ({
                Name: name,
                Price: `KSH ${price.toFixed(2)}`,
                Stock: stock,
            })),
        });
    };

    const generateTimeBasedReport = async () => {
        const sales = await fetchSales();

        const filteredSales = sales.filter((sale) => {
            if (!sale.timestamp) return false;

            // Convert Firestore Timestamp to JavaScript Date
            const saleDate = sale.timestamp.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);

            if (isNaN(saleDate)) return false;

            if (reportType === "daily") {
                return saleDate.toISOString().split("T")[0] === reportDate;
            } else if (["monthly", "quarterly", "yearly"].includes(reportType)) {
                const startDate = new Date(reportStartDate);
                const endDate = new Date(reportEndDate);
                return saleDate >= startDate && saleDate <= endDate;
            }
            return false;
        });

        console.log("Filtered Sales:", filteredSales); // Debugging log

        if (filteredSales.length === 0) {
            alert("No sales data found for the selected period.");
            return;
        }

        setPreviewReport({
            title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
            content: filteredSales.map(({ items, total, timestamp }) => ({
                Date: new Date(timestamp.toDate ? timestamp.toDate() : timestamp).toLocaleDateString(),
                Total: `KSH ${total.toFixed(2)}`,
                Items: items.map((item) => `${item.name} x${item.quantity}`).join(", "),
            })),
        });
    };

    const handlePrint = () => {
        if (!previewReport) {
            alert("No report to print.");
            return;
        }

        const printContent = document.getElementById("report-preview").innerHTML;
        const printWindow = window.open("", "", "width=800,height=600");
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const exportToExcel = () => {
        if (!previewReport || !previewReport.content) {
            alert("No report to export.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(previewReport.content);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `${previewReport.title}.xlsx`);
    };

    return (
        <div className="p-6">
            <h1>Reports</h1>

            <div>
                <h2>Generate Reports</h2>
                <label>Report Type:</label>
                <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                </select>

                <label>Date:</label>
                <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    disabled={reportType !== "daily"}
                />

                {["monthly", "quarterly", "yearly"].includes(reportType) && (
                    <>
                        <label>Start Date:</label>
                        <input
                            type="date"
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                        />
                        <label>End Date:</label>
                        <input
                            type="date"
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                        />
                    </>
                )}

                <button onClick={generateTimeBasedReport}>
                    Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                </button>
                <button onClick={generateLowStockReport}>Low Stock Report</button>
                <button onClick={generateInventoryReport}>Inventory Report</button>
            </div>

            {previewReport && (
                <div id="report-preview">
                    <h2>{previewReport.title}</h2>
                    <table>
                        <thead>
                            <tr>
                                {Object.keys(previewReport.content[0] || {}).map((key) => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {previewReport.content.map((row, index) => (
                                <tr key={index}>
                                    {Object.values(row).map((value, i) => (
                                        <td key={i}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div>
                <button onClick={handlePrint}>Print Report</button>
                <button onClick={exportToExcel}>Export to Excel</button>
            </div>
        </div>
    );
};

export default ReportsScreen;
