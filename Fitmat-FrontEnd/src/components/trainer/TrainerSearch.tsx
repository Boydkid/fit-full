import React, { useState } from 'react';
import { Input } from '../common';

interface TrainerSearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  loading?: boolean;
}

interface FilterOptions {
  rating: number | null;
  experience: string | null;
  sortBy: 'rating' | 'experience' | 'reviews';
}

export default function TrainerSearch({
  onSearch,
  onFilterChange,
  loading = false,
}: TrainerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    rating: null,
    experience: null,
    sortBy: 'rating',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">ค้นหาเทรนเนอร์</h2>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="ค้นหาตามชื่อ, ประสบการณ์, หรือทักษะ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            คะแนนขั้นต่ำ
          </label>
          <select
            value={filters.rating || ''}
            onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : null)}
            className="w-full bg-slate-100 text-slate-700 font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">ทุกคะแนน</option>
            <option value="4">4+ ดาว</option>
            <option value="3">3+ ดาว</option>
            <option value="2">2+ ดาว</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ประสบการณ์
          </label>
          <select
            value={filters.experience || ''}
            onChange={(e) => handleFilterChange('experience', e.target.value || null)}
            className="w-full bg-slate-100 text-slate-700 font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">ทุกประสบการณ์</option>
            <option value="expert">ผู้เชี่ยวชาญ (5+ ปี)</option>
            <option value="experienced">มีประสบการณ์ (2-5 ปี)</option>
            <option value="beginner">เริ่มต้น (0-2 ปี)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            เรียงตาม
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as FilterOptions['sortBy'])}
            className="w-full bg-slate-100 text-slate-700 font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="rating">คะแนนสูงสุด</option>
            <option value="experience">ประสบการณ์</option>
            <option value="reviews">จำนวนรีวิว</option>
          </select>
        </div>
      </div>
    </div>
  );
}
