import React from 'react';

const Receipt = ({ 
  items = [], 
  total = 0,
  taxableAmount = 0,
  tax = 0,
  cashReceived = 0,
  operatorId = '01',
  receiptNumber = '00000',
  cuInvoiceNumber = '00409088900000'
}) => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB');
  const formattedTime = now.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  const safeItems = Array.isArray(items) ? items : [];
  
  // Style specifically for thermal printing
  const thermalStyles = `
    @media print {
      @page {
        margin: 0;
        width: 80mm;
      }
      body {
        margin: 0;
        padding: 0;
        width: 80mm;
        font-family: monospace;
        font-size: 12px;
        line-height: 1.2;
      }
      .receipt-content {
        padding: 10px;
      }
      .divider {
        border-top: 1px dashed #000;
        margin: 5px 0;
      }
    }
  `;

  return (
    <div className="font-mono text-sm">
      <style>{thermalStyles}</style>
      <div className="receipt-content">
        <div className="text-center">
          <div>MESHA INVESTMENTS LTD</div>
          <div>P.O. BOX 8447-00100</div>
          <div>NAIROBI</div>
        </div>

        <div className="mt-2">01 OPERATOR</div>
        <div>PIN: P051435448H</div>

        <div className="text-center mt-2">--- FISCAL RECEIPT ---</div>

        {safeItems.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span>{item.name}</span>
            <span>{item.quantity} @ {item.price.toFixed(2)} A</span>
          </div>
        ))}

        <div className="divider"></div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>TOTAL</span>
            <span>Ksh {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL A-16.00</span>
            <span>Ksh {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL TAXABLE A</span>
            <span>Ksh {taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL TAX A</span>
            <span>Ksh {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL TAXES</span>
            <span>Ksh {tax.toFixed(2)}</span>
          </div>
        </div>

        <div className="divider"></div>

        <div className="flex justify-between">
          <span>CASH</span>
          <span>Ksh {cashReceived.toFixed(2)}</span>
        </div>
        <div>{safeItems.length} ARTICLES</div>

        <div className="divider"></div>

        <div>
          Control Unit Info
          <div>CU SERIAL NO: KRAMW0042022070949889</div>
          <div>CU INVOICE NUMBER: {cuInvoiceNumber}</div>
        </div>

        <div className="text-center mt-2">
          <div>FISCAL RECEIPT N: {receiptNumber}</div>
          <div>{formattedDate} {formattedTime}</div>
          <div>FISCAL RECEIPT</div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;