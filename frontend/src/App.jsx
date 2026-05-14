import React, { useEffect, useMemo, useState } from 'react';
import { ProductCard } from './components/ProductCard.jsx';
import { createOrder, getProducts } from './services/api.js';
import './styles.css';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setMessage('No fue posible cargar los articulos.'));
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  function addToCart(product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
  }

  async function checkout() {
    const items = cart.map((item) => ({ productId: item.id, quantity: item.quantity }));
    const order = await createOrder({ customerName: 'Cliente Demo', items });
    setMessage(`Orden ${order.id.slice(0, 8)} creada por $${order.total.toLocaleString('es-MX')} MXN`);
    setCart([]);
  }

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Practica de Seguridad</p>
          <h1>Pruebas automaticas</h1>
          <p>Desarrollo de Software Seguro | IS | Articulos universitarios</p>
        </div>
        <aside className="cart" aria-label="Carrito de articulos">
          <h2>Carrito</h2>
          {cart.length === 0 ? <p>Sin productos agregados.</p> : cart.map((item) => (
            <p key={item.id}>{item.name} × {item.quantity}</p>
          ))}
          <strong>Total: ${total.toLocaleString('es-MX')} MXN</strong>
          <button disabled={cart.length === 0} onClick={checkout}>Finalizar compra</button>
        </aside>
      </section>

      {message && <div className="alert" role="status">{message}</div>}

      <section className="grid" aria-label="Catalogo de articulos">
        {products.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
      </section>
    </main>
  );
}
