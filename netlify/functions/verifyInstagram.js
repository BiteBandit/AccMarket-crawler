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

    const response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "x-ig-app-id": "936619743392459"
        }
      }
    );

    if (!response.ok) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Profile not found or blocked" }),
      };
    }

    const data = await response.json();

    const user = data.data.user;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        bio: user.biography,
        profilePic: user.profile_pic_url_hd,
        followers: user.edge_followed_by.count
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch Instagram data",
        details: err.message,
      }),
    };
  }
  }
