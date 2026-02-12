export async function handler(event) {
  // 1. Handle CORS Pre-flight & Method Validation
  const headers = {
    "Access-Control-Allow-Origin": "*", // Change this to your domain in production
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { username } = JSON.parse(event.body || "{}");

    if (!username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Enter a valid Instagram username" }),
      };
    }

    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    if (!APIFY_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error: Missing Token" }),
      };
    }

    // 2. Call Apify (Secured & Optimized)
    // Using run-sync-get-dataset-items but passing token via Authorization header
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${APIFY_TOKEN}`
        },
        body: JSON.stringify({
          usernames: [username.replace('@', '')], // Strip @ if user included it
          resultsLimit: 1
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Apify Error:", errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: "Apify request failed", details: errorText }),
      };
    }

    const data = await response.json();

    // 3. Validate Data Presence
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Instagram profile not found" }),
      };
    }

    const profile = data[0];

    // 4. Return Formatted Data
    return {
      statusCode: 200,
      headers,
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
    console.error("Function Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: err.message,
      }),
    };
  }
    }
