import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from '@firebase/firestore';
import { db } from './firebase';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Edit2, Save, X, Trash2 } from 'lucide-react';

const InventoryScreen = () => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', price: 0, stock: 0 });
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', price: 0, stock: 0 });

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredItems(filtered.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
            setFilteredItems(items.sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [searchQuery, items]);

    const fetchItems = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'inventory'));
            const fetchedItems = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            const sortedItems = fetchedItems.sort((a, b) => a.name.localeCompare(b.name));
            setItems(sortedItems);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItem((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const { name, price, stock } = newItem;
            if (!name || price <= 0 || stock <= 0) {
                alert('Please fill in all fields correctly.');
                return;
            }

            await addDoc(collection(db, 'inventory'), {
                name,
                price: parseFloat(price),
                stock: parseFloat(stock),
            });

            await fetchItems();
            setNewItem({ name: '', price: 0, stock: 0 });
            alert('Item added successfully!');
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Failed to add item. Try again.');
        }
    };

    const startEdit = (item) => {
        setEditingItem(item.id);
        setEditForm({
            name: item.name,
            price: item.price,
            stock: item.stock
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setEditForm({ name: '', price: 0, stock: 0 });
    };

    const handleUpdateItem = async (id) => {
        try {
            const itemRef = doc(db, 'inventory', id);
            await updateDoc(itemRef, {
                name: editForm.name,
                price: parseFloat(editForm.price),
                stock: parseFloat(editForm.stock)
            });

            await fetchItems();
            setEditingItem(null);
            alert('Item updated successfully!');
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item. Try again.');
        }
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'inventory', id));
                await fetchItems();
                alert('Item deleted successfully!');
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Failed to delete item. Try again.');
            }
        }
    };

    const formatStockValue = (value) => {
        return parseFloat(value).toFixed(3).replace(/\.?0+$/, '');
    };

    return (
        <div className="p-6">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Add New Item</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddItem} className="space-y-4">
                        <div>
                            <label className="block font-semibold mb-1">Item Name</label>
                            <input
                                type="text"
                                name="name"
                                value={newItem.name}
                                onChange={handleInputChange}
                                className="border p-2 w-full rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Price(KSH)</label>
                            <input
                                type="number"
                                name="price"
                                value={newItem.price}
                                onChange={handleInputChange}
                                className="border p-2 w-full rounded"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Stock</label>
                            <input
                                type="number"
                                name="stock"
                                value={newItem.stock}
                                onChange={handleInputChange}
                                className="border p-2 w-full rounded"
                                step="0.001"
                                min="0"
                                required
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Add Item
                        </button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Current Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="border p-4 rounded">
                                {editingItem === item.id ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            name="name"
                                            value={editForm.name}
                                            onChange={handleEditInputChange}
                                            className="border p-2 w-full rounded"
                                        />
                                        <input
                                            type="number"
                                            name="price"
                                            value={editForm.price}
                                            onChange={handleEditInputChange}
                                            className="border p-2 w-full rounded"
                                            step="0.01"
                                            min="0"
                                        />
                                        <input
                                            type="number"
                                            name="stock"
                                            value={editForm.stock}
                                            onChange={handleEditInputChange}
                                            className="border p-2 w-full rounded"
                                            step="0.001"
                                            min="0"
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleUpdateItem(item.id)}
                                                className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                            >
                                                <Save className="w-4 h-4" /> Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="flex items-center gap-1 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                                            >
                                                <X className="w-4 h-4" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-lg">{item.name}</h3>
                                            <div className="text-gray-600">
                                                <p>Price: KSH {item.price.toFixed(2)}</p>
                                                <p className={`${item.stock <= 10 ? 'text-red-500' : ''}`}>
                                                    Stock: {formatStockValue(item.stock)} units
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {items.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No items in inventory</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InventoryScreen;
