import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Receipt = ({ sale, onNewSale }) => {
  // Always call hooks at the top level
  const location = useLocation();
  const navigate = useNavigate();
  const receiptRef = useRef();
  
  // Use the data from props if available, otherwise from location state
  // This is a standard variable, not conditionally calling hooks
  const receiptData = sale || (location.state?.sale || {});
  const { items = [], total = 0, paymentMethod = "cash", cashReceived = 0, change = 0 } = receiptData;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    const win = window.open("", "_blank");
    win.document.write("<html><head><title>Print Receipt</title></head><body>");
    win.document.write(printContent.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString();
  };

  const handleNewSale = () => {
    if (onNewSale) {
      onNewSale();
    } else {
      navigate('/sales');
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <div 
        ref={receiptRef} 
        className="w-full max-w-md bg-white p-6 border rounded shadow-md font-mono"
      >
        <div className="text-center mb-4">
          <p className="font-bold text-lg">CO INVESTMENTS LTD</p>
          <p>--- FISCAL RECEIPT ---</p>
          <p>{getCurrentDateTime()}</p>
        </div>

        {items && items.length > 0 ? (
          <div>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left">Item</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-1">{item.name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">Ksh {item.price.toFixed(2)}</td>
                    <td className="text-right">Ksh {(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="border-t pt-2">
              <p className="flex justify-between"><span>Subtotal:</span> <span>Ksh {((total || 0) / 1.16).toFixed(2)}</span></p>
              <p className="flex justify-between"><span>VAT (16%):</span> <span>Ksh {((total || 0) - (total || 0) / 1.16).toFixed(2)}</span></p>
              <p className="flex justify-between font-bold"><span>TOTAL:</span> <span>Ksh {(total || 0).toFixed(2)}</span></p>
              
              {paymentMethod && (
                <div className="mt-2">
                  <p className="flex justify-between"><span>Payment Method:</span> <span>{paymentMethod.toUpperCase()}</span></p>
                  
                  {paymentMethod === "cash" && (
                    <>
                      <p className="flex justify-between"><span>Cash Received:</span> <span>Ksh {parseFloat(cashReceived).toFixed(2)}</span></p>
                      <p className="flex justify-between"><span>Change:</span> <span>Ksh {parseFloat(change).toFixed(2)}</span></p>
                    </>
                  )}
                  
                  {paymentMethod === "mpesa" && (
                    <p className="flex justify-between"><span>Transaction:</span> <span>Confirmed</span></p>
                  )}
                </div>
              )}
            </div>
            
            <p className="mt-4 text-center">{items.length} ARTICLE{items.length !== 1 ? 'S' : ''}</p>
          </div>
        ) : (
          <p className="text-center py-4">No items in this receipt.</p>
        )}

        <p className="text-center mt-4">FISCAL RECEIPT</p>
        <p className="text-center text-sm">Thank you for shopping with us!</p>
      </div>

      <div className="mt-4 flex space-x-4">
        <button 
          onClick={handlePrint} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Print Receipt
        </button>
        <button 
          onClick={handleNewSale} 
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          New Sale
        </button>
      </div>
    </div>
  );
};

export default Receipt;