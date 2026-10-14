import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, generateInvoiceNumber } from '../utils/helpers';
import { 
  Package, DollarSign, FileText, Plus, LogOut, TrendingUp, 
  ArrowDownCircle, ArrowUpCircle, Eye, ShoppingCart
} from 'lucide-react';

type Tab = 'overview' | 'inventory' | 'purchase' | 'sales' | 'invoices';

export default function TraderDashboard() {
  const { currentUser, logout, sales, invoices, stakeholders, harvests,
    addSale, addInvoice } = useApp();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<string | null>(null);

  if (!currentUser) return null;

  const purchases = sales.filter(s => s.buyerId === currentUser.id);
  const mySales = sales.filter(s => s.sellerId === currentUser.id);
  const myInvoices = invoices.filter(i => i.sellerId === currentUser.id);
  const purchaseInvoices = invoices.filter(i => i.buyerId === currentUser.id);

  // Calculate inventory from purchases minus sales
  const inventoryMap: Record<string, { batchId: string; quantity: number; source: string }> = {};
  purchases.forEach(p => {
    if (!inventoryMap[p.batchId]) {
      inventoryMap[p.batchId] = { batchId: p.batchId, quantity: 0, source: '' };
    }
    inventoryMap[p.batchId].quantity += p.quantity;
    const seller = stakeholders.find(s => s.id === p.sellerId);
    inventoryMap[p.batchId].source = seller?.name || 'Unknown';
  });
  mySales.forEach(s => {
    if (inventoryMap[s.batchId]) {
      inventoryMap[s.batchId].quantity -= s.quantity;
    }
  });
  const inventory = Object.values(inventoryMap).filter(i => i.quantity > 0);
  const totalInventory = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalPurchaseValue = purchases.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalSalesValue = mySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'purchase', label: 'Purchase', icon: <ArrowDownCircle className="w-4 h-4" /> },
    { id: 'sales', label: 'Sell', icon: <ArrowUpCircle className="w-4 h-4" /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
  ];

  const handlePurchase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const sellerId = form.get('sellerId') as string;
    const quantity = parseFloat(form.get('quantity') as string);
    const pricePerKg = parseFloat(form.get('pricePerKg') as string);
    const batchId = form.get('batchId') as string;

    const seller = stakeholders.find(s => s.id === sellerId);
    if (!seller) return;

    const invoiceNumber = generateInvoiceNumber();
    const totalAmount = quantity * pricePerKg;

    addSale({
      sellerId,
      sellerType: 'beekeeper',
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      buyerType: 'trader',
      invoiceNumber,
      saleDate: new Date().toISOString().split('T')[0],
      quantity,
      pricePerKg,
      totalAmount,
      batchId,
      traceabilityChain: [sellerId, currentUser.id],
      status: 'completed',
    });

    addInvoice({
      invoiceNumber,
      saleId: '',
      sellerId,
      sellerName: seller.name,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      quantity,
      pricePerKg,
      totalAmount,
      batchId,
      traceabilityChain: [
        {
          stakeholderId: sellerId,
          stakeholderName: seller.name,
          stakeholderType: seller.type,
          uniqueId: seller.uniqueId,
          action: `Sold ${quantity} kg`,
          date: new Date().toISOString().split('T')[0],
        },
        {
          stakeholderId: currentUser.id,
          stakeholderName: currentUser.name,
          stakeholderType: 'trader',
          uniqueId: currentUser.uniqueId,
          action: `Purchased ${quantity} kg`,
          date: new Date().toISOString().split('T')[0],
        },
      ],
    });

    setShowModal(null);
  };

  const handleSell = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const buyerId = form.get('buyerId') as string;
    const batchId = form.get('batchId') as string;
    const quantity = parseFloat(form.get('quantity') as string);
    const pricePerKg = parseFloat(form.get('pricePerKg') as string);

    const buyer = stakeholders.find(s => s.id === buyerId);
    if (!buyer) return;

    const inv = inventoryMap[batchId];
    if (!inv || quantity > inv.quantity) {
      alert('Insufficient inventory!');
      return;
    }

    const invoiceNumber = generateInvoiceNumber();
    const totalAmount = quantity * pricePerKg;

    addSale({
      sellerId: currentUser.id,
      sellerType: 'trader',
      buyerId,
      buyerName: buyer.name,
      buyerType: buyer.type,
      invoiceNumber,
      saleDate: new Date().toISOString().split('T')[0],
      quantity,
      pricePerKg,
      totalAmount,
      batchId,
      traceabilityChain: [...(inv.source ? [inv.source] : []), currentUser.id, buyerId],
      status: 'completed',
    });

    addInvoice({
      invoiceNumber,
      saleId: '',
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      buyerId,
      buyerName: buyer.name,
      date: new Date().toISOString().split('T')[0],
      quantity,
      pricePerKg,
      totalAmount,
      batchId,
      traceabilityChain: [
        {
          stakeholderId: currentUser.id,
          stakeholderName: currentUser.name,
          stakeholderType: 'trader',
          uniqueId: currentUser.uniqueId,
          action: `Sold ${quantity} kg at ${formatCurrency(pricePerKg)}/kg`,
          date: new Date().toISOString().split('T')[0],
        },
        {
          stakeholderId: buyerId,
          stakeholderName: buyer.name,
          stakeholderType: buyer.type,
          uniqueId: buyer.uniqueId,
          action: `Purchased ${quantity} kg`,
          date: new Date().toISOString().split('T')[0],
        },
      ],
    });

    setShowModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h1 className="font-bold text-orange-900">{currentUser.name}</h1>
              <p className="text-xs text-orange-600 font-mono">ID: {currentUser.uniqueId}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-700'
                  : 'border-transparent text-gray-500 hover:text-orange-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-blue-50 text-blue-600">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">Purchases</p>
                <p className="text-xl font-bold text-gray-900">{purchases.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-amber-50 text-amber-600">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">Stock Available</p>
                <p className="text-xl font-bold text-gray-900">{totalInventory} kg</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-green-50 text-green-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSalesValue)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-purple-50 text-purple-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">Purchase Value</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPurchaseValue)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Purchases</h3>
                {purchases.length === 0 ? (
                  <p className="text-gray-500 text-sm">No purchases yet.</p>
                ) : (
                  <div className="space-y-3">
                    {purchases.slice(-3).reverse().map(p => {
                      const seller = stakeholders.find(s => s.id === p.sellerId);
                      return (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm text-blue-900">{seller?.name || 'Unknown'}</p>
                            <p className="text-xs text-blue-600">{formatDate(p.saleDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-900">{p.quantity} kg</p>
                            <p className="text-xs text-blue-600">{formatCurrency(p.totalAmount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Sales</h3>
                {mySales.length === 0 ? (
                  <p className="text-gray-500 text-sm">No sales yet.</p>
                ) : (
                  <div className="space-y-3">
                    {mySales.slice(-3).reverse().map(s => (
                      <div key={s.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-green-900">{s.buyerName}</p>
                          <p className="text-xs text-green-600">{formatDate(s.saleDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-900">{formatCurrency(s.totalAmount)}</p>
                          <p className="text-xs text-green-600">{s.quantity} kg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Current Inventory</h2>
            {inventory.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Package className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                <p className="text-gray-500">No inventory. Purchase honey from beekeepers first.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-orange-700 uppercase">Batch ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-orange-700 uppercase">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-orange-700 uppercase">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-orange-50">
                        <td className="px-4 py-3 font-mono text-sm font-medium">{item.batchId}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.source}</td>
                        <td className="px-4 py-3 text-sm font-medium text-orange-900">{item.quantity} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'purchase' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Purchase Honey</h2>
              <button onClick={() => setShowModal('purchase')} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
                <Plus className="w-4 h-4" /> Record Purchase
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Purchase History</h3>
              {purchases.length === 0 ? (
                <p className="text-gray-500 text-sm">No purchases recorded.</p>
              ) : (
                <div className="space-y-3">
                  {purchases.map(p => {
                    const seller = stakeholders.find(s => s.id === p.sellerId);
                    return (
                      <div key={p.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-900">From: {seller?.name}</p>
                          <p className="text-xs text-blue-600 font-mono">{p.invoiceNumber} • {p.batchId}</p>
                          <p className="text-xs text-gray-500">{formatDate(p.saleDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-900">{p.quantity} kg</p>
                          <p className="text-sm text-blue-700">{formatCurrency(p.totalAmount)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Sell Honey</h2>
              <button onClick={() => setShowModal('sell')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                <Plus className="w-4 h-4" /> New Sale
              </button>
            </div>
            {mySales.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <DollarSign className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                <p className="text-gray-500">No sales yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Invoice #</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Buyer</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Qty</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Total</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mySales.map(s => (
                      <tr key={s.id} className="hover:bg-green-50">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-green-900">{s.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.buyerName}</td>
                        <td className="px-4 py-3 text-sm">{s.quantity} kg</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-700">{formatCurrency(s.totalAmount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(s.saleDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">My Invoices</h2>
            {myInvoices.length === 0 && purchaseInvoices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <FileText className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                <p className="text-gray-500">No invoices yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {[...myInvoices, ...purchaseInvoices].map(inv => (
                  <div key={inv.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-orange-900">{inv.invoiceNumber}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            inv.sellerId === currentUser.id ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {inv.sellerId === currentUser.id ? 'Sold' : 'Purchased'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {inv.sellerId === currentUser.id ? `To: ${inv.buyerName}` : `From: ${inv.sellerName}`}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(inv.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-700">{formatCurrency(inv.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{inv.quantity} kg</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewInvoice(inv.id)}
                      className="mt-3 flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800 font-medium"
                    >
                      <Eye className="w-4 h-4" /> View Traceability
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Purchase Modal */}
      {showModal === 'purchase' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Record Purchase</h3>
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seller (Beekeeper)</label>
                <select name="sellerId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="">Select Seller</option>
                  {stakeholders.filter(s => s.type === 'beekeeper').map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.uniqueId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                <input name="batchId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Enter batch ID from seller" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                <input name="quantity" type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Kg (₹)</label>
                <input name="pricePerKg" type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold">
                Record Purchase
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showModal === 'sell' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Sell Honey</h3>
            <form onSubmit={handleSell} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
                <select name="buyerId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="">Select Buyer</option>
                  {stakeholders.filter(s => s.id !== currentUser.id && (s.type === 'processor' || s.type === 'trader')).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.type}) - {s.uniqueId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select name="batchId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="">Select Batch</option>
                  {inventory.map((item, idx) => (
                    <option key={idx} value={item.batchId}>{item.batchId} - {item.quantity} kg available</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                <input name="quantity" type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Kg (₹)</label>
                <input name="pricePerKg" type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold">
                Create Sale & Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Traceability View */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewInvoice(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Invoice & Traceability</h3>
              <button onClick={() => setViewInvoice(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {(() => {
              const inv = [...myInvoices, ...purchaseInvoices].find(i => i.id === viewInvoice);
              if (!inv) return null;
              return (
                <div className="space-y-4">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">Invoice #:</span> <span className="font-mono font-bold">{inv.invoiceNumber}</span></div>
                      <div><span className="text-gray-500">Date:</span> {formatDate(inv.date)}</div>
                      <div><span className="text-gray-500">From:</span> {inv.sellerName}</div>
                      <div><span className="text-gray-500">To:</span> {inv.buyerName}</div>
                      <div><span className="text-gray-500">Quantity:</span> {inv.quantity} kg</div>
                      <div><span className="text-gray-500">Rate:</span> {formatCurrency(inv.pricePerKg)}/kg</div>
                      <div className="col-span-2"><span className="text-gray-500">Total:</span> <span className="text-lg font-bold text-green-700">{formatCurrency(inv.totalAmount)}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Batch:</span> <span className="font-mono">{inv.batchId}</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Traceability Chain</h4>
                    <div className="space-y-2">
                      {inv.traceabilityChain.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{entry.stakeholderName}</p>
                            <p className="text-xs text-gray-500">{entry.uniqueId} • {entry.action}</p>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
