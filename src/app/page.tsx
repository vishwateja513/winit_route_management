import { Route, MapPin, Users, Clock } from 'lucide-react'

export default function Dashboard() {
  const stats = [
    { name: 'Total Routes', value: '24', icon: Route, change: '+2.1%', changeType: 'positive' },
    { name: 'Active Locations', value: '156', icon: MapPin, change: '+5.4%', changeType: 'positive' },
    { name: 'Active Drivers', value: '18', icon: Users, change: '+1.2%', changeType: 'positive' },
    { name: 'Avg. Delivery Time', value: '32 min', icon: Clock, change: '-0.8%', changeType: 'negative' },
  ]

  const recentRoutes = [
    { id: 1, name: 'Downtown Express', driver: 'John Smith', status: 'In Progress', time: '2:30 PM' },
    { id: 2, name: 'Airport Route', driver: 'Sarah Johnson', status: 'Completed', time: '1:45 PM' },
    { id: 3, name: 'University Loop', driver: 'Mike Davis', status: 'Scheduled', time: '3:15 PM' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your route management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Routes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Routes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentRoutes.map((route) => (
            <div key={route.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Route className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{route.name}</p>
                  <p className="text-sm text-gray-500">Driver: {route.driver}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  route.status === 'Completed' 
                    ? 'bg-green-100 text-green-800'
                    : route.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {route.status}
                </span>
                <span className="text-sm text-gray-500">{route.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}