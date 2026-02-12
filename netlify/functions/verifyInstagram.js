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
        body: JSON.stringify({ error: "Username is required" }),
      };
    }

    const APIFY_TOKEN = process.env.APIFY_TOKEN;

    if (!APIFY_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing APIFY_TOKEN in environment variables" }),
      };
    }

    // 🔥 Call Apify Instagram scraper actor
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernames: [username],
        }),
      }
    );

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch from Apify" }),
      };
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Profile not found" }),
      };
    }

    const profile = data[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        bio: profile.biography,
        profilePic: profile.profilePicUrl,
        followers: profile.followersCount,
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
