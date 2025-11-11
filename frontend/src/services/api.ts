import axios, { AxiosInstance } from 'axios';
import { API_URL, API_BASE_PATH } from '../config/constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}${API_BASE_PATH}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear auth data on unauthorized
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: { first_name: string; last_name: string; phone_number: string; password: string }) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(data: { phone_number: string; password: string }) {
    const response = await this.api.post('/auth/login', data);
    return response.data;
  }

  // Menu endpoints
  async getMenu() {
    const response = await this.api.get('/menu');
    return response.data;
  }

  // Orders endpoints
  async createOrder(data: any) {
    const response = await this.api.post('/orders', data);
    return response.data;
  }

  async getOrderStatus(orderId: number) {
    const response = await this.api.get(`/orders/status/${orderId}`);
    return response.data;
  }

  async getOrder(orderId: number) {
    const response = await this.api.get(`/orders/${orderId}`);
    return response.data;
  }

  // Admin endpoints
  async getDashboardStats() {
    const response = await this.api.get('/admin/dashboard');
    return response.data;
  }

  async getActiveOrders() {
    const response = await this.api.get('/admin/orders/active');
    return response.data;
  }

  async getClosedOrders() {
    const response = await this.api.get('/admin/orders/closed');
    return response.data;
  }

  async completeOrder(orderId: number) {
    const response = await this.api.patch(`/admin/orders/${orderId}/complete`);
    return response.data;
  }

  async getCategories() {
    const response = await this.api.get('/admin/categories');
    return response.data;
  }

  async createCategory(data: any) {
    const response = await this.api.post('/admin/categories', data);
    return response.data;
  }

  async updateCategory(id: number, data: any) {
    const response = await this.api.put(`/admin/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: number) {
    const response = await this.api.delete(`/admin/categories/${id}`);
    return response.data;
  }

  async getProducts(categoryId?: number) {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await this.api.get('/admin/products', { params });
    return response.data;
  }

  async createProduct(data: any) {
    const response = await this.api.post('/admin/products', data);
    return response.data;
  }

  async updateProduct(id: number, data: any) {
    const response = await this.api.put(`/admin/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: number) {
    const response = await this.api.delete(`/admin/products/${id}`);
    return response.data;
  }

  async getOptionGroups() {
    const response = await this.api.get('/admin/option-groups');
    return response.data;
  }

  async createOptionGroup(data: any) {
    const response = await this.api.post('/admin/option-groups', data);
    return response.data;
  }

  async createOption(data: any) {
    const response = await this.api.post('/admin/options', data);
    return response.data;
  }

  async deleteOption(id: number) {
    const response = await this.api.delete(`/admin/options/${id}`);
    return response.data;
  }

  // Delivery Zones endpoints
  async getDeliveryZones() {
    const response = await this.api.get('/delivery-zones');
    return response.data;
  }

  async createDeliveryZone(data: any) {
    const response = await this.api.post('/delivery-zones', data);
    return response.data;
  }

  async updateDeliveryZone(id: number, data: any) {
    const response = await this.api.put(`/delivery-zones/${id}`, data);
    return response.data;
  }

  async deleteDeliveryZone(id: number) {
    const response = await this.api.delete(`/delivery-zones/${id}`);
    return response.data;
  }

  // Pickup locations endpoints
  async getPickupLocations() {
    const response = await this.api.get('/pickup-locations');
    return response.data;
  }

  async createPickupLocation(data: any) {
    const response = await this.api.post('/pickup-locations', data);
    return response.data;
  }

  async updatePickupLocation(id: number, data: any) {
    const response = await this.api.put(`/pickup-locations/${id}`, data);
    return response.data;
  }

  async deletePickupLocation(id: number) {
    const response = await this.api.delete(`/pickup-locations/${id}`);
    return response.data;
  }

  // Admin Settings endpoints
  async getAdminProfile() {
    const response = await this.api.get('/admin/profile');
    return response.data;
  }

  async updateAdminProfile(data: { first_name?: string; last_name?: string; phone_number?: string }) {
    const response = await this.api.put('/admin/profile', data);
    return response.data;
  }

  async updateAdminAvatar(data: { avatar_base64: string }) {
    const response = await this.api.put('/admin/profile/avatar', data);
    return response.data;
  }

  async updateAdminPassword(data: { current_password: string; new_password: string }) {
    const response = await this.api.put('/admin/profile/password', data);
    return response.data;
  }

  // User profile endpoints
  async getUserProfile() {
    const response = await this.api.get('/profile');
    return response.data;
  }

  async updateUserProfile(data: { first_name?: string; last_name?: string; phone_number?: string }) {
    const response = await this.api.put('/profile', data);
    return response.data;
  }

  async updateUserAvatar(data: { avatar_base64: string }) {
    const response = await this.api.put('/profile/avatar', data);
    return response.data;
  }

  async updateUserPassword(data: { current_password: string; new_password: string }) {
    const response = await this.api.put('/profile/password', data);
    return response.data;
  }
}

export default new ApiService();
