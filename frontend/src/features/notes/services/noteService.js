import apiClient from '../../../services/apiClient.js';

/**
 * Note API service.
 * Handles all HTTP communication for the notes feature.
 * Business logic belongs in hooks or store, not here.
 */

const NOTES_ENDPOINT = '/notes';

/**
 * Fetch all root-level notes (notes with no parent).
 * @returns {Promise<Object>} API response with notes array
 */
export async function getRootNotes() {
  const response = await apiClient.get(`${NOTES_ENDPOINT}?parentId=null`);
  return response.data;
}

/**
 * Fetch a single note by ID.
 * @param {string} noteId - Note ObjectId
 * @returns {Promise<Object>} API response with note object
 */
export async function getNoteById(noteId) {
  const response = await apiClient.get(`${NOTES_ENDPOINT}/${noteId}`);
  return response.data;
}

/**
 * Fetch child notes of a given parent.
 * @param {string} parentId - Parent note ObjectId
 * @returns {Promise<Object>} API response with children array
 */
export async function getNoteChildren(parentId) {
  const response = await apiClient.get(`${NOTES_ENDPOINT}/${parentId}/children`);
  return response.data;
}

/**
 * Create a new note.
 * @param {Object} noteData - Note creation payload
 * @param {string} noteData.title
 * @param {string} [noteData.content]
 * @param {string} [noteData.parentId]
 * @param {string} [noteData.type] - 'NOTE' or 'FOLDER'
 * @returns {Promise<Object>} API response with created note
 */
export async function createNote(noteData) {
  const response = await apiClient.post(NOTES_ENDPOINT, noteData);
  return response.data;
}

/**
 * Update an existing note.
 * @param {string} noteId - Note ObjectId
 * @param {Object} updateData - Partial note data to update
 * @returns {Promise<Object>} API response with updated note
 */
export async function updateNote(noteId, updateData) {
  const response = await apiClient.patch(`${NOTES_ENDPOINT}/${noteId}`, updateData);
  return response.data;
}

/**
 * Delete a note by ID.
 * @param {string} noteId - Note ObjectId
 * @returns {Promise<Object>} API response
 */
export async function deleteNote(noteId) {
  const response = await apiClient.delete(`${NOTES_ENDPOINT}/${noteId}`);
  return response.data;
}

/**
 * Move a note to a new parent.
 * @param {string} noteId - Note ObjectId to move
 * @param {string|null} newParentId - Target parent ID, or null for root
 * @returns {Promise<Object>} API response with updated note
 */
export async function moveNote(noteId, newParentId) {
  const response = await apiClient.patch(`${NOTES_ENDPOINT}/${noteId}/move`, { newParentId });
  return response.data;
}
