exports.trackClick = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // find URL
    const { data: url, error: findError } = await supabase
      .from("short_urls")
      .select("*")
      .eq("short_code", shortCode)
      .single();

    if (findError || !url) {
      return res.status(404).json({ error: "URL not found" });
    }

    // increment clicks
    await supabase
      .from("short_urls")
      .update({ clicks: url.clicks + 1 })
      .eq("id", url.id);

    // log click
    await supabase.from("url_clicks").insert([
      {
        short_url_id: url.id,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        referrer: req.headers["referer"] || null,
      },
    ]);

    // redirect
    return res.redirect(url.original_url);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
