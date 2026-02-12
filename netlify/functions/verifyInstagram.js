export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { username } = JSON.parse(event.body || "{}");

    if (!username) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Enter a valid Instagram username" }),
      };
    }

    const API_KEY = process.env.SCRAPINGBEE_API_KEY;

    if (!API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "SCRAPINGBEE_API_KEY not set in Netlify" }),
      };
    }

    // Encode Instagram URL properly
    const targetUrl = encodeURIComponent(
      `https://www.instagram.com/${username}/`
    );

    const scrapingUrl = `https://app.scrapingbee.com/api/v1/?api_key=${API_KEY}&url=${targetUrl}&render_js=true&premium_proxy=true&country_code=us`;

    const response = await fetch(scrapingUrl);

    // 🔥 Show real ScrapingBee error if it fails
    if (!response.ok) {
      const errorText = await response.text();

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "ScrapingBee request failed",
          status: response.status,
          details: errorText,
        }),
      };
    }

    const html = await response.text();

    // Try safer extraction
    const bioMatch = html.match(/"biography":"([^"]*)"/);
    const picMatch = html.match(/"profile_pic_url_hd":"([^"]*)"/);

    const bio = bioMatch ? bioMatch[1] : null;
    const profilePic = picMatch
      ? picMatch[1].replace(/\\u0026/g, "&")
      : null;

    if (!bio && !profilePic) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Instagram profile found but data extraction failed",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        bio,
        profilePic,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: err.message,
      }),
    };
  }
}
