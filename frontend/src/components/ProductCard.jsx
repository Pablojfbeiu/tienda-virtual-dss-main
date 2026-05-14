import { ShoppingCart } from 'lucide-react';

export function ProductCard({ product, onAdd }) {
  return (
    <article className="card" data-testid="product-card">
      <img src={product.image} alt={product.name} />
      <div className="card-body">
        <span className="category">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="stock">Disponibles: {product.stock}</p>
        <div className="card-footer">
          <strong>${product.price.toLocaleString('es-MX')} MXN</strong>
          <button onClick={() => onAdd(product)} aria-label={`Agregar ${product.name}`}>
            <ShoppingCart size={18} /> Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
