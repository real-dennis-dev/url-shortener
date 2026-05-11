import Article from "../models/article.js";
import User from "../models/user.js";
import { Chat, Group } from "../models/Chat.js";
import Message from "../models/message.js";
/** -----------------------------
 *  HELPERS
 * ----------------------------- */

// For fuzzy search (autocomplete)
const fuzzy = (q) => new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

/** -----------------------------
 *  AUTOCOMPLETE (For typing)
 * ----------------------------- */

/**
 * Live autocomplete for user search
 * @param {string} q
 */
export const autocompleteUsers = async (q) => {
  if (!q) return [];

  return await User.find({ username: fuzzy(q) }, "username profileImage")
    .limit(8)
    .lean();
};

/**
 * Live autocomplete for article title search
 * @param {string} q
 */
export const autocompleteArticles = async (q) => {
  if (!q) return [];

  return await Article.find(
    {
      status: "published",
      title: fuzzy(q),
    },
    "title thumbnail"
  )
    .limit(8)
    .lean();
};

/** -----------------------------
 *  FULL ARTICLE SEARCH
 * ----------------------------- */

/**
 * Full search for articles (title, body, tags, comments, author)
 * Supports endless scroll — pass skip & limit
 */
export const headerSearch = async (query, limit = 10) => {
  if (!query || !query.trim()) {
    return { type: "empty", results: [] };
  }

  const trimmed = query.trim();
  const isPhrase = trimmed.includes(" ");
  const regex = new RegExp(trimmed, "i");

  // 🔹 ONE WORD → USER AUTOCOMPLETE
  if (!isPhrase) {
    const users = await User.find({
      username: regex,
    })
      .select("username profileImage _id")
      .limit(limit)
      .lean();

    return {
      type: "users",
      results: users,
    };
  }

  // 🔹 PHRASE → ARTICLE SEARCH
  const articles = await Article.find(
    {
      status: "published",
      $or: [
        { slug: regex },
        { title: regex },
        { excerpt: regex },
        { content: regex },
        { tags: regex },
      ],
    },
    {
      title: 1,
      slug: 1,
      excerpt: 1,
    }
  )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    type: "articles",
    results: articles,
  };
};

/** -----------------------------
 *  AUTHOR PROFILE SEARCH
 * ----------------------------- */

/**
 * Search only inside one author's content
 */
export const searchAuthorArticles = async (
  authorId,
  query,
  skip = 0,
  limit = 10
) => {
  if (!query) return [];

  return await Article.find({
    authors: authorId,
    status: "published",
    $or: [
      { title: fuzzy(query) },
      { content: fuzzy(query) },
      { tags: fuzzy(query) },
      { "comments.text": fuzzy(query) },
    ],
  })
    .skip(skip)
    .limit(limit)
    .populate("authors", "username profileImage")
    .lean();
};

/** -----------------------------
 *  USER SEARCH (FULL)
 * ----------------------------- */
export const searchUsers = async (query, skip = 0, limit = 10) => {
  if (!query) return [];

  return await User.find(
    {
      $or: [
        { $text: { $search: query } },
        { username: fuzzy(query) },
        { bio: fuzzy(query) },
      ],
    },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit)
    .select("username bio profileImage")
    .lean();
};

/** -----------------------------
 *  GLOBAL SEARCH
 * ----------------------------- */
export const globalSearch = async (query) => {
  const [articles, users] = await Promise.all([
    searchArticles(query, 0, 5),
    searchUsers(query, 0, 5),
  ]);

  return { articles, users };
};
