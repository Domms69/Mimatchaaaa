const API_URL = 'http://testtt.test/api/index.php';

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
  deleteProduct: (id) => {
    return fetch(`${API_URL}?action=delete_product&id=${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
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
    return fetch('http://testtt.test/api/index.php?action=create_payment', {
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
  
  getPaymentMethods: () => {
    return fetch(`${API_URL}?action=get_payment_methods`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).catch(err => ({ success: false, error: err.message }));
  },
  
  analyzeMoney: async (imageBase64) => {
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    
    if (!OPENROUTER_API_KEY) {
      return { success: false, error: 'API key tidak ditemukan. Set VITE_OPENROUTER_API_KEY di file .env' };
    }
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Money Analyzer'
        },
        body: JSON.stringify({
          model: 'google/gemma-4-26b-a4b-it:free',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analisis gambar uang ini dan tentukan apakah uang tersebut ASLI atau PALSU. 
                  
Berikan analisis dalam format JSON dengan struktur berikut:
{
  "status": "ASLI" atau "PALSU" atau "TIDAK DAPAT DITENTUKAN",
  "nominal": "nominal uang (contoh: Rp 100.000)",
  "kepercayaan": persentase kepercayaan dalam angka (0-100),
  "ciri_ciri": {
    "positif": ["ciri-ciri yang menunjukkan uang asli"],
    "negatif": ["ciri-ciri yang menunjukkan uang palsu"]
  },
  "rekomendasi": "rekomendasi tindakan"
}

Jawab HANYA dengan JSON tersebut, tanpa penjelasan tambahan.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1024
        })
      });

      const result = await response.json();
      
      if (result.choices && result.choices[0]) {
        const content = result.choices[0].message.content;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return { success: true, analysis: JSON.parse(jsonMatch[0]), raw: content };
          }
          return { success: true, analysis: null, raw: content };
        } catch (parseError) {
          return { success: true, analysis: null, raw: content };
        }
      }
      
      return { success: false, error: 'No response from AI' };
    } catch (error) {
      console.error('Money Analysis Error:', error);
      return { success: false, error: error.message };
    }
  }
};

export default api;
