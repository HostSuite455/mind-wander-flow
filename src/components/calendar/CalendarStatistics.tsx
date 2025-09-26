import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Euro, 
  Users, 
  Home,
  Percent,
  Clock,
  Star,
  Activity
} from 'lucide-react';
import { CalendarBooking } from '@/hooks/useCalendarData';

interface Property {
  id: string;
  name: string;
}

interface CalendarStatisticsProps {
  bookings: CalendarBooking[];
  properties: Property[];
  selectedPropertyIds: string[];
  currentDate: Date;
}

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

interface OccupancyData {
  property: string;
  occupancy: number;
  totalDays: number;
  bookedDays: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

interface ChannelData {
  channel: string;
  bookings: number;
  revenue: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function CalendarStatistics({ 
  bookings, 
  properties, 
  selectedPropertyIds, 
  currentDate 
}: CalendarStatisticsProps) {
  
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => 
      selectedPropertyIds.length === 0 || 
      selectedPropertyIds.includes(booking.property_id)
    );
  }, [bookings, selectedPropertyIds]);

  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  
  const currentMonthBookings = useMemo(() => {
    return filteredBookings.filter(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return isWithinInterval(checkIn, { start: currentMonthStart, end: currentMonthEnd }) ||
             isWithinInterval(checkOut, { start: currentMonthStart, end: currentMonthEnd }) ||
             (checkIn <= currentMonthStart && checkOut >= currentMonthEnd);
    });
  }, [filteredBookings, currentMonthStart, currentMonthEnd]);

  // Calculate main statistics
  const statistics = useMemo(() => {
    const totalBookings = currentMonthBookings.length;
    const totalRevenue = currentMonthBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
    const totalGuests = currentMonthBookings.reduce((sum, booking) => sum + (booking.guests_count || 0), 0);
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    // Calculate occupancy rate
    const totalDaysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd }).length;
    const selectedProperties = selectedPropertyIds.length > 0 
      ? properties.filter(p => selectedPropertyIds.includes(p.id))
      : properties;
    
    const totalAvailableDays = selectedProperties.length * totalDaysInMonth;
    const bookedDays = currentMonthBookings.reduce((sum, booking) => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      const nights = differenceInDays(checkOut, checkIn);
      return sum + nights;
    }, 0);
    
    const occupancyRate = totalAvailableDays > 0 ? (bookedDays / totalAvailableDays) * 100 : 0;

    const stats: StatCard[] = [
      {
        title: 'Prenotazioni Totali',
        value: totalBookings,
        icon: <Calendar className="w-4 h-4" />,
        color: 'text-blue-600',
      },
      {
        title: 'Fatturato Mensile',
        value: `€${totalRevenue.toFixed(2)}`,
        icon: <Euro className="w-4 h-4" />,
        color: 'text-green-600',
      },
      {
        title: 'Ospiti Totali',
        value: totalGuests,
        icon: <Users className="w-4 h-4" />,
        color: 'text-purple-600',
      },
      {
        title: 'Tasso di Occupazione',
        value: `${occupancyRate.toFixed(1)}%`,
        icon: <Percent className="w-4 h-4" />,
        color: 'text-orange-600',
      },
      {
        title: 'Valore Medio Prenotazione',
        value: `€${averageBookingValue.toFixed(2)}`,
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-indigo-600',
      },
      {
        title: 'Proprietà Attive',
        value: selectedProperties.length,
        icon: <Home className="w-4 h-4" />,
        color: 'text-teal-600',
      },
    ];

    return stats;
  }, [currentMonthBookings, properties, selectedPropertyIds, currentMonthStart, currentMonthEnd]);

  // Calculate occupancy by property
  const occupancyByProperty = useMemo((): OccupancyData[] => {
    const selectedProperties = selectedPropertyIds.length > 0 
      ? properties.filter(p => selectedPropertyIds.includes(p.id))
      : properties;

    const totalDaysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd }).length;

    return selectedProperties.map(property => {
      const propertyBookings = currentMonthBookings.filter(b => b.property_id === property.id);
      const bookedDays = propertyBookings.reduce((sum, booking) => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        const nights = differenceInDays(checkOut, checkIn);
        return sum + nights;
      }, 0);

      const occupancy = totalDaysInMonth > 0 ? (bookedDays / totalDaysInMonth) * 100 : 0;

      return {
        property: property.name,
        occupancy: Math.round(occupancy),
        totalDays: totalDaysInMonth,
        bookedDays,
      };
    });
  }, [properties, selectedPropertyIds, currentMonthBookings, currentMonthStart, currentMonthEnd]);

  // Calculate revenue by channel
  const channelData = useMemo((): ChannelData[] => {
    const channelStats = new Map<string, { bookings: number; revenue: number }>();
    
    currentMonthBookings.forEach(booking => {
      const channel = booking.channel || 'Diretto';
      const current = channelStats.get(channel) || { bookings: 0, revenue: 0 };
      channelStats.set(channel, {
        bookings: current.bookings + 1,
        revenue: current.revenue + (booking.total_price || 0),
      });
    });

    const totalRevenue = Array.from(channelStats.values()).reduce((sum, data) => sum + data.revenue, 0);

    return Array.from(channelStats.entries()).map(([channel, data]) => ({
      channel,
      bookings: data.bookings,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [currentMonthBookings]);

  // Calculate booking status distribution
  const statusData = useMemo(() => {
    const statusCounts = new Map<string, number>();
    
    currentMonthBookings.forEach(booking => {
      const status = booking.booking_status || 'unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [currentMonthBookings]);

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statistics.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <div className="flex items-center mt-1">
                      {stat.change > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                      )}
                      <span className={`text-xs ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(stat.change)}% {stat.changeLabel}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy by Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Occupazione per Proprietà
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {occupancyByProperty.map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{data.property}</span>
                    <Badge variant="secondary">
                      {data.occupancy}%
                    </Badge>
                  </div>
                  <Progress value={data.occupancy} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{data.bookedDays} giorni prenotati</span>
                    <span>{data.totalDays} giorni totali</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance per Canale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{data.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.bookings} prenotazioni
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">€{data.revenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tasso di Occupazione</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyByProperty}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="property" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Occupazione']}
                />
                <Bar dataKey="occupancy" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Stati Prenotazione</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Insights del Mese
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Proprietà Top</h4>
              <p className="text-sm text-blue-700">
                {occupancyByProperty.length > 0 
                  ? occupancyByProperty.reduce((prev, current) => 
                      prev.occupancy > current.occupancy ? prev : current
                    ).property
                  : 'N/A'
                }
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Canale Principale</h4>
              <p className="text-sm text-green-700">
                {channelData.length > 0 ? channelData[0].channel : 'N/A'}
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Media Ospiti</h4>
              <p className="text-sm text-purple-700">
                {currentMonthBookings.length > 0 
                  ? (currentMonthBookings.reduce((sum, b) => sum + (b.guests_count || 0), 0) / currentMonthBookings.length).toFixed(1)
                  : '0'
                } per prenotazione
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}