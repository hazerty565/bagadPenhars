/**
 * Types partagés entre le serveur et le client.
 */

export interface ApiError {
	code: string;
	message: string;
	status: number;
}

export interface ApiSuccess<T = unknown> {
	success: true;
	data?: T;
	message?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
}
