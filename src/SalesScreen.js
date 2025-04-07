import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, addDoc } from "@firebase/firestore";
import { db } from "./firebase";
import Receipt from "./Receipt";

const SalesScreen = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [inventory, setInventory] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [cashReceived, setCashReceived] = useState(0);
    const [mpesaCode, setMpesaCode] = useState("");
    const [currentSale, setCurrentSale] = useState(null);

    // Fetch inventory data
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "inventory"));
                const items = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                // Sort items alphabetically by name
                items.sort((a, b) => a.name.localeCompare(b.name));
                setInventory(items);
            } catch (error) {
                console.error("Error fetching inventory:", error);
            }
        };

        fetchInventory();
    }, []);

    // Filter inventory based on search
    useEffect(() => {
        setFilteredItems(
            inventory.filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    }, [searchQuery, inventory]);

    // Calculate totals (VAT inclusive)
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const baseAmount = total / 1.16; // Remove VAT from total
    const taxAmount = total - baseAmount; // Calculate VAT amount
    const change = cashReceived - total;

    // Add item to cart
    const addToCart = (item) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
            if (existingItem) {
                if (existingItem.quantity + 1 > item.stock) {
                    alert(`Only ${item.stock} items available in stock`);
                    return prevCart;
                }
                return prevCart.map((cartItem) =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    // Update item quantity
    const updateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) return;

        setCart((prevCart) =>
            prevCart.map((item) => {
                if (item.id === id) {
                    const inventoryItem = inventory.find((i) => i.id === id);
                    if (newQuantity > inventoryItem.stock) {
                        alert(`Only ${inventoryItem.stock} items available in stock`);
                        return item;
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    // Update item price with negotiation
    const updatePrice = (id, newPrice) => {
        const item = cart.find((cartItem) => cartItem.id === id);
        const originalPrice = item.price;

        // Ensure new price is within the acceptable range
        const minPrice = originalPrice - 50;
        const maxPrice = originalPrice + 100;

        const price = parseFloat(newPrice);

        if (price < minPrice || price > maxPrice) {
            alert(`Price must be between KSH ${minPrice.toFixed(2)} and KSH ${maxPrice.toFixed(2)}.`);
            return;
        }
        if (price < 0) {
            alert("Price cannot be negative.");
            return;
        }

        setCart((prevCart) =>
            prevCart.map((cartItem) =>
                cartItem.id === id ? { ...cartItem, price: price } : cartItem
            )
        );
    };

    // Remove item from cart
    const removeFromCart = (id) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    };

    // Validate payment
    const validatePayment = () => {
        if (cart.length === 0) {
            alert("Cart is empty");
            return false;
        }

        if (paymentMethod === "cash" && parseFloat(cashReceived) < total) {
            alert("Insufficient cash received");
            return false;
        }

        if (paymentMethod === "mpesa" && !mpesaCode.trim()) {
            alert("Please enter M-Pesa transaction code");
            return false;
        }

        return true;
    };

    // Handle checkout
    const handleCheckout = async () => {
        if (!validatePayment()) {
            return;
        }

        try {
            // Create sale record with notifications for lower prices
            const saleData = {
                items: cart
                    .sort((a, b) => a.name.localeCompare(b.name)) // Sort items alphabetically
                    .map((item) => {
                        const inventoryItem = inventory.find((inv) => inv.id === item.id);
                        const notification =
                            item.price < inventoryItem.price
                                ? `Item "${item.name}" was sold for KSH ${item.price.toFixed(
                                      2
                                  )}, lower than the original price of KSH ${inventoryItem.price.toFixed(
                                      2
                                  )}.`
                                : null;
                        return {
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            totalPrice: item.price * item.quantity,
                            notification,
                        };
                    }),
                netAmount: baseAmount,
                vat: taxAmount,
                total,
                paymentMethod,
                cashReceived: paymentMethod === "cash" ? parseFloat(cashReceived) : 0,
                mpesaCode: paymentMethod === "mpesa" ? mpesaCode : "",
                timestamp: new Date(),
                change: paymentMethod === "cash" ? change : 0,
            };

            // Add to sales collection
            const saleRef = await addDoc(collection(db, "sales"), saleData);

            // Update inventory
            for (const cartItem of cart) {
                const itemRef = doc(db, "inventory", cartItem.id);
                const inventoryItem = inventory.find((item) => item.id === cartItem.id);
                const newStock = inventoryItem.stock - cartItem.quantity;

                if (newStock < 0) {
                    throw new Error(`Insufficient stock for ${cartItem.name}`);
                }

                await updateDoc(itemRef, { stock: newStock });
            }

            // Update local inventory state
            setInventory((prevInventory) =>
                prevInventory.map((item) => {
                    const cartItem = cart.find((ci) => ci.id === item.id);
                    if (cartItem) {
                        return { ...item, stock: item.stock - cartItem.quantity };
                    }
                    return item;
                })
            );

            setCurrentSale({
                ...saleData,
                id: saleRef.id,
            });
            setShowReceipt(true);
        } catch (error) {
            console.error("Error processing sale:", error);
            alert(`Failed to complete the sale: ${error.message}`);
        }
    };

    // Start new sale
    const handleNewSale = () => {
        setShowReceipt(false);
        setCart([]);
        setCashReceived(0);
        setMpesaCode("");
        setPaymentMethod("cash");
        setCurrentSale(null);
    };

    return (
        <div className="p-4">
            {!showReceipt ? (
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold">Point Of Sales Screen</h1>

                    {/* Search Bar */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 border rounded shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Inventory List */}
                        <div className="border rounded-lg p-4 bg-white shadow">
                            <h2 className="text-xl font-semibold mb-4">Available Items</h2>
                            <div className="space-y-2">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-center p-2 border rounded hover:bg-gray-50"
                                    >
                                        <div>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-sm text-gray-600">
                                                Stock: {item.stock} | Price (incl. VAT): KSH {item.price}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => addToCart(item)}
                                            disabled={item.stock === 0}
                                            className={`px-3 py-1 rounded ${
                                                item.stock === 0
                                                    ? "bg-gray-300 cursor-not-allowed"
                                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                            }`}
                                        >
                                            {item.stock === 0 ? "Out of Stock" : "Add to Cart"}
                                        </button>
                                    </div>
                                ))}
                                {filteredItems.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">No items found</p>
                                )}
                            </div>
                        </div>

                        {/* Cart */}
                        <div className="border rounded-lg p-4 bg-white shadow">
                            <h2 className="text-xl font-semibold mb-4">Cart</h2>
                            <div className="space-y-4">
                                {cart.length > 0 ? (
                                    <>
                                        <div className="space-y-2">
                                            {cart.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex justify-between items-center p-2 border rounded"
                                                >
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() =>
                                                                    updateQuantity(item.id, item.quantity - 1)
                                                                }
                                                                className="text-gray-500 hover:text-gray-700"
                                                            >
                                                                -
                                                            </button>
                                                            <span>{item.quantity}</span>
                                                            <button
                                                                onClick={() =>
                                                                    updateQuantity(item.id, item.quantity + 1)
                                                                }
                                                                className="text-gray-500 hover:text-gray-700"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            Price per Item: KSH {item.price.toFixed(2)}
                                                            <div>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Negotiate Price"
                                                                    onBlur={(e) =>
                                                                        updatePrice(item.id, e.target.value)
                                                                    }
                                                                    className="mt-2 p-1 border rounded"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="text-xl font-semibold mt-4">Total: KSH {total.toFixed(2)}</div>

                                        {/* Payment */}
                                        <div className="mt-4">
                                            <label className="block font-medium">Payment Method</label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full p-2 border rounded"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="mpesa">M-Pesa</option>
                                            </select>
                                        </div>

                                        {paymentMethod === "cash" && (
                                            <div className="mt-4">
                                                <label className="block font-medium">Cash Received</label>
                                                <input
                                                    type="number"
                                                    value={cashReceived}
                                                    onChange={(e) => setCashReceived(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    min={total}
                                                />
                                                {parseFloat(cashReceived) >= total && (
                                                    <div className="text-green-600 mt-1">
                                                        Change: KSH {(parseFloat(cashReceived) - total).toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {paymentMethod === "mpesa" && (
                                            <div className="mt-4">
                                                <label className="block font-medium">M-Pesa Transaction Code</label>
                                                <input
                                                    type="text"
                                                    value={mpesaCode}
                                                    onChange={(e) => setMpesaCode(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="e.g. QWE123456"
                                                />
                                            </div>
                                        )}

                                        <button
                                            onClick={handleCheckout}
                                            className="w-full mt-4 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600"
                                        >
                                            Checkout
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-center text-gray-500 py-4">Your cart is empty</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <Receipt
                    sale={currentSale}
                    onNewSale={handleNewSale}
                />
            )}
        </div>
    );
};

export default SalesScreen;