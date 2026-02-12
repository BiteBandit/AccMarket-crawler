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

    const APIFY_TOKEN = process.env.APIFY_TOKEN;

    if (!APIFY_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing APIFY_TOKEN" }),
      };
    }

    // 🔥 Run Apify actor
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
        body: JSON.stringify({ error: "Apify request failed" }),
      };
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Instagram profile not found" }),
      };
    }

    const profile = data[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        username: profile.username,
        bio: profile.biography,
        profilePic: profile.profilePicUrl,
        followers: profile.followersCount,
        following: profile.followsCount,
        posts: profile.postsCount,
        verified: profile.verified,
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
