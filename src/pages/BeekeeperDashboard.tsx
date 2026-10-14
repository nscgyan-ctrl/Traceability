import { useState, type ReactNode, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, generateBatchId, generateInvoiceNumber } from '../utils/helpers';
import { 
  MapPin, Calendar, FileText, Plus, Package, DollarSign, 
  ClipboardList, LogOut, TrendingUp, Droplets, Eye
} from 'lucide-react';

type Tab = 'overview' | 'apiaries' | 'harvests' | 'sales' | 'invoices' | 'maintenance';

export default function BeekeeperDashboard() {
  const { currentUser, logout, apiaries, harvests, sales, invoices, maintenanceLogs,
    addApiary, addHarvest, addSale, addInvoice, addMaintenanceLog,
    getStakeholderById, stakeholders, updateHarvestQuantity } = useApp();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<string | null>(null);

  if (!currentUser) return null;

  const myApiaries = apiaries.filter(a => a.beekeeperId === currentUser.id);
  const myHarvests = harvests.filter(h => h.beekeeperId === currentUser.id);
  const mySales = sales.filter(s => s.sellerId === currentUser.id);
  const myInvoices = invoices.filter(i => i.sellerId === currentUser.id);
  const myLogs = maintenanceLogs.filter(l => l.beekeeperId === currentUser.id);
  
  const totalHarvested = myHarvests.reduce((sum, h) => sum + h.harvestedAmount, 0);
  const totalRemaining = myHarvests.reduce((sum, h) => sum + h.remainingAmount, 0);
  const totalRevenue = mySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'apiaries', label: 'Apiaries', icon: <MapPin className="w-4 h-4" /> },
    { id: 'harvests', label: 'Harvests', icon: <Droplets className="w-4 h-4" /> },
    { id: 'sales', label: 'Sell Honey', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <ClipboardList className="w-4 h-4" /> },
  ];

  const handleSell = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const harvestId = form.get('harvestId') as string;
    const buyerId = form.get('buyerId') as string;
    const buyerName = form.get('buyerName') as string;
    const buyerType = form.get('buyerType') as string as any;
    const quantity = parseFloat(form.get('quantity') as string);
    const pricePerKg = parseFloat(form.get('pricePerKg') as string);

    const harvest = harvests.find(h => h.id === harvestId);
    if (!harvest || quantity > harvest.remainingAmount) {
      alert('Insufficient quantity available!');
      return;
    }

    const batchId = harvest.batchId;
    const invoiceNumber = generateInvoiceNumber();
    const totalAmount = quantity * pricePerKg;

    const traceabilityChain = [currentUser.id];
    if (buyerId) traceabilityChain.push(buyerId);

    const sale = {
      sellerId: currentUser.id,
      sellerType: currentUser.type as any,
      buyerId: buyerId || 'consumer-' + Date.now(),
      buyerName: buyerName || 'Direct Consumer',
      buyerType: buyerType || 'consumer',
      invoiceNumber,
      saleDate: new Date().toISOString().split('T')[0],
      quantity,
      pricePerKg,
      totalAmount,
      batchId,
      traceabilityChain,
      status: 'completed' as const,
    };

    addSale(sale);
    updateHarvestQuantity(harvestId, quantity);

    addInvoice({
      invoiceNumber,
      saleId: '',
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      buyerId: buyerId || 'consumer',
      buyerName: buyerName || 'Direct Consumer',
      date: sale.saleDate,
      quantity,
      pricePerKg,
      totalAmount,
      batchId,
      traceabilityChain: [{
        stakeholderId: currentUser.id,
        stakeholderName: currentUser.name,
        stakeholderType: 'beekeeper',
        uniqueId: currentUser.uniqueId,
        action: `Sold ${quantity} kg at ${formatCurrency(pricePerKg)}/kg`,
        date: sale.saleDate,
      }],
    });

    setShowModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐝</span>
            <div>
              <h1 className="font-bold text-amber-900">{currentUser.name}</h1>
              <p className="text-xs text-amber-600 font-mono">ID: {currentUser.uniqueId}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-amber-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={<MapPin className="w-5 h-5" />} label="Apiaries" value={myApiaries.length.toString()} color="blue" />
              <StatCard icon={<Droplets className="w-5 h-5" />} label="Total Harvested" value={`${totalHarvested} kg`} color="amber" />
              <StatCard icon={<Package className="w-5 h-5" />} label="Available Stock" value={`${totalRemaining} kg`} color="green" />
              <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={formatCurrency(totalRevenue)} color="purple" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Harvests</h3>
                {myHarvests.length === 0 ? (
                  <p className="text-gray-500 text-sm">No harvests recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myHarvests.slice(-3).reverse().map(h => (
                      <div key={h.id} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-amber-900">{h.batchId}</p>
                          <p className="text-xs text-amber-600">{formatDate(h.harvestDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-900">{h.harvestedAmount} kg</p>
                          <p className="text-xs text-green-600">{h.remainingAmount} kg left</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Sales</h3>
                {mySales.length === 0 ? (
                  <p className="text-gray-500 text-sm">No sales recorded yet.</p>
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

        {/* Apiaries */}
        {activeTab === 'apiaries' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">My Apiaries</h2>
              <button onClick={() => setShowModal('apiary')} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Apiary
              </button>
            </div>
            
            {myApiaries.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <MapPin className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                <p className="text-gray-500">No apiaries registered yet. Add your first apiary location.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myApiaries.map(a => (
                  <div key={a.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{a.location}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{a.numberOfColonies} colonies</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Arrived: {formatDate(a.dateOfArrival)}</p>
                      <p className="flex items-center gap-2"><span className="text-lg">🌸</span> Flora: {a.majorFlora}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Harvests */}
        {activeTab === 'harvests' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Harvest Records</h2>
              <button onClick={() => setShowModal('harvest')} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
                <Plus className="w-4 h-4" /> Record Harvest
              </button>
            </div>

            {myHarvests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Droplets className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                <p className="text-gray-500">No harvests recorded yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-amber-700 uppercase">Batch ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-amber-700 uppercase">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-amber-700 uppercase">Quantity</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-amber-700 uppercase">Remaining</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-amber-700 uppercase">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {myHarvests.map(h => (
                      <tr key={h.id} className="hover:bg-amber-50">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-amber-900">{h.batchId}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(h.harvestDate)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{h.harvestedAmount} kg</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${h.remainingAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {h.remainingAmount} kg
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{h.quality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sales */}
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
                <DollarSign className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                <p className="text-gray-500">No sales yet. Start selling your honey!</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Invoice #</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Buyer</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Qty</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-700 uppercase">Price/kg</th>
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
                        <td className="px-4 py-3 text-sm">{formatCurrency(s.pricePerKg)}</td>
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

        {/* Invoices */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">My Invoices</h2>
            {myInvoices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <FileText className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                <p className="text-gray-500">No invoices generated yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myInvoices.map(inv => (
                  <div key={inv.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-bold text-amber-900">{inv.invoiceNumber}</p>
                        <p className="text-sm text-gray-600 mt-1">To: {inv.buyerName}</p>
                        <p className="text-sm text-gray-500">{formatDate(inv.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-700">{formatCurrency(inv.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{inv.quantity} kg × {formatCurrency(inv.pricePerKg)}/kg</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">Batch: <span className="font-mono">{inv.batchId}</span></p>
                    </div>
                    <button
                      onClick={() => setViewInvoice(inv.id)}
                      className="mt-3 flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 font-medium"
                    >
                      <Eye className="w-4 h-4" /> View Traceability
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Maintenance */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Maintenance Log</h2>
              <button onClick={() => setShowModal('maintenance')} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Log
              </button>
            </div>

            {myLogs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <ClipboardList className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                <p className="text-gray-500">No maintenance logs yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myLogs.slice().reverse().map(log => (
                  <div key={log.id} className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{log.activity}</p>
                        <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(log.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showModal === 'apiary' && (
        <Modal title="Add Apiary Location" onClose={() => setShowModal(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            addApiary({
              beekeeperId: currentUser.id,
              location: form.get('location') as string,
              dateOfArrival: form.get('dateOfArrival') as string,
              majorFlora: form.get('majorFlora') as string,
              numberOfColonies: parseInt(form.get('numberOfColonies') as string),
            });
            setShowModal(null);
          }} className="space-y-4">
            <InputField name="location" label="Apiary Location" placeholder="e.g., Sundarbans, West Bengal" required />
            <InputField name="dateOfArrival" label="Date of Arrival" type="date" required />
            <InputField name="majorFlora" label="Major Flora at Sight" placeholder="e.g., Eucalyptus, Mustard, Litchi" required />
            <InputField name="numberOfColonies" label="Number of Colonies" type="number" required />
            <SubmitButton>Add Apiary</SubmitButton>
          </form>
        </Modal>
      )}

      {showModal === 'harvest' && (
        <Modal title="Record Harvest" onClose={() => setShowModal(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const qty = parseFloat(form.get('harvestedAmount') as string);
            addHarvest({
              beekeeperId: currentUser.id,
              apiaryId: form.get('apiaryId') as string,
              harvestDate: form.get('harvestDate') as string,
              quantity: qty,
              harvestedAmount: qty,
              remainingAmount: qty,
              quality: form.get('quality') as string,
              batchId: generateBatchId(),
            });
            setShowModal(null);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apiary</label>
              <select name="apiaryId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="">Select Apiary</option>
                {myApiaries.map(a => (
                  <option key={a.id} value={a.id}>{a.location}</option>
                ))}
              </select>
            </div>
            <InputField name="harvestDate" label="Harvest Date" type="date" required />
            <InputField name="harvestedAmount" label="Harvested Amount (kg)" type="number" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
              <select name="quality" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="">Select Quality</option>
                <option value="Grade A">Grade A (Premium)</option>
                <option value="Grade B">Grade B (Standard)</option>
                <option value="Grade C">Grade C (Commercial)</option>
              </select>
            </div>
            <SubmitButton>Record Harvest</SubmitButton>
          </form>
        </Modal>
      )}

      {showModal === 'sell' && (
        <Modal title="Sell Honey" onClose={() => setShowModal(null)}>
          <form onSubmit={handleSell} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
              <select name="harvestId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="">Select Harvest Batch</option>
                {myHarvests.filter(h => h.remainingAmount > 0).map(h => (
                  <option key={h.id} value={h.id}>{h.batchId} - {h.remainingAmount} kg available</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sell To</label>
              <select name="buyerType" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="processor">Processor</option>
                <option value="trader">Trader</option>
                <option value="consumer">Direct Consumer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Buyer (optional for consumer)</label>
              <select name="buyerId" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="">-- Direct Consumer / Walk-in --</option>
                {stakeholders.filter(s => s.id !== currentUser.id && (s.type === 'processor' || s.type === 'trader')).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.type}) - {s.uniqueId}</option>
                ))}
              </select>
            </div>
            <InputField name="buyerName" label="Buyer Name" placeholder="Enter buyer name" required />
            <InputField name="quantity" label="Quantity (kg)" type="number" required />
            <InputField name="pricePerKg" label="Price per Kg (₹)" type="number" required />
            <SubmitButton>Create Sale & Invoice</SubmitButton>
          </form>
        </Modal>
      )}

      {showModal === 'maintenance' && (
        <Modal title="Add Maintenance Log" onClose={() => setShowModal(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            addMaintenanceLog({
              beekeeperId: currentUser.id,
              apiaryId: form.get('apiaryId') as string,
              date: form.get('date') as string,
              activity: form.get('activity') as string,
              notes: form.get('notes') as string,
            });
            setShowModal(null);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apiary</label>
              <select name="apiaryId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="">Select Apiary</option>
                {myApiaries.map(a => (
                  <option key={a.id} value={a.id}>{a.location}</option>
                ))}
              </select>
            </div>
            <InputField name="date" label="Date" type="date" required />
            <InputField name="activity" label="Activity" placeholder="e.g., Colony inspection, Feeding, Disease treatment" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Additional notes..." />
            </div>
            <SubmitButton>Add Log Entry</SubmitButton>
          </form>
        </Modal>
      )}

      {/* Invoice Traceability View */}
      {viewInvoice && (
        <Modal title="Invoice & Traceability" onClose={() => setViewInvoice(null)}>
          {(() => {
            const inv = myInvoices.find(i => i.id === viewInvoice);
            if (!inv) return null;
            return (
              <div className="space-y-4">
                <div className="bg-amber-50 rounded-lg p-4">
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
                        <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
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
        </Modal>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ name, label, type = 'text', placeholder = '', required = false }: {
  name: string; label: string; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
      />
    </div>
  );
}

function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold transition-colors">
      {children}
    </button>
  );
}
