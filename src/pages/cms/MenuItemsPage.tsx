import React, { useState } from 'react';
import { useDeleteMenuItemMutation, useAddMenuItemMutation, useUpdateMenuItemMutation } from '../../lib/mutations';
import { useMenuItemsQuery as useItemsQuery } from '../../lib/queries';
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';

export default function MenuItemsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'food',
    description: '',
    price: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data, isLoading } = useItemsQuery(page, 10, search, sortBy, sortOrder);
  const deleteMutation = useDeleteMenuItemMutation();
  const addMutation = useAddMenuItemMutation();
  const updateMutation = useUpdateMenuItemMutation();

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', type: 'food', description: '', price: '' });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      description: item.description || '',
      price: item.price.toString(),
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.type) {
      toast.error('Please fill required fields (Name, Type, Price)');
      return;
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('type', formData.type);
    submitData.append('price', formData.price);
    
    // Description can be empty
    submitData.append('description', formData.description);

    if (imageFile) {
      submitData.append('image', imageFile);
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, formData: submitData }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      addMutation.mutate(submitData, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white font-light">Menu Items</h1>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#dfc6b3]">Manage your catalog</span>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-wood hover:bg-wood-dark text-white px-4 py-2 rounded-xl text-xs font-mono font-medium tracking-widest uppercase transition-all shadow-md"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="bg-forest-dark/40 border border-beige/10 rounded-2xl p-4 md:p-6 shadow-xl">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-beige/40">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-earth-dark/50 border border-beige/10 text-beige text-sm rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-all placeholder:text-beige/20 font-sans"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-beige/10">
                <th className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">Image</th>
                <th 
                  className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase cursor-pointer hover:text-wood"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">Name <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">Type</th>
                <th 
                  className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase cursor-pointer hover:text-wood"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">Price <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-3 text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-beige/50 font-mono text-sm">Loading...</td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-beige/50 font-mono text-sm">No menu items found.</td>
                </tr>
              ) : (
                data?.data?.map((item: any) => (
                  <tr key={item.id} className="border-b border-beige/5 hover:bg-forest/30 transition-colors">
                    <td className="p-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-forest flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-beige/20 font-mono text-xs">No img</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-serif text-white text-base">{item.name}</p>
                      <p className="text-xs text-beige/50 font-sans truncate max-w-xs">{item.description}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded bg-beige/10 text-[10px] font-mono uppercase tracking-widest text-beige/80 border border-beige/10">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-wood text-sm">
                      Rp {item.price.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-beige/50 hover:text-wood hover:bg-wood/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-beige/50 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs font-mono text-beige/50">
              Page {data.pagination.currentPage} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={!data.pagination.prevPage}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-forest border border-beige/10 rounded text-xs font-mono disabled:opacity-30 hover:border-wood transition-colors"
              >
                Prev
              </button>
              <button
                disabled={!data.pagination.nextPage}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-forest border border-beige/10 rounded text-xs font-mono disabled:opacity-30 hover:border-wood transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-earth-dark border border-beige/10 text-beige sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light text-white">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-forest-dark border border-beige/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-wood"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-forest-dark border border-beige/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-wood"
              >
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">Price (Rp)</label>
              <input 
                type="number" 
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full bg-forest-dark border border-beige/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-wood"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-forest-dark border border-beige/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-wood min-h-[80px]"
                placeholder="Leave empty to clear description"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">Image</label>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full bg-forest-dark border border-beige/10 rounded-lg p-2 text-sm text-beige/70 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-mono file:uppercase file:tracking-widest file:bg-wood file:text-white hover:file:bg-wood-dark cursor-pointer"
              />
            </div>
            <DialogFooter className="mt-6">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-beige/10 hover:bg-forest text-xs font-mono uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={addMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-wood hover:bg-wood-dark text-white rounded-lg text-xs font-mono uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
