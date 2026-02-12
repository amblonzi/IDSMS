import { useState, useEffect } from 'react';
import { vehicleService } from '../services/vehicleService';
import { Car, Plus, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Vehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        plate_number: '',
        year: new Date().getFullYear(),
        type: 'manual',
        status: 'active'
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const data = await vehicleService.getVehicles();
            setVehicles(data);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await vehicleService.createVehicle(formData);
            setShowAddModal(false);
            setFormData({ make: '', model: '', plate_number: '', year: 2024, type: 'manual', status: 'active' });
            fetchVehicles();
        } catch (error) {
            alert("Failed to add vehicle");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-primary">Fleet Management</h1>
                    <p className="text-gray-500 mt-1">Manage driving school vehicles and maintenance.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    <span>Register Vehicle</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div>Loading fleet...</div>
                ) : vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:border-primary/30 transition-all">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-gray-50 text-gray-400 group-hover:bg-primary/5 group-hover:text-primary rounded-2xl transition-all">
                                    <Car size={32} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${vehicle.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {vehicle.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1 capitalize">{vehicle.make} {vehicle.model}</h3>
                            <p className="text-gray-400 text-sm font-medium mb-6 uppercase tracking-widest">{vehicle.plate_number}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Type</p>
                                    <p className="text-sm font-bold text-gray-700 capitalize">{vehicle.type}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Year</p>
                                    <p className="text-sm font-bold text-gray-700">{vehicle.year}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-primary hover:text-white transition-all border border-gray-100">
                                    Service History
                                </button>
                                <button className="p-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-orange-100">
                                    <Wrench size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Vehicle Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 font-primary">Register New Vehicle</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Make</label>
                                    <input type="text" required placeholder="Toyota" className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary focus:bg-white transition-all" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Model</label>
                                    <input type="text" required placeholder="Corolla" className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary focus:bg-white transition-all" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Plate Number</label>
                                    <input type="text" required placeholder="KCA 123B" className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary focus:bg-white transition-all uppercase" value={formData.plate_number} onChange={e => setFormData({ ...formData, plate_number: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Year</label>
                                    <input type="number" required className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 focus:ring-primary focus:border-primary focus:bg-white transition-all" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transmission Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['manual', 'automatic', 'motorcycle'].map(type => (
                                        <button key={type} type="button" onClick={() => setFormData({ ...formData, type })} className={`py-3 rounded-xl text-xs font-bold border transition-all capitalize ${formData.type === type ? 'bg-primary text-white border-primary shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex space-x-3 pt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-4 text-gray-400 font-bold hover:text-gray-600 transition-all uppercase tracking-widest text-xs">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-6 py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">
                                    Confirm Registration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
