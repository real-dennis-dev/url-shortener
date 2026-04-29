// controllers/urlController.js
const supabase = require("../config/supabase");
const crypto = require("crypto");

// helper to generate short code
const generateShortCode = (length = 6) => {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
};

exports.createShortUrl = async (req, res) => {
  try {
    const { original_url, custom_alias, title, description, expires_at } =
      req.body;

    const user = req.user || null; // if using auth middleware

    if (!original_url) {
      return res.status(400).json({ error: "Original URL is required" });
    }

    let short_code = generateShortCode();

    // If custom alias is provided, use it instead
    if (custom_alias) {
      short_code = custom_alias;
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("short_urls")
      .insert([
        {
          user_id: user?.id || null,
          original_url,
          short_code,
          custom_alias: custom_alias || null,
          title,
          description,
          expires_at,
        },
      ])
      .select()
      .single();

    if (error) {
      // handle duplicate alias/code
      if (error.code === "23505") {
        return res.status(409).json({
          error: "Short code or custom alias already exists",
        });
      }

      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Short URL created successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
