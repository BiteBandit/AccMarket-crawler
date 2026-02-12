import chromium from "chrome-aws-lambda";

export async function handler(event, context) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { username } = JSON.parse(event.body || "{}");
    if (!username) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing username" }),
      };
    }

    // Launch browser using chrome-aws-lambda
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: "networkidle2" });

    // Get bio
    const bio = await page.$eval('meta[property="og:description"]', el => el.content);

    // Get profile picture
    const img = await page.$eval('img[alt*="profile picture"]', el => el.src);

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ bio, img }),
    };
  } catch (err) {
    console.error("Error in verifyInstagram:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch Instagram data", details: err.message }),
    };
  }
}
