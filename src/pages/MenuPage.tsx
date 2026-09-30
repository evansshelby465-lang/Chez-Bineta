import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search } from 'lucide-react';

interface MenuPageProps {
  products: Product[];
  initialCategory?: string;
}

export const MenuPage: React.FC<MenuPageProps> = ({ products, initialCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'all', label: 'Tout le menu', icon: '🍽️' },
    { id: 'tacos', label: 'Mini Tacos', icon: '🌮' },
    { id: 'pizza', label: 'Mini Pizza', icon: '🍕' },
    { id: 'fataya', label: 'Fataya (100 F)', icon: '🥟' },
    { id: 'nems', label: 'Nems (200 F)', icon: '🍤' },
    { id: 'poutine', label: 'Poutine (3 000 F)', icon: '🍲' },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' ? true : p.category === selectedCategory;
    const matchesSearch =
      searchQuery === ''
        ? true
        : p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Le Menu <span className="text-orange-600">Chez Bineta</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Sélectionnez vos délices, ajustez vos quantités et commandez en toute fluidité.
          </p>
        </div>

        {/* Search Input (iOS Glass Search Pill) */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un plat..."
            className="w-full glass-panel rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-xs transition"
          />
        </div>
      </div>

      {/* Category Tabs (iOS Segmented Glass Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              selectedCategory === tab.id
                ? 'btn-liquid-orange shadow-md'
                : 'glass-panel text-stone-600 hover:text-stone-900 hover:bg-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-3xl">
          <p className="text-stone-500 font-bold text-sm">
            Aucun produit ne correspond à votre recherche.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-orange-600 font-extrabold underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
