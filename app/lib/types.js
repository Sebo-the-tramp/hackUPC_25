/**
 * Common types used across the application
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} name - User name
 */

/**
 * @typedef {Object} QuestionAnswer
 * @property {string} question - The question text
 * @property {string} answer - The user's answer
 */

/**
 * @typedef {Object} Profile
 * @property {number} id - Profile ID
 * @property {number} user_id - User ID
 * @property {number} trip_id - Trip ID
 * @property {Array<QuestionAnswer>} questions - Array of question-answer pairs
 */

/**
 * @typedef {Object} Message
 * @property {number} id - Message ID
 * @property {number} trip_id - Trip ID
 * @property {number} user_id - User ID
 * @property {string} content - Message content
 * @property {string} timestamp - Message timestamp
 * @property {string} type - Message type (user or ai)
 */

/**
 * @typedef {Object} Trip
 * @property {number} id - Trip ID
 * @property {string} name - Trip name
 * @property {Array<User>} users - Users in the trip
 * @property {Array<Message>} [messages] - Messages in the trip (optional)
 */

export {};