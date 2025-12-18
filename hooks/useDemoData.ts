'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDemoContext } from '@/contexts/DemoContext';
import * as demoStore from '@/lib/demoStore';

// Re-export types
export type { Sport, Field, FieldImage, Booking, Barang, Pemasukan, PemasukanDetail, SystemPrompt } from '@/lib/demoStore';

/**
 * Custom hook for Demo Mode CRUD operations
 * 
 * This hook provides direct access to localStorage operations
 * for DEMO MODE without going through API routes.
 */

// ==================== SPORTS HOOKS ====================

export function useSportsDemo() {
    const { isInitialized } = useDemoContext();
    const [sports, setSports] = useState<demoStore.Sport[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSports = useCallback((showAll: boolean = true) => {
        if (!isInitialized) return;
        const data = demoStore.getSports(showAll);
        setSports(data);
        setLoading(false);
    }, [isInitialized]);

    const createSport = useCallback((data: Omit<demoStore.Sport, 'id'>) => {
        const newSport = demoStore.createSport(data);
        setSports(prev => [...prev, newSport]);
        return newSport;
    }, []);

    const updateSport = useCallback((id: number, data: Partial<demoStore.Sport>) => {
        const updated = demoStore.updateSport(id, data);
        if (updated) {
            setSports(prev => prev.map(s => s.id === id ? updated : s));
        }
        return updated;
    }, []);

    const deleteSport = useCallback((id: number) => {
        // Check for related fields first
        const fields = demoStore.getFields({ sportId: id });
        if (fields.length > 0) {
            return { success: false, error: 'Cannot delete sport with existing fields' };
        }

        const success = demoStore.deleteSport(id);
        if (success) {
            setSports(prev => prev.filter(s => s.id !== id));
        }
        return { success };
    }, []);

    useEffect(() => {
        if (isInitialized) {
            loadSports(true);
        }
    }, [isInitialized, loadSports]);

    return {
        sports,
        loading,
        loadSports,
        createSport,
        updateSport,
        deleteSport,
    };
}

// ==================== FIELDS HOOKS ====================

export function useFieldsDemo() {
    const { isInitialized } = useDemoContext();
    const [fields, setFields] = useState<demoStore.Field[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFields = useCallback((filters?: Parameters<typeof demoStore.getFields>[0]) => {
        if (!isInitialized) return;
        const data = demoStore.getFields(filters);

        // Enrich with sport info and images
        const fieldImages = demoStore.getFieldImages();
        const enrichedFields = data.map(field => {
            const sport = demoStore.getSportById(field.sport_id);
            const images = fieldImages.filter(i => i.field_id === field.id).map(i => i.url_image);
            return {
                ...field,
                sport_name: sport?.sport_name || null,
                sport_type: sport?.sport_type || null,
                images,
                url_image: images[0] || field.url_image,
            };
        });

        setFields(enrichedFields as any);
        setLoading(false);
    }, [isInitialized]);

    const createField = useCallback((data: Omit<demoStore.Field, 'id'>, images?: string[]) => {
        const newField = demoStore.createField(data, images);
        const sport = demoStore.getSportById(data.sport_id);
        const enriched = {
            ...newField,
            sport_name: sport?.sport_name || null,
            sport_type: sport?.sport_type || null,
            images: images || [],
        };
        setFields(prev => [...prev, enriched as any]);
        return enriched;
    }, []);

    const updateField = useCallback((id: number, data: Partial<demoStore.Field>, images?: string[]) => {
        const updated = demoStore.updateField(id, data, images);
        if (updated) {
            const sport = demoStore.getSportById(data.sport_id || updated.sport_id);
            const fieldImages = demoStore.getFieldImages(id);
            const enriched = {
                ...updated,
                sport_name: sport?.sport_name || null,
                sport_type: sport?.sport_type || null,
                images: fieldImages.map(i => i.url_image),
            };
            setFields(prev => prev.map(f => f.id === id ? enriched as any : f));
        }
        return updated;
    }, []);

    const deleteField = useCallback((id: number) => {
        // Check for related bookings first
        const bookings = demoStore.getBookings({ fieldId: id });
        if (bookings.length > 0) {
            return { success: false, error: 'Cannot delete field with existing bookings' };
        }

        const success = demoStore.deleteField(id);
        if (success) {
            setFields(prev => prev.filter(f => f.id !== id));
        }
        return { success };
    }, []);

    useEffect(() => {
        if (isInitialized) {
            loadFields();
        }
    }, [isInitialized, loadFields]);

    return {
        fields,
        loading,
        loadFields,
        createField,
        updateField,
        deleteField,
    };
}

// ==================== BOOKINGS HOOKS ====================

export function useBookingsDemo() {
    const { isInitialized } = useDemoContext();
    const [bookings, setBookings] = useState<demoStore.Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBookings = useCallback((filters?: Parameters<typeof demoStore.getBookings>[0]) => {
        if (!isInitialized) return;
        const data = demoStore.getBookings(filters);
        setBookings(data);
        setLoading(false);
    }, [isInitialized]);

    const loadPendingBookings = useCallback((searchTerm?: string) => {
        if (!isInitialized) return;
        const data = demoStore.getPendingBookings(searchTerm);
        setBookings(data);
        setLoading(false);
    }, [isInitialized]);

    const createBooking = useCallback((data: Omit<demoStore.Booking, 'id' | 'created_at'>) => {
        // Check for conflicts
        const existingBookings = demoStore.getBookings({
            fieldId: data.field_id,
            date: data.booking_date,
        }).filter(b => b.booking_status !== 'cancelled');

        for (const booking of existingBookings) {
            const hasConflict = data.time_slots.some(slot => booking.time_slots.includes(slot));
            if (hasConflict) {
                return { success: false, error: 'Time slots already booked' };
            }
        }

        const newBooking = demoStore.createBooking(data);
        setBookings(prev => [newBooking, ...prev]);
        return { success: true, data: newBooking };
    }, []);

    const updateBooking = useCallback((id: number, data: Partial<demoStore.Booking>) => {
        const updated = demoStore.updateBooking(id, data);
        if (updated) {
            setBookings(prev => prev.map(b => b.id === id ? updated : b));
        }
        return updated;
    }, []);

    const checkAvailability = useCallback((fieldId: number, date: string) => {
        const bookings = demoStore.getBookings({ fieldId, date })
            .filter(b => b.booking_status !== 'cancelled');

        const bookedSlots = bookings.flatMap(b => b.time_slots);
        return [...new Set(bookedSlots)];
    }, []);

    useEffect(() => {
        if (isInitialized) {
            loadBookings();
        }
    }, [isInitialized, loadBookings]);

    return {
        bookings,
        loading,
        loadBookings,
        loadPendingBookings,
        createBooking,
        updateBooking,
        checkAvailability,
    };
}

// ==================== BARANG HOOKS ====================

export function useBarangDemo() {
    const { isInitialized } = useDemoContext();
    const [items, setItems] = useState<demoStore.Barang[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBarang = useCallback((filters?: Parameters<typeof demoStore.getBarang>[0]) => {
        if (!isInitialized) return;
        const data = demoStore.getBarang(filters);
        setItems(data);
        setLoading(false);
    }, [isInitialized]);

    useEffect(() => {
        if (isInitialized) {
            loadBarang();
        }
    }, [isInitialized, loadBarang]);

    return {
        items,
        loading,
        loadBarang,
    };
}

// ==================== PEMASUKAN HOOKS ====================

export function usePemasukanDemo() {
    const { isInitialized } = useDemoContext();
    const [pemasukanList, setPemasukanList] = useState<demoStore.Pemasukan[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPemasukan = useCallback(() => {
        if (!isInitialized) return;
        const data = demoStore.getPemasukan();
        setPemasukanList(data);
        setLoading(false);
    }, [isInitialized]);

    const processPayment = useCallback((payload: {
        amount: number;
        user_name?: string;
        booking_ids?: number[];
        items?: { type: string; id: number; name: string; price: number; quantity: number }[];
    }) => {
        const { amount, user_name, booking_ids = [], items = [] } = payload;

        // Get booking details
        const bookingDetails = booking_ids.map(id => demoStore.getBookingById(id)).filter(Boolean);

        // Create pemasukan
        const payment = demoStore.createPemasukan({
            id_booking: booking_ids[0],
            amount,
            created_by: user_name || 'System',
            updated_by: user_name || 'System',
        });

        // Add booking details
        for (const booking of bookingDetails) {
            if (booking) {
                demoStore.createPemasukanDetail({
                    pemasukan_id: payment.id,
                    nomor_invoice: payment.nomor_invoice,
                    barang_id: undefined,
                    nama_barang: `Sewa Lapangan: ${booking.field_name} (${booking.booking_date})`,
                    harga_satuan: booking.total_price,
                    qty: 1,
                    subtotal: booking.total_price,
                });
            }
        }

        // Update booking status
        if (booking_ids.length > 0) {
            demoStore.updateMultipleBookings(booking_ids, {
                payment_status: 'paid',
                booking_status: 'confirmed',
            });
        }

        // Process barang items
        for (const item of items) {
            if (item.type === 'barang') {
                const currentItem = demoStore.getBarangById(item.id);
                if (currentItem) {
                    const qty = item.quantity || 1;
                    const newStock = Math.max(0, currentItem.stok - qty);
                    demoStore.updateBarangStock(item.id, newStock);

                    demoStore.createPemasukanDetail({
                        pemasukan_id: payment.id,
                        nomor_invoice: payment.nomor_invoice,
                        barang_id: currentItem.id,
                        nama_barang: currentItem.nama_barang,
                        harga_satuan: currentItem.harga,
                        qty,
                        subtotal: currentItem.harga * qty,
                    });
                }
            }
        }

        setPemasukanList(prev => [payment, ...prev]);
        return { success: true, payment };
    }, []);

    useEffect(() => {
        if (isInitialized) {
            loadPemasukan();
        }
    }, [isInitialized, loadPemasukan]);

    return {
        pemasukanList,
        loading,
        loadPemasukan,
        processPayment,
    };
}
