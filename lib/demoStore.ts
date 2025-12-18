/**
 * Demo Mode Storage Utility
 * 
 * Implements localStorage-based CRUD for DEMO MODE.
 * Supabase is ONLY used for initial seeding (SELECT only).
 * ALL mutations happen in localStorage.
 * 
 * IMPORTANT: This is the single source of truth for demo data.
 */

// Storage Keys
export const DEMO_STORAGE_KEYS = {
    INITIALIZED: 'demo_initialized',
    SPORTS: 'demo_sports',
    FIELDS: 'demo_fields',
    FIELD_IMAGES: 'demo_field_images',
    BOOKINGS: 'demo_bookings',
    BARANG: 'demo_barang',
    PEMASUKAN: 'demo_pemasukan',
    PEMASUKAN_DETAIL: 'demo_pemasukan_detail',
    SYSTEM_PROMPTS: 'demo_system_prompts',
} as const;

// Type definitions
export interface Sport {
    id: number;
    sport_name: string;
    sport_type: string;
    description?: string | null;
    is_available: number;
    updated_at?: string;
}

export interface Field {
    id: number;
    field_name: string;
    field_code: string;
    sport_id: number;
    price_per_hour: number;
    description?: string | null;
    url_image?: string | null;
    is_available: number;
    updated_at?: string;
}

export interface FieldImage {
    id: number;
    field_id: number;
    url_image: string;
}

export interface Booking {
    id: number;
    field_id: number;
    field_name: string;
    booking_date: string;
    time_slots: string[];
    total_price: number;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    booking_status: string;
    payment_status: string;
    created_at: string;
    updated_at?: string;
}

export interface Barang {
    id: number;
    nama_barang: string;
    category: string;
    harga: number;
    stok: number;
    is_available: number;
}

export interface Pemasukan {
    id: number;
    nomor_invoice: string;
    id_booking?: number;
    amount: number;
    created_by: string;
    updated_by: string;
    created_at: string;
}

export interface PemasukanDetail {
    id: number;
    pemasukan_id: number;
    nomor_invoice: string;
    barang_id?: number;
    nama_barang: string;
    harga_satuan: number;
    qty: number;
    subtotal: number;
}

export interface SystemPrompt {
    id: number;
    name: string;
    prompt_content: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    version: number;
    description?: string;
    created_by?: any;
}

// Helper function to check if we're in browser
const isBrowser = () => typeof window !== 'undefined';

// Helper function to get local time in ISO format (without UTC offset)
function getLocalISOString(): string {
    const now = new Date();
    // Convert to local time by accounting for timezone offset
    const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return localTime.toISOString();
}

// Generic localStorage getter
export function getFromLocalStorage<T>(key: string): T[] {
    if (!isBrowser()) return [];
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return [];
    }
}

// Generic localStorage setter
export function setToLocalStorage<T>(key: string, data: T[]): void {
    if (!isBrowser()) return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error writing ${key} to localStorage:`, error);
    }
}

// Check if demo is initialized
export function isDemoInitialized(): boolean {
    if (!isBrowser()) return false;
    return localStorage.getItem(DEMO_STORAGE_KEYS.INITIALIZED) === 'true';
}

// Set demo as initialized
export function setDemoInitialized(): void {
    if (!isBrowser()) return;
    localStorage.setItem(DEMO_STORAGE_KEYS.INITIALIZED, 'true');
}

// Generate unique ID
export function generateId(items: { id: number }[]): number {
    if (items.length === 0) return 1;
    return Math.max(...items.map(item => item.id)) + 1;
}

// ==================== SPORTS CRUD ====================

export function getSports(showAll: boolean = false): Sport[] {
    const sports = getFromLocalStorage<Sport>(DEMO_STORAGE_KEYS.SPORTS);
    if (showAll) return sports;
    return sports.filter(s => s.is_available === 1);
}

export function getSportById(id: number): Sport | null {
    const sports = getSports(true);
    return sports.find(s => s.id === id) || null;
}

export function createSport(data: Omit<Sport, 'id'>): Sport {
    const sports = getFromLocalStorage<Sport>(DEMO_STORAGE_KEYS.SPORTS);
    const newSport: Sport = {
        ...data,
        id: generateId(sports),
        updated_at: getLocalISOString(),
    };
    sports.push(newSport);
    setToLocalStorage(DEMO_STORAGE_KEYS.SPORTS, sports);
    return newSport;
}

export function updateSport(id: number, data: Partial<Sport>): Sport | null {
    const sports = getSports(true);
    const index = sports.findIndex(s => s.id === id);
    if (index === -1) return null;

    sports[index] = {
        ...sports[index],
        ...data,
        updated_at: getLocalISOString(),
    };
    setToLocalStorage(DEMO_STORAGE_KEYS.SPORTS, sports);
    return sports[index];
}

export function deleteSport(id: number): boolean {
    const sports = getSports(true);
    const filteredSports = sports.filter(s => s.id !== id);
    if (filteredSports.length === sports.length) return false;
    setToLocalStorage(DEMO_STORAGE_KEYS.SPORTS, filteredSports);
    return true;
}

// ==================== FIELDS CRUD ====================

export function getFields(filters?: { sportId?: number; isAvailable?: boolean; fieldCode?: string }): Field[] {
    let fields = getFromLocalStorage<Field>(DEMO_STORAGE_KEYS.FIELDS);

    if (filters?.isAvailable !== undefined) {
        const availableValue = filters.isAvailable ? 1 : 0;
        fields = fields.filter(f => f.is_available === availableValue);
    }

    if (filters?.sportId) {
        fields = fields.filter(f => f.sport_id === filters.sportId);
    }

    if (filters?.fieldCode) {
        fields = fields.filter(f => f.field_code === filters.fieldCode);
    }

    return fields.sort((a, b) => a.field_name.localeCompare(b.field_name));
}

export function getFieldById(id: number): Field | null {
    const fields = getFromLocalStorage<Field>(DEMO_STORAGE_KEYS.FIELDS);
    return fields.find(f => f.id === id) || null;
}

export function getFieldImages(fieldId?: number): FieldImage[] {
    const images = getFromLocalStorage<FieldImage>(DEMO_STORAGE_KEYS.FIELD_IMAGES);
    if (fieldId) return images.filter(i => i.field_id === fieldId);
    return images;
}

export function createField(data: Omit<Field, 'id'>, images?: string[]): Field {
    const fields = getFromLocalStorage<Field>(DEMO_STORAGE_KEYS.FIELDS);
    const newField: Field = {
        ...data,
        id: generateId(fields),
        updated_at: getLocalISOString(),
    };
    fields.push(newField);
    setToLocalStorage(DEMO_STORAGE_KEYS.FIELDS, fields);

    // Handle images
    if (images && images.length > 0) {
        const fieldImages = getFromLocalStorage<FieldImage>(DEMO_STORAGE_KEYS.FIELD_IMAGES);
        const newImages = images.map((url, idx) => ({
            id: generateId(fieldImages) + idx,
            field_id: newField.id,
            url_image: url,
        }));
        setToLocalStorage(DEMO_STORAGE_KEYS.FIELD_IMAGES, [...fieldImages, ...newImages]);
    }

    return newField;
}

export function updateField(id: number, data: Partial<Field>, images?: string[]): Field | null {
    const fields = getFromLocalStorage<Field>(DEMO_STORAGE_KEYS.FIELDS);
    const index = fields.findIndex(f => f.id === id);
    if (index === -1) return null;

    fields[index] = {
        ...fields[index],
        ...data,
        updated_at: getLocalISOString(),
    };
    setToLocalStorage(DEMO_STORAGE_KEYS.FIELDS, fields);

    // Handle images if provided
    if (images !== undefined) {
        const fieldImages = getFromLocalStorage<FieldImage>(DEMO_STORAGE_KEYS.FIELD_IMAGES);
        const otherImages = fieldImages.filter(i => i.field_id !== id);
        const newImages = images.map((url, idx) => ({
            id: generateId(fieldImages) + idx,
            field_id: id,
            url_image: url,
        }));
        setToLocalStorage(DEMO_STORAGE_KEYS.FIELD_IMAGES, [...otherImages, ...newImages]);
    }

    return fields[index];
}

export function deleteField(id: number): boolean {
    const fields = getFromLocalStorage<Field>(DEMO_STORAGE_KEYS.FIELDS);
    const filteredFields = fields.filter(f => f.id !== id);
    if (filteredFields.length === fields.length) return false;

    // Also delete related images
    const fieldImages = getFromLocalStorage<FieldImage>(DEMO_STORAGE_KEYS.FIELD_IMAGES);
    setToLocalStorage(DEMO_STORAGE_KEYS.FIELD_IMAGES, fieldImages.filter(i => i.field_id !== id));

    setToLocalStorage(DEMO_STORAGE_KEYS.FIELDS, filteredFields);
    return true;
}

// ==================== BOOKINGS CRUD ====================

export function getBookings(filters?: { fieldId?: number; date?: string; status?: string }): Booking[] {
    let bookings = getFromLocalStorage<Booking>(DEMO_STORAGE_KEYS.BOOKINGS);

    if (filters?.fieldId) {
        bookings = bookings.filter(b => b.field_id === filters.fieldId);
    }

    if (filters?.date) {
        bookings = bookings.filter(b => b.booking_date === filters.date);
    }

    if (filters?.status) {
        bookings = bookings.filter(b => b.booking_status === filters.status);
    }

    return bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getPendingBookings(searchTerm?: string): Booking[] {
    let bookings = getBookings({ status: 'pending' });

    // Also include unpaid bookings
    const allBookings = getFromLocalStorage<Booking>(DEMO_STORAGE_KEYS.BOOKINGS);
    const pendingPayment = allBookings.filter(b => b.payment_status === 'pending');

    // Merge and dedupe
    const mergedBookings = [...new Map([...bookings, ...pendingPayment].map(b => [b.id, b])).values()];

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return mergedBookings.filter(b =>
            b.customer_name?.toLowerCase().includes(term) ||
            b.customer_phone?.toLowerCase().includes(term) ||
            b.field_name?.toLowerCase().includes(term)
        );
    }

    return mergedBookings;
}

export function getBookingById(id: number): Booking | null {
    const bookings = getFromLocalStorage<Booking>(DEMO_STORAGE_KEYS.BOOKINGS);
    return bookings.find(b => b.id === id) || null;
}

export function createBooking(data: Omit<Booking, 'id' | 'created_at'>): Booking {
    const bookings = getFromLocalStorage<Booking>(DEMO_STORAGE_KEYS.BOOKINGS);
    const now = new Date();
    // Use local time instead of UTC
    const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);

    const newBooking: Booking = {
        ...data,
        id: generateId(bookings),
        created_at: localTime,
        updated_at: localTime,
    };
    bookings.push(newBooking);
    setToLocalStorage(DEMO_STORAGE_KEYS.BOOKINGS, bookings);
    return newBooking;
}

export function updateBooking(id: number, data: Partial<Booking>): Booking | null {
    const bookings = getFromLocalStorage<Booking>(DEMO_STORAGE_KEYS.BOOKINGS);
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;

    const now = new Date();
    const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);

    bookings[index] = {
        ...bookings[index],
        ...data,
        updated_at: localTime,
    };
    setToLocalStorage(DEMO_STORAGE_KEYS.BOOKINGS, bookings);
    return bookings[index];
}

export function updateMultipleBookings(ids: number[], data: Partial<Booking>): void {
    const bookings = getFromLocalStorage<Booking>(DEMO_STORAGE_KEYS.BOOKINGS);
    const updatedBookings = bookings.map(b => {
        if (ids.includes(b.id)) {
            return { ...b, ...data, updated_at: getLocalISOString() };
        }
        return b;
    });
    setToLocalStorage(DEMO_STORAGE_KEYS.BOOKINGS, updatedBookings);
}

// ==================== BARANG CRUD ====================

export function getBarang(filters?: { category?: string; search?: string }): Barang[] {
    let items = getFromLocalStorage<Barang>(DEMO_STORAGE_KEYS.BARANG);
    items = items.filter(i => i.is_available === 1);

    if (filters?.category && filters.category !== 'all') {
        items = items.filter(i => i.category === filters.category);
    }

    if (filters?.search) {
        const term = filters.search.toLowerCase();
        items = items.filter(i => i.nama_barang.toLowerCase().includes(term));
    }

    return items.sort((a, b) => a.nama_barang.localeCompare(b.nama_barang));
}

export function getBarangById(id: number): Barang | null {
    const items = getFromLocalStorage<Barang>(DEMO_STORAGE_KEYS.BARANG);
    return items.find(i => i.id === id) || null;
}

export function updateBarangStock(id: number, newStock: number): void {
    const items = getFromLocalStorage<Barang>(DEMO_STORAGE_KEYS.BARANG);
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
        items[index].stok = newStock;
        setToLocalStorage(DEMO_STORAGE_KEYS.BARANG, items);
    }
}

// ==================== PEMASUKAN CRUD ====================

export function getPemasukan(filters?: { id?: number; invoice?: string }): Pemasukan[] {
    let items = getFromLocalStorage<Pemasukan>(DEMO_STORAGE_KEYS.PEMASUKAN);

    if (filters?.id) {
        items = items.filter(p => p.id === filters.id);
    }

    if (filters?.invoice) {
        items = items.filter(p => p.nomor_invoice === filters.invoice);
    }

    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getPemasukanDetail(pemasukanId?: number): PemasukanDetail[] {
    const details = getFromLocalStorage<PemasukanDetail>(DEMO_STORAGE_KEYS.PEMASUKAN_DETAIL);
    if (pemasukanId) return details.filter(d => d.pemasukan_id === pemasukanId);
    return details;
}

export function generateInvoiceNumber(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const mmyyyy = `${month}${year}`;

    const pemasukan = getPemasukan();
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const currentMonthItems = pemasukan.filter(p => new Date(p.created_at) >= startOfMonth);
    const sequence = String(currentMonthItems.length + 1).padStart(3, '0');

    return `INV/${sequence}/${mmyyyy}`;
}

export function createPemasukan(data: Omit<Pemasukan, 'id' | 'created_at' | 'nomor_invoice'>): Pemasukan {
    const items = getFromLocalStorage<Pemasukan>(DEMO_STORAGE_KEYS.PEMASUKAN);
    const newItem: Pemasukan = {
        ...data,
        id: generateId(items),
        nomor_invoice: generateInvoiceNumber(),
        created_at: getLocalISOString(),
    };
    items.push(newItem);
    setToLocalStorage(DEMO_STORAGE_KEYS.PEMASUKAN, items);
    return newItem;
}

export function createPemasukanDetail(data: Omit<PemasukanDetail, 'id'>): PemasukanDetail {
    const details = getFromLocalStorage<PemasukanDetail>(DEMO_STORAGE_KEYS.PEMASUKAN_DETAIL);
    const newDetail: PemasukanDetail = {
        ...data,
        id: generateId(details),
    };
    details.push(newDetail);
    setToLocalStorage(DEMO_STORAGE_KEYS.PEMASUKAN_DETAIL, details);
    return newDetail;
}

// ==================== SYSTEM PROMPTS CRUD ====================

export function getSystemPrompts(activeOnly?: boolean): SystemPrompt[] {
    let prompts = getFromLocalStorage<SystemPrompt>(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS);

    if (activeOnly) {
        prompts = prompts.filter(p => p.is_active).slice(0, 1);
    }

    return prompts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getSystemPromptById(id: number): SystemPrompt | null {
    const prompts = getFromLocalStorage<SystemPrompt>(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS);
    return prompts.find(p => p.id === id) || null;
}

export function createSystemPrompt(data: Omit<SystemPrompt, 'id' | 'created_at' | 'updated_at' | 'version'>): SystemPrompt {
    const prompts = getFromLocalStorage<SystemPrompt>(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS);
    const newPrompt: SystemPrompt = {
        ...data,
        id: generateId(prompts),
        is_active: false,
        version: 1,
        created_at: getLocalISOString(),
        updated_at: getLocalISOString(),
    };
    prompts.push(newPrompt);
    setToLocalStorage(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS, prompts);
    return newPrompt;
}

export function updateSystemPrompt(id: number, data: Partial<SystemPrompt>): SystemPrompt | null {
    const prompts = getFromLocalStorage<SystemPrompt>(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS);
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return null;

    // If setting this as active, deactivate all others
    if (data.is_active) {
        prompts.forEach((p, i) => {
            if (i !== index) p.is_active = false;
        });
    }

    prompts[index] = {
        ...prompts[index],
        ...data,
        updated_at: getLocalISOString(),
        version: data.prompt_content ? (prompts[index].version || 0) + 1 : prompts[index].version,
    };
    setToLocalStorage(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS, prompts);
    return prompts[index];
}

export function deleteSystemPrompt(id: number): boolean {
    if (id === 1) return false; // Cannot delete default prompt

    const prompts = getFromLocalStorage<SystemPrompt>(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS);
    const filteredPrompts = prompts.filter(p => p.id !== id);
    if (filteredPrompts.length === prompts.length) return false;
    setToLocalStorage(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS, filteredPrompts);
    return true;
}

// ==================== RESET MECHANISM ====================

export function resetDemoData(): void {
    if (!isBrowser()) return;

    // Clear all demo data
    Object.values(DEMO_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });

    console.log('Demo data cleared. Refresh the page to re-seed from Supabase.');
}

// Export for seeding
export function seedDemoData(data: {
    sports: Sport[];
    fields: Field[];
    fieldImages: FieldImage[];
    bookings: Booking[];
    barang: Barang[];
    pemasukan: Pemasukan[];
    pemasukanDetail: PemasukanDetail[];
    systemPrompts: SystemPrompt[];
}): void {
    if (!isBrowser()) return;

    setToLocalStorage(DEMO_STORAGE_KEYS.SPORTS, data.sports);
    setToLocalStorage(DEMO_STORAGE_KEYS.FIELDS, data.fields);
    setToLocalStorage(DEMO_STORAGE_KEYS.FIELD_IMAGES, data.fieldImages);
    setToLocalStorage(DEMO_STORAGE_KEYS.BOOKINGS, data.bookings);
    setToLocalStorage(DEMO_STORAGE_KEYS.BARANG, data.barang);
    setToLocalStorage(DEMO_STORAGE_KEYS.PEMASUKAN, data.pemasukan);
    setToLocalStorage(DEMO_STORAGE_KEYS.PEMASUKAN_DETAIL, data.pemasukanDetail);
    setToLocalStorage(DEMO_STORAGE_KEYS.SYSTEM_PROMPTS, data.systemPrompts);
    setDemoInitialized();

    console.log('Demo data seeded successfully.');
}
