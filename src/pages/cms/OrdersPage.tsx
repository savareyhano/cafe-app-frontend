import React, { useState, useEffect } from 'react';
import { useOrdersQuery } from '../../lib/queries';
import { useUpdateOrderMutation } from '../../lib/mutations';
import { Search, ArrowUpDown, ChevronDown, RefreshCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Polling every 5 seconds is configured in useOrdersQuery
  const { data, isLoading, isFetching } = useOrdersQuery(page, 10, search, sortBy, sortOrder, 5000);
  const updateStatusMutation = useUpdateOrderMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
    ready: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    served: 'bg-wood/20 text-wood border-wood/30',
    paid: 'bg-green-500/20 text-green-200 border-green-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white font-light flex items-center gap-3">
            Orders
            {isFetching && !isLoading && (
              <RefreshCcw
                size={18}
                className="animate-[spin_1s_linear_infinite_reverse] text-wood"
              />
            )}
          </h1>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#dfc6b3]">
            Real-time queue management
          </span>
        </div>
      </div>

      <div className="bg-forest-dark/40 border border-beige/10 rounded-2xl p-4 md:p-6 shadow-xl">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full md:w-96"
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-beige/40">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search customer name or phone..."
              className="w-full bg-earth-dark/50 border border-beige/10 text-beige text-sm rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-all placeholder:text-beige/20 font-sans"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-beige/10">
                <th className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">
                  Order ID / Time
                </th>
                <th
                  className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase cursor-pointer hover:text-wood"
                  onClick={() => handleSort('customerName')}
                >
                  <div className="flex items-center gap-1">
                    Customer <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase cursor-pointer hover:text-wood"
                  onClick={() => handleSort('tableNumber')}
                >
                  <div className="flex items-center gap-1">
                    Table <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">
                  Items
                </th>
                <th
                  className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase cursor-pointer hover:text-wood"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown size={12} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-beige/50 font-mono text-sm"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-beige/50 font-mono text-sm"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                data?.data?.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-beige/5 hover:bg-forest/30 transition-colors align-top"
                  >
                    <td className="p-3">
                      <p
                        className="font-mono text-xs text-beige/60"
                        title={order.id}
                      >
                        {order.id.slice(0, 8)}...
                      </p>
                      <p className="text-[10px] font-mono text-[#dfc6b3] mt-1">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-serif text-white text-base">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-beige/50 font-mono">
                        {order.customerPhoneNumber}
                      </p>
                    </td>
                    <td className="p-3">
                      <div className="w-8 h-8 rounded-full bg-forest border border-beige/10 flex items-center justify-center font-mono text-xs text-wood">
                        {order.tableNumber}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {order.orderItems?.map((item: any) => (
                          <div key={item.id} className="text-xs">
                            <span className="font-mono text-wood">
                              {item.quantity}x
                            </span>{' '}
                            <span className="text-beige/80">
                              {item.menuItems.name}
                            </span>
                            {item.note && (
                              <p className="text-[10px] text-beige/40 italic ml-4">
                                Note: {item.note}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-wood transition-colors bg-earth-dark/50 hover:bg-forest outline-none border-beige/10">
                          <span
                            className={`px-2 py-0.5 rounded border ${statusColors[order.status] || 'bg-beige/10'}`}
                          >
                            {order.status}
                          </span>
                          <ChevronDown size={14} className="text-beige/50" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-earth-dark border-beige/10 text-beige">
                          {['pending', 'ready', 'served', 'paid'].map(
                            (status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() =>
                                  handleStatusChange(order.id, status)
                                }
                                className="font-mono text-xs uppercase tracking-widest hover:bg-forest focus:bg-forest cursor-pointer"
                              >
                                Mark as {status}
                              </DropdownMenuItem>
                            ),
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.data?.length > 0 && data?.pagination && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs font-mono text-beige/50">
              Page {data.pagination.currentPage} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={!data.pagination.prevPage}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-forest border border-beige/10 rounded text-xs font-mono disabled:opacity-30 hover:border-wood transition-colors cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={!data.pagination.nextPage}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-forest border border-beige/10 rounded text-xs font-mono disabled:opacity-30 hover:border-wood transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
