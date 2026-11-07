import apiClient from '../../../services/apiClient.js';

/**
 * Note API service communicating with /api/v1/notes.
 */

const NOTES_ENDPOINT = '/notes';

/**
 * Fetch notes with filtering and pagination.
 * @param {Object} [params]
 * @returns {Promise<{ success: boolean, data: Array, meta: Object }>}
 */
export async function getNotes(params = {}) {
  const response = await apiClient.get(NOTES_ENDPOINT, { params });
  return response.data;
}

/**
 * Fetch all root-level notes (parentId = null).
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export async function getRootNotes() {
  return getNotes({ parentId: 'null' });
}

/**
 * Fetch child notes of a parent note.
 * @param {string} parentId - Parent note UUID
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export async function getNoteChildren(parentId) {
  return getNotes({ parentId });
}

/**
 * Fetch a single note by UUID.
 * @param {string} noteId - Note UUID
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export async function getNoteById(noteId) {
  const response = await apiClient.get(`${NOTES_ENDPOINT}/${noteId}`);
  return response.data;
}

/**
 * Create a new note or folder.
 * @param {Object} noteData
 * @param {string} noteData.title
 * @param {string} [noteData.type]
 * @param {Object} [noteData.content]
 * @param {string} [noteData.parentId]
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export async function createNote(noteData) {
  const response = await apiClient.post(NOTES_ENDPOINT, noteData);
  return response.data;
}

/**
 * Partially update note (title, content, tags, favorite, archive).
 * @param {string} noteId - Note UUID
 * @param {Object} updateData
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export async function updateNote(noteId, updateData) {
  const response = await apiClient.patch(`${NOTES_ENDPOINT}/${noteId}`, updateData);
  return response.data;
}

/**
 * Move a note to a new parent location.
 * @param {string} noteId - Note UUID
 * @param {string|null} newParentId - Target parent UUID or null for root
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export async function moveNote(noteId, newParentId) {
  const response = await apiClient.patch(`${NOTES_ENDPOINT}/${noteId}/move`, { newParentId });
  return response.data;
}

/**
 * Delete a note.
 * @param {string} noteId - Note UUID
 * @param {boolean} [cascade=false] - Whether to recursively delete descendants
 * @returns {Promise<void>}
 */
export async function deleteNote(noteId, cascade = false) {
  const response = await apiClient.delete(`${NOTES_ENDPOINT}/${noteId}`, {
    params: { cascade },
  });
  return response.data;
}

/**
 * Export note as Markdown or JSON.
 * @param {string} noteId
 * @param {'markdown'|'json'} [format='markdown']
 * @returns {Promise<Object>}
 */
export async function exportNote(noteId, format = 'markdown') {
  const response = await apiClient.get(`${NOTES_ENDPOINT}/${noteId}/export`, {
    params: { format },
  });
  return response.data.data;
}

/**
 * Import a note.
 * @param {Object} data - { title, markdown, jsonContent }
 * @returns {Promise<Object>}
 */
export async function importNote(data) {
  const response = await apiClient.post(`${NOTES_ENDPOINT}/import`, data);
  return response.data.data;
}
