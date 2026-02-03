'use client';

import { DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';


export default function PriceOverrideCard() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-lira-green-1k p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-lira-green-1k flex items-center justify-center text-green-700">
                    <DollarSign size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-lira-text">Market Pricing</h2>
                    <p className="text-sm text-gray-500">Manage global service rates</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Current Calculated Median</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">1,500,000</span>
                        <span className="text-sm font-medium text-gray-500">LBP</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Override Median Price</label>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lebanon-green focus:border-lebanon-green focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                            placeholder="Enter new price"
                            type="number"
                        />
                        <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                            <RefreshCw size={16} className="mr-2" />
                            Update
                        </Button>
                    </div>
                    <p className="text-xs text-gray-400">This will affect all new service listings recommendations.</p>
                </div>
            </div>
        </div>
    );
}
