import fetch from "node-fetch"; // Netlify function Node environment

export async function handler(event, context) {
  try {
    const { username } = JSON.parse(event.body);

    if (!username) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Username is required" }),
      };
    }

    // Instagram public profile URL
    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;

    // Fetch the profile data
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Profile not found" }),
      };
    }

    const json = await response.json();

    // Instagram v2 structure for user
    const user = json.graphql?.user || json?.graphql?.user;

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Could not extract user info" }),
      };
    }

    const bio = user.biography || "";
    const profilePicUrl = user.profile_pic_url_hd || user.profile_pic_url;

    return {
      statusCode: 200,
      body: JSON.stringify({ bio, profilePicUrl }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
}
