const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getProducts() {
  const response = await fetch(`${API_URL}/arts`);
  if (!response.ok) throw new Error('No fue posible obtener los productos');
  return response.json();
}

export async function createOrder(order) {
  const response = await fetch(`${API_URL}/compra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  if (!response.ok) throw new Error('No fue posible crear la orden');
  return response.json();
}
