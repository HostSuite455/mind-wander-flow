import React from 'react';
import { TrendingUp, Calendar, Users, Euro } from 'lucide-react';

interface CalendarStatsProps {
  bookings: Array<{
    status: string;
    total_price?: number;
    check_in: string;
    check_out: string;
  }>;
  currentMonth: Date;
}

const calculateRevenue = (
  bookings: Array<{ total_price?: number; status: string }>,
  includeStatuses: string[] = ['confirmed']
): number => {
  return bookings
    .filter(booking => includeStatuses.includes(booking.status))
    .reduce((total, booking) => total + (booking.total_price || 0), 0);
};

export const CalendarStats: React.FC<CalendarStatsProps> = ({ bookings, currentMonth }) => {
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const monthBookings = bookings.filter(booking => {
    const checkIn = new Date(booking.check_in);
    return checkIn >= monthStart && checkIn <= monthEnd;
  });
  
  const confirmedBookings = monthBookings.filter(b => b.status === 'confirmed');
  const pendingBookings = monthBookings.filter(b => b.status === 'pending');
  const totalRevenue = calculateRevenue(monthBookings);
  const occupancyRate = monthBookings.length > 0 ? 
    Math.round((confirmedBookings.length / monthBookings.length) * 100) : 0;

  const stats = [
    {
      name: 'Prenotazioni Totali',
      value: monthBookings.length,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Prenotazioni Confermate',
      value: confirmedBookings.length,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Ricavi Totali',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: Euro,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Tasso Occupazione',
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};