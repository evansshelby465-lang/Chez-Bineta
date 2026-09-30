import React, { useState } from 'react';
import { Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string>(
    product.hasVariants && product.variants && product.variants.length > 0
      ? product.variants[0].name
      : ''
  );
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Strict price enforcement
  const officialPrice = product.id === 'fataya' ? 100 : product.price;

  const handleAdd = () => {
    if (!product.isAvailable) return;
    if (product.hasVariants && !selectedVariant) {
      return;
    }

    addItem(product, quantity, selectedVariant || undefined);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  return (
    <div className="group relative glass-panel rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-[0_16px_36px_rgba(255,107,0,0.12)] hover:-translate-y-1 flex flex-col border border-white/90">
      {/* Product Image Container */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        <img
                          loading="lazy"
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="eager"
        />

        {/* Soft Glass Gradient at bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent opacity-60" />

        {/* Badges on top */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {!product.isAvailable ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500/90 text-white backdrop-blur-md shadow-sm">
              <AlertCircle className="w-3 h-3" />
              Indisponible
            </span>
          ) : (
            <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full glass-pill text-stone-800 shadow-xs">
              {product.category}
            </span>
          )}
        </div>

        {/* Floating iOS Glass Price Tag */}
        <div className="absolute bottom-3 right-3 z-10">
          <div className="px-3.5 py-1.5 rounded-2xl glass-panel-elevated font-black text-sm md:text-base text-orange-600 shadow-[0_6px_16px_rgba(0,0,0,0.08)] tracking-tight">
            {officialPrice.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-stone-900 group-hover:text-orange-600 transition-colors">
              {product.name}
            </h3>
            {product.id === 'fataya' && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
                100 F
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-stone-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Variant choice for Poutine (Crevettes vs Viande) */}
          {product.hasVariants && product.variants && (
            <div className="mt-3 p-2.5 rounded-2xl bg-orange-50/60 border border-orange-100">
              <label className="text-[11px] font-extrabold uppercase text-orange-800 tracking-wider block mb-1.5">
                Choix obligatoire :
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant === v.name;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!product.isAvailable}
                      onClick={() => setSelectedVariant(v.name)}
                      className={`text-xs py-2 px-2.5 rounded-xl font-bold transition-all text-center active:scale-95 ${
                        isSelected
                          ? 'btn-liquid-orange shadow-md'
                          : 'bg-white text-stone-700 border border-stone-200/80 hover:border-orange-300'
                      }`}
                    >
                      {v.name === 'Crevettes' ? '🍤 Crevettes' : '🥩 Viande'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer: iOS Stepper & Liquid Action */}
        <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between gap-3">
          {product.isAvailable ? (
            <>
              {/* iOS Glass Stepper */}
              <div className="flex items-center glass-pill rounded-2xl p-1 shadow-xs border border-stone-200/70">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white rounded-xl transition active:scale-90"
                  aria-label="Diminuer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-black text-xs sm:text-sm text-stone-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                  className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white rounded-xl transition active:scale-90"
                  aria-label="Augmenter"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Liquid Add Button */}
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 py-2.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  addedAnimation
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'btn-liquid-orange'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ajouté !</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Ajouter</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full text-center py-2 text-xs text-stone-400 font-bold bg-stone-100/70 rounded-2xl border border-stone-200/50">
              Temporairement indisponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
