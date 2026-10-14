import { useState, type ReactNode, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, generateInvoiceNumber } from '../utils/helpers';
import { 
  Package, DollarSign, FileText, Plus, LogOut, TrendingUp, 
  ArrowDownCircle, Eye, Search
} from 'lucide-react';

type Tab = 'overview' | 'inventory' | 'purchase' | 'invoices' | 'traceability';

export default function ProcessorDashboard() {
  const { currentUser, logout, sales, invoices, stakeholders,
    addSale, addInvoice, getTraceabilityChain } = useApp();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<string | null>(null);
  const [traceBatchId, setTraceBatchId] = useState('');
  const [traceResult, setTraceResult] = useState<any[] | null>(null);

  if (!currentUser) return null;

  const purchases = sales.filter(s => s.buyerId === currentUser.id);
  const purchaseInvoices = invoices.filter(i => i.buyerId === currentUser.id);

  // Calculate inventory
  const inventoryMap: Record<string, { batchId: string; quantity: number; source: string }> = {};
  purchases.forEach(p => {
    if (!inventoryMap[p.batchId]) {
      inventoryMap[p.batchId] = { batchId: p.batchId, quantity: 0, source: '' };
    }
    inventoryMap[p.batchId].quantity += p.quantity;
    const seller = stakeholders.find(s => s.id === p.sellerId);
    inventoryMap[p.batchId].source = seller?.name || 'Unknown';
  });
  const inventory = Object.values(inventoryMap).filter(i => i.quantity > 0);
  const totalInventory = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalPurchaseValue = purchases.reduce((sum, s) => sum + s.totalAmount, 0);

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'purchase', label: 'Purchases', icon: <ArrowDownCircle className="w-4 h-4" /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
    { id: 'traceability', label: 'Trace', icon: <Search className="w-4 h-4" /> },
  ];

  const handlePurchase = (e: FormEvent<HTMLFormElement>) => {
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
      sellerType: seller.type,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      buyerType: 'processor',
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
          stakeholderType: 'processor',
          uniqueId: currentUser.uniqueId,
          action: `Purchased ${quantity} kg`,
          date: new Date().toISOString().split('T')[0],
        },
      ],
    });

    setShowPurchaseModal(false);
  };

  const handleTrace = () => {
    if (!traceBatchId) return;
    const chain = getTraceabilityChain(traceBatchId);
    setTraceResult(chain);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏭</span>
            <div>
              <h1 className="font-bold text-purple-900">{currentUser.name}</h1>
              <p className="text-xs text-purple-600 font-mono">ID: {currentUser.uniqueId}</p>
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
                  ? 'border-purple-500 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-purple-600'
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-blue-50 text-blue-600">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">Total Purchases</p>
                <p className="text-xl font-bold text-gray-900">{purchases.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-purple-50 text-purple-600">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">Raw Material Stock</p>
                <p className="text-xl font-bold text-gray-900">{totalInventory} kg</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-green-50 text-green-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">Total Purchase Value</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPurchaseValue)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Recent Purchases</h3>
              {purchases.length === 0 ? (
                <p className="text-gray-500 text-sm">No purchases yet. Buy honey from beekeepers or traders.</p>
              ) : (
                <div className="space-y-3">
                  {purchases.slice(-5).reverse().map(p => {
                    const seller = stakeholders.find(s => s.id === p.sellerId);
                    return (
                      <div key={p.id} className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                        <div>
                          <p className="font-medium text-purple-900">{seller?.name}</p>
                          <p className="text-xs text-purple-600 font-mono">{p.batchId} • {p.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(p.saleDate)} • {seller?.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-900">{p.quantity} kg</p>
                          <p className="text-sm text-purple-700">{formatCurrency(p.totalAmount)}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(p.pricePerKg)}/kg</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Raw Material Inventory</h2>
            {inventory.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Package className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <p className="text-gray-500">No inventory. Purchase honey from beekeepers or traders.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Batch ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-purple-50">
                        <td className="px-4 py-3 font-mono text-sm font-medium">{item.batchId}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.source}</td>
                        <td className="px-4 py-3 text-sm font-medium text-purple-900">{item.quantity} kg</td>
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
              <h2 className="text-xl font-bold text-gray-900">Purchase History</h2>
              <button onClick={() => setShowPurchaseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium">
                <Plus className="w-4 h-4" /> Record Purchase
              </button>
            </div>
            {purchases.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <ArrowDownCircle className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <p className="text-gray-500">No purchases recorded.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Invoice #</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Seller</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Batch</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Qty</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Total</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-purple-700 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {purchases.map(p => {
                      const seller = stakeholders.find(s => s.id === p.sellerId);
                      return (
                        <tr key={p.id} className="hover:bg-purple-50">
                          <td className="px-4 py-3 font-mono text-sm font-medium text-purple-900">{p.invoiceNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{seller?.name}</td>
                          <td className="px-4 py-3 font-mono text-sm">{p.batchId}</td>
                          <td className="px-4 py-3 text-sm">{p.quantity} kg</td>
                          <td className="px-4 py-3 text-sm font-bold text-purple-700">{formatCurrency(p.totalAmount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.saleDate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Purchase Invoices</h2>
            {purchaseInvoices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <FileText className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <p className="text-gray-500">No invoices yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {purchaseInvoices.map(inv => (
                  <div key={inv.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-bold text-purple-900">{inv.invoiceNumber}</p>
                        <p className="text-sm text-gray-600 mt-1">From: {inv.sellerName}</p>
                        <p className="text-sm text-gray-500">{formatDate(inv.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-700">{formatCurrency(inv.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{inv.quantity} kg × {formatCurrency(inv.pricePerKg)}/kg</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">Batch: <span className="font-mono">{inv.batchId}</span></p>
                    </div>
                    <button
                      onClick={() => setViewInvoice(inv.id)}
                      className="mt-3 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      <Eye className="w-4 h-4" /> View Traceability
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'traceability' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Trace Honey Batch</h2>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-sm text-gray-600 mb-4">Enter a batch ID to trace the complete journey of honey from hive to your processing unit.</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={traceBatchId}
                  onChange={(e) => setTraceBatchId(e.target.value.toUpperCase())}
                  placeholder="Enter Batch ID (e.g., HNY-240101-1234)"
                  className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                />
                <button
                  onClick={handleTrace}
                  className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 font-medium flex items-center gap-2"
                >
                  <Search className="w-4 h-4" /> Trace
                </button>
              </div>
            </div>

            {traceResult && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Traceability Chain for <span className="font-mono text-purple-700">{traceBatchId}</span>
                </h3>
                {traceResult.length === 0 ? (
                  <p className="text-gray-500">No traceability data found for this batch.</p>
                ) : (
                  <div className="space-y-3">
                    {traceResult.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            entry.stakeholderType === 'beekeeper' ? 'bg-amber-500' :
                            entry.stakeholderType === 'trader' ? 'bg-orange-500' : 'bg-purple-500'
                          }`}>
                            {idx + 1}
                          </div>
                          {idx < traceResult.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{entry.stakeholderName}</p>
                              <p className="text-xs text-gray-500 font-mono">{entry.uniqueId}</p>
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                                entry.stakeholderType === 'beekeeper' ? 'bg-amber-100 text-amber-700' :
                                entry.stakeholderType === 'trader' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {entry.stakeholderType}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">{entry.action}</p>
                              <p className="text-xs text-gray-400">{formatDate(entry.date)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Invoice Traceability Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewInvoice(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Invoice & Traceability</h3>
              <button onClick={() => setViewInvoice(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {(() => {
              const inv = purchaseInvoices.find(i => i.id === viewInvoice);
              if (!inv) return null;
              return (
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-lg p-4">
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
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            entry.stakeholderType === 'beekeeper' ? 'bg-amber-500' :
                            entry.stakeholderType === 'trader' ? 'bg-orange-500' : 'bg-purple-500'
                          }`}>
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

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPurchaseModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Record Purchase</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seller</label>
                <select name="sellerId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">Select Seller (Beekeeper or Trader)</option>
                  {stakeholders.filter(s => s.id !== currentUser.id && (s.type === 'beekeeper' || s.type === 'trader')).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.type}) - {s.uniqueId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                <input name="batchId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono" placeholder="Enter batch ID from seller" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                <input name="quantity" type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Kg (₹)</label>
                <input name="pricePerKg" type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 font-semibold">
                Record Purchase & Generate Invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
