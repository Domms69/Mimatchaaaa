// Use Vite proxy in dev, environment variable for production
const API_URL = import.meta.env.VITE_API_URL || '/api/index.php';

async function fetchAPI(action, data = null, method = 'POST') {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const url = data ? `${API_URL}?action=${action}` : `${API_URL}?action=${action}`;
  
  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
}

export const api = {
  login: (email, password) => fetchAPI('login', { email, password }),
  
  getProducts: () => fetchAPI('get_products'),
  getProduct: (id) => fetchAPI('get_product', null, 'GET'),
  addProduct: (data) => fetchAPI('add_product', data),
  updateProduct: (data) => fetchAPI('update_product', data),
  deleteProduct: async (id) => {
    try {
      const res = await fetch(`${API_URL}?action=delete_product&id=${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, error: 'Server (HTTP ' + res.status + '): ' + text.substring(0, 300) };
      }
    } catch (err) {
      return { success: false, error: 'Network error: ' + err.message };
    }
  },
  
  getCustomers: () => fetchAPI('get_customers'),
  addCustomer: (data) => fetchAPI('add_customer', data),
  updateCustomer: (data) => fetchAPI('update_customer', data),
  deleteCustomer: (id) => fetchAPI('delete_customer', null, 'GET'),
  
  getOrders: () => fetchAPI('get_orders'),
  getOrderDetails: (id) => fetchAPI('get_order_details', null, 'GET'),
  createOrder: (data) => fetchAPI('create_order', data),
  updateOrderStatus: (data) => fetchAPI('update_order_status', data),
  
  getDashboardStats: () => fetchAPI('get_dashboard_stats'),
  
  getAnalytics: (type = 'weekly') => {
    const url = `${API_URL}?action=get_analytics&type=${type}`;
    return fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
  },
  
  getInventory: () => fetchAPI('get_inventory'),
  updateStock: (data) => fetchAPI('update_stock', data),
  
  getSettings: () => fetchAPI('get_settings'),
  updateSettings: (data) => fetchAPI('update_settings', data),
  
  getContracts: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return fetch(`${API_URL}?action=get_contracts&${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
  },
  
  getContract: (id) => {
    return fetch(`${API_URL}?action=get_contract&id=${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
  },
  
  createContract: (data) => fetchAPI('create_contract', data),
  
  updateContract: (data) => fetchAPI('update_contract', data),
  
  updateContractStatus: (id, status) => 
    fetchAPI('update_contract_status', { id_kontrak: id, status }),
  
  deleteContract: (id) => {
    return fetch(`${API_URL}?action=delete_contract&id=${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
  },
  
  getExpiringContracts: (days = 30) => {
    return fetch(`${API_URL}?action=get_expiring_contracts&days=${days}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
  },
  
  getContractStats: () => {
    return fetch(`${API_URL}?action=get_contract_stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
  },
  
  saveContract: (data) => fetchAPI('save_contract', data),
  
  createPayment: (data) => {
    return fetch(`${API_URL}?action=create_payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
  },
  checkPaymentStatus: (payment_reference) => {
    const url = `${API_URL}?action=check_payment_status&payment_reference=${payment_reference}`;
    return fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
  },
  getPaymentHistory: (id_pesanan = null) => {
    const url = id_pesanan 
      ? `${API_URL}?action=get_payment_history&id_pesanan=${id_pesanan}`
      : `${API_URL}?action=get_payment_history`;
    return fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
  },
  simulatePaymentSuccess: (payment_reference) => {
    const formData = new FormData();
    formData.append('payment_reference', payment_reference);
    return fetch(`${API_URL}?action=simulate_payment_success`, {
      method: 'POST',
      body: formData
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
  },
  
  // User management
  getUsers: () => fetchAPI('get_users'),
  getUser: (id) => fetchAPI('get_user', null, 'GET'),
  addUser: (data) => fetchAPI('add_user', data),
  updateUser: (data) => fetchAPI('update_user', data),
  deleteUser: (id) => {
    return fetch(`${API_URL}?action=delete_user&id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
  },
  
  getPaymentMethods: () => {
    return fetch(`${API_URL}?action=get_payment_methods`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
  },

  // Notifications
  getNotifications: (role = '') => {
    const url = role 
      ? `${API_URL}?action=get_notifications&role=${encodeURIComponent(role)}`
      : `${API_URL}?action=get_notifications`;
    return fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
  },

  markNotificationRead: (id) => fetchAPI('mark_notification_read', { id }),

  markAllNotificationsRead: (role = '') => fetchAPI('mark_all_notifications_read', { role }),

  addNotification: (data) => fetchAPI('add_notification', data),
};

export default api;
