export default function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse p-6">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-gray-200 rounded"></div>
                    <div className="h-4 w-96 bg-gray-100 rounded"></div>
                </div>
                <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                            <div className="h-5 w-12 bg-gray-100 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-gray-100 rounded"></div>
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 h-96 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-6 w-32 bg-gray-200 rounded"></div>
                        <div className="h-4 w-16 bg-gray-100 rounded"></div>
                    </div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-2">
                                <div className="flex items-center space-x-4 w-full">
                                    <div className="h-10 w-10 bg-gray-100 rounded-lg shrink-0"></div>
                                    <div className="space-y-2 w-full">
                                        <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                                        <div className="h-3 w-1/2 bg-gray-50 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-96 p-6 space-y-6">
                    <div className="h-6 w-40 bg-gray-200 rounded"></div>
                    <div className="space-y-4">
                        <div className="h-20 bg-gray-50 rounded-lg border border-gray-100"></div>
                        <div className="h-20 bg-gray-50 rounded-lg border border-gray-100"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
