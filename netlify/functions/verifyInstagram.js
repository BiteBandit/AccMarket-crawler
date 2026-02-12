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
        body: JSON.stringify({ error: "SCRAPINGBEE_API_KEY not set" }),
      };
    }

    const targetUrl = encodeURIComponent(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`
    );

    const scrapingUrl =
      `https://app.scrapingbee.com/api/v1/?api_key=${API_KEY}` +
      `&url=${targetUrl}` +
      `&premium_proxy=true` +
      `&country_code=us` +
      `&forward_headers=true`;

    const response = await fetch(scrapingUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "x-ig-app-id": "936619743392459",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "ScrapingBee request failed",
          status: response.status,
          details: errText,
        }),
      };
    }

    const json = await response.json();

    if (!json?.data?.user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Instagram profile not found",
        }),
      };
    }

    const user = json.data.user;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        bio: user.biography,
        profilePic: user.profile_pic_url_hd,
        followers: user.edge_followed_by.count,
        verified: user.is_verified,
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
