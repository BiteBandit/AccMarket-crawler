import chromium from "chrome-aws-lambda";

export async function handler(event, context) {
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

    const browser = await chromium.puppeteer.launch({
      args: [
        ...chromium.args,
        "--disable-blink-features=AutomationControlled",
      ],
      defaultViewport: {
        width: 1280,
        height: 800,
      },
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // ✅ Set realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // ✅ Extra headers
    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9",
    });

    // ✅ Remove webdriver flag
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    const url = `https://www.instagram.com/${username}/`;

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // small delay (helps avoid bot detection)
    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:description"]');
      const bio = meta ? meta.content : null;

      const img = document.querySelector("img");
      const profilePic = img ? img.src : null;

      return { bio, profilePic };
    });

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        bio: data.bio,
        profilePic: data.profilePic,
      }),
    };
  } catch (error) {
    console.error("Scrape Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch Instagram data",
        details: error.message,
      }),
    };
  }
}
